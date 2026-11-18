# x402-bazaar-agentkit

A [Coinbase AgentKit](https://github.com/coinbase/agentkit) action provider for
[x402 Bazaar](https://402.com.tr) — a **pre-trade token safety verdict** for any
Base ERC-20.

The `token_verdict_check` action returns one **SAFE / CAUTION / AVOID / UNKNOWN**
answer with confidence, the reasons behind it, and a recommended max position
size — distilling the full pre-trade stack (honeypot, sell-tax, owner powers,
exit-liquidity, deployer, B20 seize/freeze). Paid per call over
[x402](https://x402.org) ($0.03 USDC on Base), or **1 free call/day per IP** — no
wallet needed to start.

## Install

```bash
npm i x402-bazaar-agentkit
# optional, only if you want to pay per call instead of the free tier:
npm i @x402/fetch @x402/core @x402/evm viem
```

## Use

```ts
import { AgentKit, getLangChainTools } from "@coinbase/agentkit";
import { x402BazaarActionProvider } from "x402-bazaar-agentkit";

const agentKit = await AgentKit.from({
  cdpApiKeyId: process.env.CDP_API_KEY_ID,
  cdpApiKeySecret: process.env.CDP_API_KEY_SECRET,
  actionProviders: [
    // Free tier (no wallet needed to try):
    x402BazaarActionProvider(),

    // …or pay $0.03/call with your own EVM wallet:
    // x402BazaarActionProvider({ enablePayment: true, evmPrivateKey: process.env.EVM_PRIVATE_KEY }),
  ],
});

const tools = await getLangChainTools(agentKit);
```

The agent can now call `token_verdict_check({ address, amountUsd? })` before it
buys or approves any Base token.

## Notes

- **Free by default.** With no wallet config the action uses the free daily call.
- **Payment is lazy.** The x402 client packages are optional peer deps, loaded
  only when `enablePayment` + `evmPrivateKey` are set — so the package installs
  and runs with zero x402 dependencies.
- **Base mainnet** (`eip155:8453`), settled in USDC.

Part of [x402 Bazaar](https://402.com.tr) — 230+ pay-per-call APIs for AI agents on Base + NEAR. MIT licensed.
