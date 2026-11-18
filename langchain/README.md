# langchain-x402bazaar

A [LangChain](https://python.langchain.com) tool for [x402 Bazaar](https://402.com.tr) —
a **pre-trade token safety verdict** for any Base ERC-20, for AI agents.

`token_verdict` returns one **SAFE / CAUTION / AVOID / UNKNOWN** answer with the
reasons behind it and a recommended max position size, distilling the full
pre-trade stack (honeypot, sell-tax, owner powers, exit-liquidity, deployer, B20
seize/freeze). Paid per call over [x402](https://x402.org) ($0.03 USDC on Base),
or **1 free call/day per IP** — no wallet needed to start.

## Install

```bash
pip install langchain-x402bazaar
# optional, to pay per call with your own wallet instead of the free tier:
pip install "langchain-x402bazaar[pay]"
```

## Use

```python
from langchain_x402bazaar import token_verdict

# Works with no wallet (free daily call):
print(token_verdict.invoke({"address": "0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed"}))

# In an agent:
from langchain.agents import create_tool_calling_agent
agent = create_tool_calling_agent(llm, [token_verdict, ...], prompt)
```

### Paying per call

Set a funded EVM wallet (USDC on Base) and install the `pay` extra:

```bash
export X402_EVM_PRIVATE_KEY=0x...
```

When present, each call pays $0.03 USDC over x402; otherwise the tool uses the
free daily call.

## Output

```json
{
  "address": "0x4ed4…efed",
  "verdict": "CAUTION",
  "confidence": "high",
  "headline": "Tradeable, but with real risks — size down and stay exit-ready.",
  "reasons": ["[owner-powers] mutable owner controls remain: is_mintable", "…"],
  "recommendedMaxSizeUsd": 3992,
  "cardUrl": "https://402.com.tr/brand/verdict?v=CAUTION&…"
}
```

Part of [x402 Bazaar](https://402.com.tr) — 230+ pay-per-call APIs for AI agents on Base + NEAR. MIT licensed.
