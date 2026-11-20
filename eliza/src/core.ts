/**
 * Framework-agnostic core for the x402 Bazaar token-verdict (ElizaOS plugin).
 * Uses the free daily tier (1 call/day per IP, no wallet) — reliable and
 * zero-config. For per-call paid x402 use the AgentKit provider
 * (`x402-bazaar-agentkit`) or the x402 Bazaar MCP server.
 */

export const BASE_URL = "https://402.com.tr/api/x402";
export const TOKEN_VERDICT_URL = `${BASE_URL}/token-verdict`; // back-compat
export type Chain = "base" | "arbitrum" | "solana";
/** token-verdict endpoint + token param per chain. All settle in USDC on Base. */
export const CHAIN_ENDPOINTS: Record<Chain, { endpoint: string; param: string }> = {
  base: { endpoint: "token-verdict", param: "address" },
  arbitrum: { endpoint: "arb-token-verdict", param: "address" },
  solana: { endpoint: "sol-token-verdict", param: "mint" },
};

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
export async function getTokenVerdict(address: string, amountUsd?: number, chain?: Chain): Promise<TokenVerdict> {
  // Default base; a base58 (non-0x) token implies Solana.
  const c: Chain = chain ?? (address.startsWith("0x") ? "base" : "solana");
  const { endpoint, param } = CHAIN_ENDPOINTS[c];
  const qs = new URLSearchParams({ [param]: address, free: "1" });
  if (amountUsd != null) qs.set("amountUsd", String(amountUsd));
  const res = await fetch(`${BASE_URL}/${endpoint}?${qs.toString()}`, { method: "GET" });
  if (!res.ok) throw new Error(`x402 Bazaar request failed (${res.status})`);
  const json = (await res.json()) as { data?: TokenVerdict } & TokenVerdict;
  return (json.data ?? json) as TokenVerdict;
}
