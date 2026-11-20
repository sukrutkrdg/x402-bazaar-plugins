# x402-bazaar-verdict

The **one-line pre-trade safety gate** for any trading bot or dApp. Call it before
every buy — your users never ape into a honeypot.

`SAFE / CAUTION / AVOID / UNKNOWN` for any **Base, Solana or Arbitrum** token, from
[x402 Bazaar](https://402.com.tr). **Free daily tier** (no wallet, no signup), zero
dependencies, built-in cache.

## Install

```bash
npm i x402-bazaar-verdict
```

## Use — gate a buy in one line

```ts
import { isSafeToTrade, tokenVerdict } from "x402-bazaar-verdict";

// Boolean gate in your bot's buy path:
if (!(await isSafeToTrade(tokenAddress))) {
  return reply("🚫 This token failed the safety check — not buying.");
}

// Or the full verdict, to show the user why:
const v = await tokenVerdict(tokenAddress);          // Base by default
console.log(v.verdict, v.headline, v.reasons);       // "CAUTION", "...", [...]

// Solana (auto-detected from a base58 mint) and Arbitrum:
await tokenVerdict("DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263");      // Solana
await tokenVerdict("0x912CE5…E6548", { chain: "arbitrum" });            // Arbitrum
```

## Options

| Option | Default | What |
|---|---|---|
| `chain` | `"base"` | `base` / `solana` / `arbitrum`. Base58 tokens auto-detect as `solana`. |
| `creditToken` | — | `x-credit-token` for **unlimited paid** calls (buy a pack at `/api/x402/buy-credits`). Omit to use the free daily tier. |
| `cacheMs` | `60000` | A bot polling one token won't re-spend. `0` disables. |
| `allowCaution` | `true` | `isSafeToTrade`: treat CAUTION as tradeable. |
| `failOpen` | `false` | `isSafeToTrade`: on error, block the trade (fail safe). |

Free tier = 1 call/token/day per IP. At volume, buy a credit pack once and pass
`creditToken` — no per-call signature, no wallet in your hot path. MIT licensed.

Part of [x402 Bazaar](https://402.com.tr) — 240+ pay-per-call APIs for AI agents.
