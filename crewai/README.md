# crewai-x402bazaar

A [CrewAI](https://www.crewai.com) tool for [x402 Bazaar](https://402.com.tr) — a
**pre-trade token safety verdict** for any Base ERC-20.

`TokenVerdictTool` returns one **SAFE / CAUTION / AVOID / UNKNOWN** answer with
the reasons behind it and a recommended max position size, distilling the full
pre-trade stack (honeypot, sell-tax, owner powers, exit-liquidity, deployer, B20
seize/freeze). Paid per call over [x402](https://x402.org) ($0.03 USDC on Base),
or **1 free call/day per IP** — no wallet needed to start.

## Install

```bash
pip install crewai-x402bazaar
# optional, to pay per call with your own wallet instead of the free tier:
pip install "crewai-x402bazaar[pay]"
```

## Use

```python
from crewai import Agent
from crewai_x402bazaar import TokenVerdictTool

analyst = Agent(
    role="Token safety analyst",
    goal="Never let the crew buy a Base token that fails a pre-trade check.",
    tools=[TokenVerdictTool()],
)
```

### Paying per call

```bash
export X402_EVM_PRIVATE_KEY=0x...   # funded USDC on Base
pip install "crewai-x402bazaar[pay]"
```

When present, each call pays $0.03 USDC over x402; otherwise the tool uses the
free daily call.

Part of [x402 Bazaar](https://402.com.tr) — 230+ pay-per-call APIs for AI agents on Base + NEAR. MIT licensed.
