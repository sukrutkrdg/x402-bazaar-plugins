"""LangChain tool for x402 Bazaar — token-verdict pre-trade safety check.

The tool works with no wallet by default (1 free call/day per IP). When a funded
EVM wallet is configured (env ``X402_EVM_PRIVATE_KEY`` and the optional ``pay``
extra installed), it pays $0.03 USDC per call over x402 on Base instead.
"""

import os
from typing import Optional

import requests
from pydantic import BaseModel, Field
from langchain_core.tools import tool

TOKEN_VERDICT_URL = "https://402.com.tr/api/x402/token-verdict"
BASE_CHAIN = "eip155:8453"
USDC_BASE = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"


class TokenVerdictInput(BaseModel):
    address: str = Field(
        ...,
        pattern=r"^0x[a-fA-F0-9]{40}$",
        description="Base ERC-20 token address (0x + 40 hex chars).",
    )
    amount_usd: Optional[float] = Field(
        None,
        description="Intended trade size in USD; tunes the recommended max safe size.",
    )


def _paid_session():
    """Return an x402-paying ``requests`` session if a funded wallet is
    configured (env ``X402_EVM_PRIVATE_KEY`` + the ``pay`` extra installed),
    otherwise ``None`` so the tool falls back to the free daily call.

    The x402 Python client API has drifted across versions, so this imports
    defensively and returns ``None`` on any import/constructor mismatch — the
    free tier keeps the tool usable regardless.
    """
    pk = os.getenv("X402_EVM_PRIVATE_KEY")
    if not pk:
        return None
    try:
        from eth_account import Account  # type: ignore
        from x402.clients import x402Client  # type: ignore
        from x402.http.clients import x402_requests  # type: ignore
        from x402.mechanisms.evm import EthAccountSigner  # type: ignore
        from x402.mechanisms.evm.exact.register import register_exact_evm_client  # type: ignore

        client = x402Client()
        register_exact_evm_client(client, EthAccountSigner(Account.from_key(pk)))
        return x402_requests(client)
    except Exception:
        return None


@tool(args_schema=TokenVerdictInput)
def token_verdict(address: str, amount_usd: Optional[float] = None) -> dict:
    """Pre-trade safety check for a Base (eip155:8453) ERC-20 token before buying
    or approving it. Returns a SAFE / CAUTION / AVOID / UNKNOWN verdict with
    confidence, the reasons behind it, and a recommended max position size
    (honeypot, sell-tax, owner powers, exit-liquidity, B20 seize/freeze). Powered
    by x402 Bazaar: $0.03 USDC/call over x402, or 1 free call/day per IP."""
    params: dict = {"address": address}
    if amount_usd is not None:
        params["amountUsd"] = amount_usd

    session = _paid_session()
    try:
        if session is not None:
            with session as s:
                r = s.get(TOKEN_VERDICT_URL, params=params, timeout=40)
        else:
            params["free"] = "1"
            r = requests.get(TOKEN_VERDICT_URL, params=params, timeout=40)
    except Exception as e:  # network error
        return {"error": "request_failed", "message": str(e)}

    if r.status_code == 402:
        return {
            "error": "payment_required",
            "chain": BASE_CHAIN,
            "asset": USDC_BASE,
            "message": (
                "Set X402_EVM_PRIVATE_KEY (funded USDC on Base) and install the "
                "`pay` extra to pay, or omit for the free daily call."
            ),
        }
    r.raise_for_status()
    body = r.json()
    # Free tier wraps the result in {"data": ...}; the paid x402 call returns it raw.
    return body.get("data", body) if isinstance(body, dict) else body
