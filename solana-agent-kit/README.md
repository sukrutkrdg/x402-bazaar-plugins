# solana-agent-kit-x402bazaar

A [Solana Agent Kit](https://github.com/sendaifun/solana-agent-kit) (SendAI) plugin
for [x402 Bazaar](https://402.com.tr) — a **pre-trade token safety verdict** for any
Solana SPL token.

Two LLM actions — **TOKEN_VERDICT** (SAFE / CAUTION / AVOID) and **PRE_TRADE_GATE**
(GO / HOLD / STOP) — plus programmatic methods for the whole suite: `tokenVerdict`,
`preTradeGate`, `tokenRisk` (RugCheck score), `sellability` (honeypot), `lpCheck`
(LP-lock), `holderConcentration` (top-10 %), `price` and `liquidity`. Covers mint &
freeze authority (the Solana seize/freeze analog), Token-2022 seize/honeypot
extensions, Jupiter sellability, RugCheck LP-lock + concentration, and DEX price/depth.
Uses the free daily tier (1 call/day per IP); no wallet needed.

## Install

```bash
npm i solana-agent-kit-x402bazaar
```

## Use

```ts
import { SolanaAgentKit } from "solana-agent-kit";
import x402BazaarPlugin from "solana-agent-kit-x402bazaar";

const agent = new SolanaAgentKit(wallet, rpcUrl, {}).use(x402BazaarPlugin);

// Via the action (LLM tool): "Is DezXAZ8z… safe to buy?"
// Or programmatically:
const verdict = await agent.methods.tokenVerdict("DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263");
// → { verdict: "CAUTION", confidence: "high", headline: "...", reasons: [...], recommendedMaxSizeUsd, cardUrl }
```

The agent now checks any SPL token before it buys. Part of
[x402 Bazaar](https://402.com.tr) — 230+ pay-per-call APIs for AI agents on Base + NEAR + Solana. MIT licensed.
