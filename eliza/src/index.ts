import type {
  Action,
  ActionResult,
  HandlerCallback,
  IAgentRuntime,
  Memory,
  Plugin,
  State,
} from "@elizaos/core";
import { getTokenVerdict } from "./core.js";

export * from "./core.js";

const ADDRESS_RE = /0x[a-fA-F0-9]{40}/;

/**
 * ElizaOS action: pre-trade token safety verdict for a Base ERC-20.
 */
export const tokenVerdictAction: Action = {
  name: "TOKEN_VERDICT_CHECK",
  similes: ["CHECK_TOKEN", "TOKEN_SAFETY", "RUG_CHECK", "HONEYPOT_CHECK", "IS_TOKEN_SAFE"],
  description:
    "Pre-trade safety check for a Base (eip155:8453) ERC-20 token: returns a SAFE / CAUTION / AVOID " +
    "verdict with the reasons and a recommended max position size. Use when the user asks whether a " +
    "Base token (0x…) is safe to buy, or before buying/approving one.",

  validate: async (_runtime: IAgentRuntime, message: Memory): Promise<boolean> =>
    ADDRESS_RE.test(message?.content?.text ?? ""),

  handler: async (
    _runtime: IAgentRuntime,
    message: Memory,
    _state?: State,
    _options?: unknown,
    callback?: HandlerCallback,
  ): Promise<ActionResult> => {
    const text = message?.content?.text ?? "";
    const address = text.match(ADDRESS_RE)?.[0];

    if (!address) {
      const msg = "Please provide a Base token address (0x…) to check.";
      await callback?.({ text: msg });
      return { success: false, text: msg };
    }

    try {
      const v = await getTokenVerdict(address);
      const reasons = (v.reasons ?? [])
        .slice(0, 3)
        .map(r => `• ${r}`)
        .join("\n");
      const size =
        typeof v.recommendedMaxSizeUsd === "number"
          ? `\nMax safe size: $${v.recommendedMaxSizeUsd.toLocaleString("en-US")}`
          : "";
      const out = `${v.verdict} (${v.confidence} confidence) — ${v.headline}${reasons ? `\n${reasons}` : ""}${size}`;
      await callback?.({ text: out });
      return { success: true, text: out, userFacingText: out };
    } catch (e) {
      const msg = `Could not check that token: ${e instanceof Error ? e.message : String(e)}`;
      await callback?.({ text: msg });
      return { success: false, text: msg };
    }
  },

  examples: [],
};

/**
 * ElizaOS plugin exposing the x402 Bazaar token-verdict action.
 */
export const x402BazaarPlugin: Plugin = {
  name: "x402-bazaar",
  description:
    "Pre-trade token safety verdict (SAFE / CAUTION / AVOID) for Base ERC-20 tokens, via x402 Bazaar.",
  actions: [tokenVerdictAction],
};

export default x402BazaarPlugin;
