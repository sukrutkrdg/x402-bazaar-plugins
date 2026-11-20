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

BASE_URL = "https://402.com.tr/api/x402"
TOKEN_VERDICT_URL = f"{BASE_URL}/token-verdict"  # back-compat
BASE_CHAIN = "eip155:8453"
USDC_BASE = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"

# token-verdict endpoint + token param per chain. All settle in USDC on Base.
CHAIN_ENDPOINTS = {
    "base": ("token-verdict", "address"),
    "arbitrum": ("arb-token-verdict", "address"),
    "solana": ("sol-token-verdict", "mint"),
}


class TokenVerdictInput(BaseModel):
    address: str = Field(
        ...,
        pattern=r"^(0x[a-fA-F0-9]{40}|[1-9A-HJ-NP-Za-km-z]{32,44})$",
        description="A Base/Arbitrum 0x… token address or a Solana base58 mint.",
    )
    chain: Optional[str] = Field(
        None,
        description="Which chain: 'base' (default), 'arbitrum', or 'solana'. A base58 token implies solana.",
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
def token_verdict(address: str, chain: Optional[str] = None, amount_usd: Optional[float] = None) -> dict:
    """Pre-trade safety check for a Base, Arbitrum or Solana token before buying or
    approving it. Pass chain='base'|'arbitrum'|'solana' (default base; a base58
    token implies solana). Returns a SAFE / CAUTION / AVOID / UNKNOWN verdict with
    confidence, the reasons, and a recommended max position size (honeypot,
    sell-tax, owner/mint/freeze powers, LP-lock, holder concentration, B20
    seize/freeze). x402 Bazaar: $0.03 USDC/call over x402 (settles on Base), or 1
    free call/day per IP."""
    c = chain or ("base" if address.startswith("0x") else "solana")
    endpoint, param = CHAIN_ENDPOINTS.get(c, CHAIN_ENDPOINTS["base"])
    url = f"{BASE_URL}/{endpoint}"
    params: dict = {param: address}
    if amount_usd is not None:
        params["amountUsd"] = amount_usd

    session = _paid_session()
    try:
        if session is not None:
            with session as s:
                r = s.get(url, params=params, timeout=40)
        else:
            params["free"] = "1"
            r = requests.get(url, params=params, timeout=40)
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
