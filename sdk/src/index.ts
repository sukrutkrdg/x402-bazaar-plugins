/**
 * x402-bazaar-verdict — the one-line pre-trade safety gate for any trading bot.
 *
 * Drop into any Node app (Telegram bot, dApp backend, launchpad) and call before
 * every buy: SAFE / CAUTION / AVOID / UNKNOWN for any Base, Solana or Arbitrum
 * token. Free daily tier by default (no wallet, no signup); pass a creditToken
 * for unlimited paid calls. Zero dependencies, built-in cache. Not financial advice.
 */

export type Chain = "base" | "solana" | "arbitrum";
export type VerdictLevel = "SAFE" | "CAUTION" | "AVOID" | "UNKNOWN";

export interface TokenVerdict {
  token: string;
  chain: Chain;
  verdict: VerdictLevel;
  confidence: "high" | "medium" | "low";
  headline: string;
  reasons: string[];
  recommendedMaxSizeUsd: number | null;
  cardUrl?: string;
  [k: string]: unknown;
}

export interface VerdictOptions {
  /** base (default), solana, or arbitrum. Base58 tokens auto-detect as solana. */
  chain?: Chain;
  /** x-credit-token for unlimited PAID calls; omit to use the free daily tier. */
  creditToken?: string;
  /** Cache window in ms (default 60000). 0 disables. A bot polling one token won't re-spend. */
  cacheMs?: number;
  /** Override the host (default https://402.com.tr). */
  baseUrl?: string;
  /** Inject a fetch (tests / older runtimes). */
  fetchImpl?: typeof fetch;
}

const ENDPOINT: Record<Chain, string> = { base: "token-verdict", solana: "sol-token-verdict", arbitrum: "arb-token-verdict" };
const PARAM: Record<Chain, string> = { base: "address", solana: "mint", arbitrum: "address" };
const BASE58 = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

const cache = new Map<string, { at: number; v: TokenVerdict }>();

/** One call → a SAFE / CAUTION / AVOID / UNKNOWN verdict for a token. */
export async function tokenVerdict(token: string, opts: VerdictOptions = {}): Promise<TokenVerdict> {
  const t = token.trim();
  const chain: Chain = opts.chain ?? (!t.startsWith("0x") && BASE58.test(t) ? "solana" : "base");
  const host = opts.baseUrl ?? "https://402.com.tr";
  const cacheMs = opts.cacheMs ?? 60_000;
  const key = `${chain}:${t}:${opts.creditToken ? "paid" : "free"}`;

  if (cacheMs > 0) {
    const hit = cache.get(key);
    if (hit && Date.now() - hit.at < cacheMs) return hit.v;
  }

  const f = opts.fetchImpl ?? fetch;
  const url = `${host}/api/x402/${ENDPOINT[chain]}?${PARAM[chain]}=${encodeURIComponent(t)}${opts.creditToken ? "" : "&free=1"}`;
  const res = await f(url, { headers: opts.creditToken ? { "x-credit-token": opts.creditToken } : {} });
  if (!res.ok) throw new Error(`x402 Bazaar token-verdict failed (${res.status})`);
  const json = (await res.json()) as { data?: TokenVerdict } & TokenVerdict;
  const v = { ...(json.data ?? json), token: t, chain } as TokenVerdict;

  if (cacheMs > 0) cache.set(key, { at: Date.now(), v });
  return v;
}

/**
 * Boolean gate for a bot's buy path: proceed or not.
 * SAFE → true, AVOID/UNKNOWN → false, CAUTION → `allowCaution` (default true).
 * On any error, returns `failOpen` (default false — fail SAFE, block the trade).
 */
export async function isSafeToTrade(
  token: string,
  opts: VerdictOptions & { allowCaution?: boolean; failOpen?: boolean } = {},
): Promise<boolean> {
  try {
    const v = await tokenVerdict(token, opts);
    if (v.verdict === "SAFE") return true;
    if (v.verdict === "CAUTION") return opts.allowCaution ?? true;
    return false; // AVOID | UNKNOWN
  } catch {
    return opts.failOpen ?? false;
  }
}
