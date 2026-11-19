import type { Action, Plugin, SolanaAgentKit } from "solana-agent-kit";
import { z } from "zod";

/**
 * Solana Agent Kit (SendAI) plugin for x402 Bazaar — token-verdict for SPL tokens.
 *
 * Gives any Solana Agent Kit agent a one-call SAFE / CAUTION / AVOID verdict for
 * an SPL mint before it buys: mint & freeze authority (the Solana seize/freeze
 * analog), Token-2022 extensions (permanent-delegate seize, transfer-hook
 * honeypot, non-transferable, frozen-by-default), Jupiter sellability, and
 * RugCheck LP-lock + concentration. Uses the free daily tier (1 call/day per IP);
 * for per-call paid access use the x402 payment path (USDC on Solana or Base).
 */

const BASE58 = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
const ENDPOINT = "https://402.com.tr/api/x402/sol-token-verdict";

async function fetchVerdict(mint: string, amountUsd?: number): Promise<Record<string, unknown>> {
  const qs = new URLSearchParams({ mint, free: "1" });
  if (amountUsd != null) qs.set("amountUsd", String(amountUsd));
  const res = await fetch(`${ENDPOINT}?${qs.toString()}`);
  if (!res.ok) throw new Error(`x402 Bazaar token-verdict failed (${res.status})`);
  const json = (await res.json()) as { data?: Record<string, unknown> } & Record<string, unknown>;
  return (json.data ?? json) as Record<string, unknown>;
}

export const tokenVerdictAction: Action = {
  name: "TOKEN_VERDICT",
  similes: [
    "check token safety",
    "is this token safe",
    "rug check",
    "honeypot check",
    "pre-trade check",
    "solana token verdict",
    "safe to buy",
  ],
  description:
    "Pre-trade safety check for a Solana SPL token before buying or approving it. Returns a " +
    "SAFE / CAUTION / AVOID / UNKNOWN verdict with the reasons and a recommended max position size, " +
    "covering mint & freeze authority, Token-2022 seize/honeypot extensions, Jupiter sellability, and " +
    "RugCheck LP-lock + holder concentration. Powered by x402 Bazaar (free daily tier).",
  examples: [
    [
      {
        input: { mint: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263" },
        output: { status: "success", verdict: "CAUTION", confidence: "high" },
        explanation: "Checks BONK: authorities renounced and sellable, but only ~19% of LP is locked.",
      },
    ],
  ],
  schema: z.object({
    mint: z.string().regex(BASE58, "A base58 Solana SPL mint address"),
    amountUsd: z.number().positive().optional().describe("Intended trade size in USD; tunes max safe size."),
  }),
  handler: async (_agent: SolanaAgentKit, input: Record<string, unknown>) => {
    try {
      const v = await fetchVerdict(String(input.mint), input.amountUsd as number | undefined);
      return {
        status: "success",
        verdict: v.verdict,
        confidence: v.confidence,
        headline: v.headline,
        reasons: v.reasons,
        recommendedMaxSizeUsd: v.recommendedMaxSizeUsd,
        cardUrl: v.cardUrl,
      };
    } catch (e) {
      return { status: "error", message: e instanceof Error ? e.message : String(e) };
    }
  },
};

const x402BazaarPlugin: Plugin = {
  name: "x402-bazaar",
  methods: {
    /** Programmatic access: `agent.methods.tokenVerdict(mint, amountUsd?)`. */
    tokenVerdict: async (mint: string, amountUsd?: number) => fetchVerdict(mint, amountUsd),
  },
  actions: [tokenVerdictAction],
  initialize: (_agent: SolanaAgentKit): void => {
    /* no setup needed — the action calls the hosted x402 Bazaar endpoint */
  },
};

export { x402BazaarPlugin };
export default x402BazaarPlugin;
