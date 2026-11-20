# Telegram trading-bot safety gate (reference integration)

A drop-in example: add a **pre-trade safety check** to a Telegram trading bot so
your users never ape into a honeypot. The whole gate is **one call**.

```js
import { isSafeToTrade } from "x402-bazaar-verdict";

// in your /buy handler, before the swap:
if (!(await isSafeToTrade(token, { failOpen: false }))) {
  return ctx.reply("🚫 Blocked — this token failed the safety check.");
}
// …your swap runs only after the gate passes…
```

Covers **Base, Solana and Arbitrum** (auto-detected from the address). Free daily
tier — no wallet, no signup — so this runs as-is.

## Run it

```bash
npm i
TELEGRAM_BOT_TOKEN=<from @BotFather> node bot.js
```

Then DM your bot:
- `/check 0x4200000000000000000000000000000000000006` — full verdict
- `/buy So11111111111111111111111111111111111111112 1.5` — a gated buy

## Going to production

- **Volume:** buy a credit pack once at `/api/x402/buy-credits` and pass
  `creditToken` to `tokenVerdict` / `isSafeToTrade` — no wallet in your hot path,
  no per-call signature.
- **Caching:** the SDK caches 60s by default, so polling the same token is free.
- **Policy:** `allowCaution` (treat CAUTION as tradeable, default true) and
  `failOpen` (block vs allow when the check can't run) tune the gate to your risk.

Part of [x402 Bazaar](https://402.com.tr). Not financial advice.
