# B2B outreach — token-verdict as the pre-trade safety layer

**Thesis:** a few deep integrations where we're called every buy beat broad shallow
adoption. One Telegram trading bot or launchpad that gates every trade with us =
hundreds of recurring calls/day.

## The one-line pitch
> "Add one call before every buy so your users never ape into a honeypot —
> SAFE / CAUTION / AVOID for any Base, Solana or Arbitrum token. Free to trial, no
> wallet, no signup. $0.03/call at volume, onchain-attributed."

## Why it's zero-friction to trial
- **One line, any Node bot:** `npm i x402-bazaar-verdict`
  ```ts
  import { isSafeToTrade } from "x402-bazaar-verdict";
  if (!(await isSafeToTrade(tokenAddress))) return reply("🚫 Failed safety check.");
  ```
- **No wallet, no signup:** free daily tier works immediately. At volume, buy one
  credit pack and pass `creditToken` — no wallet in the hot path.
- Also available as: framework plugins (AgentKit / LangChain / CrewAI / ElizaOS /
  Solana Agent Kit), MCP (`npx x402-bazaar-mcp`), or plain REST
  (`GET /api/x402/token-verdict?address=…&free=1`).

## Targets (where every user makes trades)
1. **Telegram trading bots** (Base/Solana Maestro/Banana/Trojan equivalents) — the
   "🛡️ safety check" shown before a buy. ← highest fit (plain Node, buy flow).
2. **Agent launchpads / frameworks** (Virtuals, etc.) — default safety tool.
3. **Wallets / Base App mini-apps** — pre-approve / pre-swap warning.
4. **DEX / swap front-ends & aggregators** (LCX Liberty is already inbound).

## Commercial
- Free tier to trial → $0.03/call paid at volume.
- Whale partners: revenue-share or flat monthly for unlimited; a referral/affiliate
  cut can seed partners.
- Every paid call is ERC-8021 attributed on Base → also lifts Agent Charts rank.

## DM / email template
> Hi — I run x402 Bazaar. We give trading bots a one-call pre-trade safety check:
> SAFE/CAUTION/AVOID for any Base, Solana or Arbitrum token (honeypot, sell-tax,
> mint/freeze/owner powers, LP-lock, holder concentration) with the reasons and a
> max safe size.
>
> It's one line to trial — `npm i x402-bazaar-verdict`, free daily tier, no wallet:
> ```
> if (!(await isSafeToTrade(token))) return "🚫 Failed safety check";
> ```
> Could we add it as the safety gate before your users' buys? Happy to set up a
> free unlimited trial for your volume. Docs: https://402.com.tr/embed
