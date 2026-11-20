/**
 * Telegram trading-bot safety gate — a drop-in reference integration.
 *
 * Shows how a trading bot (Maestro/Banana/Trojan style) adds a pre-trade safety
 * check so users never ape into a honeypot. The whole gate is ONE call:
 *   isSafeToTrade(token)  →  block the buy if it fails.
 *
 * Covers Base, Solana and Arbitrum (auto-detected). Free daily tier — no wallet,
 * no signup — so you can run this as-is. For volume, pass a creditToken (buy a
 * pack once at https://402.com.tr/api/x402/buy-credits).
 *
 * Run:
 *   npm i
 *   TELEGRAM_BOT_TOKEN=<from @BotFather> node bot.js
 * Then DM your bot:  /check 0x4200000000000000000000000000000000000006
 *                    /buy   So11111111111111111111111111111111111111112 1.5
 */
import { Bot } from "grammy";
import { tokenVerdict, isSafeToTrade } from "x402-bazaar-verdict";

const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN);
const EMOJI = { SAFE: "✅", CAUTION: "⚠️", AVOID: "🚫", UNKNOWN: "❔" };

// /check <token> — show the full verdict (what you'd render before a buy).
bot.command("check", async (ctx) => {
  const token = (ctx.match || "").trim().split(/\s+/)[0];
  if (!token) return ctx.reply("Usage: /check <token address or mint>");
  try {
    const v = await tokenVerdict(token); // Base/Arbitrum 0x… or Solana base58 (auto)
    await ctx.reply(
      `${EMOJI[v.verdict] || ""} *${v.verdict}* (${v.confidence}) · ${v.chain}\n` +
        `${v.headline}\n\n` +
        (v.reasons?.length ? v.reasons.map((r) => `• ${r}`).join("\n") : "") +
        (v.recommendedMaxSizeUsd != null ? `\n\nMax safe size: $${v.recommendedMaxSizeUsd}` : ""),
      { parse_mode: "Markdown" },
    );
  } catch (e) {
    await ctx.reply(`Safety check failed: ${e.message}`);
  }
});

// /buy <token> <amount> — the real gate: block the trade unless it's safe.
bot.command("buy", async (ctx) => {
  const [token, amount] = (ctx.match || "").trim().split(/\s+/);
  if (!token || !amount) return ctx.reply("Usage: /buy <token> <amount>");

  // failOpen:false → if the check can't run, we BLOCK (fail safe, not open).
  if (!(await isSafeToTrade(token, { failOpen: false }))) {
    const v = await tokenVerdict(token).catch(() => null);
    return ctx.reply(
      `🚫 Blocked — this token failed the safety check.\n${v?.headline ?? ""}\n` +
        `${(v?.reasons || []).slice(0, 2).map((r) => `• ${r}`).join("\n")}`,
    );
  }

  // …your existing buy logic runs here only after the gate passes…
  await ctx.reply(`✅ Safety check passed — buying ${amount} of ${token}. (demo: wire your swap here)`);
});

bot.command("start", (ctx) =>
  ctx.reply("I gate buys with an x402 Bazaar safety check.\n/check <token> — verdict\n/buy <token> <amount> — gated buy"),
);

bot.start();
console.log("Safety-gate bot running. DM it /check <token>.");
