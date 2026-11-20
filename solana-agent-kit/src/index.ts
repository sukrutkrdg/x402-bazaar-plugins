import type { Action, Plugin, SolanaAgentKit } from "solana-agent-kit";
import { z } from "zod";

/**
 * Solana Agent Kit (SendAI) plugin for x402 Bazaar — the SPL token-safety suite a
 * trading agent calls before every buy.
 *
 * Two LLM actions — TOKEN_VERDICT (SAFE/CAUTION/AVOID) and PRE_TRADE_GATE
 * (GO/HOLD/STOP) — plus programmatic methods for the whole suite: token-risk,
 * sellability (honeypot), LP-lock, holder concentration, price and liquidity.
 * Each uses the free daily tier (1 call/day per IP); for per-call paid access use
 * the x402 path (USDC on Solana or Base). Not financial advice.
 */

const BASE58 = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
const BASE = "https://402.com.tr/api/x402";

/** Call any x402 Bazaar Solana endpoint on the free daily tier. */
async function callService(service: string, mint: string, extra?: Record<string, string>): Promise<Record<string, unknown>> {
  const qs = new URLSearchParams({ mint, free: "1", ...extra });
  const res = await fetch(`${BASE}/${service}?${qs.toString()}`);
  if (!res.ok) throw new Error(`x402 Bazaar ${service} failed (${res.status})`);
  const json = (await res.json()) as { data?: Record<string, unknown> } & Record<string, unknown>;
  return (json.data ?? json) as Record<string, unknown>;
}

const mintField = z.string().regex(BASE58, "A base58 Solana SPL mint address");

export const tokenVerdictAction: Action = {
  name: "TOKEN_VERDICT",
  similes: ["check token safety", "is this token safe", "rug check", "honeypot check", "pre-trade check", "solana token verdict", "safe to buy"],
  description:
    "Pre-trade safety check for a Solana SPL token. Returns a SAFE / CAUTION / AVOID / UNKNOWN verdict " +
    "with the reasons and a recommended max position size, covering mint & freeze authority, Token-2022 " +
    "seize/honeypot extensions, Jupiter sellability, and RugCheck LP-lock + concentration. x402 Bazaar (free daily tier).",
  examples: [[{
    input: { mint: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263" },
    output: { status: "success", verdict: "CAUTION", confidence: "high" },
    explanation: "Checks BONK: authorities renounced and sellable, but only ~21% of LP is locked.",
  }]],
  schema: z.object({
    mint: mintField,
    amountUsd: z.number().positive().optional().describe("Intended trade size in USD; tunes max safe size."),
  }),
  handler: async (_agent: SolanaAgentKit, input: Record<string, unknown>) => {
    try {
      const v = await callService("sol-token-verdict", String(input.mint), input.amountUsd != null ? { amountUsd: String(input.amountUsd) } : undefined);
      return { status: "success", verdict: v.verdict, confidence: v.confidence, headline: v.headline, reasons: v.reasons, recommendedMaxSizeUsd: v.recommendedMaxSizeUsd, cardUrl: v.cardUrl };
    } catch (e) {
      return { status: "error", message: e instanceof Error ? e.message : String(e) };
    }
  },
};

export const preTradeGateAction: Action = {
  name: "PRE_TRADE_GATE",
  similes: ["should i buy this token", "go or no go", "pre-trade gate", "trade decision", "can i ape this", "stop or go"],
  description:
    "The one call to make before buying a Solana SPL token: returns GO / HOLD / STOP with the reasons and a " +
    "recommended max size. Distils the full safety stack (authorities, Token-2022 seize extensions, sellability, " +
    "LP-lock) into a single trade decision — STOP on any terminal flag. x402 Bazaar (free daily tier).",
  examples: [[{
    input: { mint: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263" },
    output: { status: "success", gate: "HOLD", confidence: "high" },
    explanation: "BONK gates HOLD: tradeable but LP is weakly locked — size down.",
  }]],
  schema: z.object({ mint: mintField }),
  handler: async (_agent: SolanaAgentKit, input: Record<string, unknown>) => {
    try {
      const v = await callService("sol-pre-trade-gate", String(input.mint));
      return { status: "success", gate: v.gate, verdict: v.verdict, confidence: v.confidence, headline: v.headline, reasons: v.reasons, recommendedMaxSizeUsd: v.recommendedMaxSizeUsd };
    } catch (e) {
      return { status: "error", message: e instanceof Error ? e.message : String(e) };
    }
  },
};

const x402BazaarPlugin: Plugin = {
  name: "x402-bazaar",
  // Programmatic access to the whole Solana suite: agent.methods.<name>(mint).
  methods: {
    tokenVerdict: async (mint: string, amountUsd?: number) => callService("sol-token-verdict", mint, amountUsd != null ? { amountUsd: String(amountUsd) } : undefined),
    preTradeGate: async (mint: string) => callService("sol-pre-trade-gate", mint),
    tokenRisk: async (mint: string) => callService("sol-token-risk", mint),
    sellability: async (mint: string) => callService("sol-sellability", mint),
    lpCheck: async (mint: string) => callService("sol-lp-check", mint),
    holderConcentration: async (mint: string) => callService("sol-holder-concentration", mint),
    price: async (mint: string) => callService("sol-price", mint),
    liquidity: async (mint: string) => callService("sol-liquidity", mint),
  },
  actions: [tokenVerdictAction, preTradeGateAction],
  initialize: (_agent: SolanaAgentKit): void => {
    /* no setup needed — actions call the hosted x402 Bazaar endpoints */
  },
};

export { x402BazaarPlugin };
export default x402BazaarPlugin;
