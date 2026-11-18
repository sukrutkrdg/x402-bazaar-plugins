/**
 * Framework-agnostic core for the x402 Bazaar token-verdict (ElizaOS plugin).
 * Uses the free daily tier (1 call/day per IP, no wallet) — reliable and
 * zero-config. For per-call paid x402 use the AgentKit provider
 * (`x402-bazaar-agentkit`) or the x402 Bazaar MCP server.
 */

export const TOKEN_VERDICT_URL = "https://402.com.tr/api/x402/token-verdict";

export interface TokenVerdict {
  address: string;
  verdict: "SAFE" | "CAUTION" | "AVOID" | "UNKNOWN";
  confidence: string;
  headline: string;
  reasons: string[];
  recommendedMaxSizeUsd?: number | null;
  cardUrl?: string;
  [k: string]: unknown;
}

/**
 * Fetch a token-verdict for a Base ERC-20 address.
 *
 * @param address - The 0x… Base token contract address.
 * @param amountUsd - Optional intended trade size in USD.
 * @returns The parsed verdict.
 */
export async function getTokenVerdict(address: string, amountUsd?: number): Promise<TokenVerdict> {
  const qs = new URLSearchParams({ address, free: "1" });
  if (amountUsd != null) qs.set("amountUsd", String(amountUsd));
  const res = await fetch(`${TOKEN_VERDICT_URL}?${qs.toString()}`, { method: "GET" });
  if (!res.ok) throw new Error(`x402 Bazaar request failed (${res.status})`);
  const json = (await res.json()) as { data?: TokenVerdict } & TokenVerdict;
  return (json.data ?? json) as TokenVerdict;
}
