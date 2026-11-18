/**
 * Framework-agnostic core for the x402 Bazaar token-verdict tool.
 *
 * No AgentKit dependency lives here, so it can be unit-tested on its own and
 * reused by other framework wrappers (LangChain JS, raw agents, etc.). The paid
 * x402 path is loaded lazily — the package builds and runs the free tier with
 * zero x402 dependencies installed.
 */
import { z } from "zod";

export const TOKEN_VERDICT_URL = "https://402.com.tr/api/x402/token-verdict";
export const USDC_BASE = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
export const BASE_CHAIN = "eip155:8453";

export const TokenVerdictSchema = z.object({
  address: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/, "Base ERC-20 token address (0x + 40 hex chars)"),
  amountUsd: z
    .number()
    .positive()
    .optional()
    .describe("Intended trade size in USD; tunes the recommended max safe size."),
});
export type TokenVerdictArgs = z.infer<typeof TokenVerdictSchema>;

export interface X402BazaarOptions {
  /** Pay $0.03 USDC/call over x402. If false (default), uses 1 free call/day per IP. */
  enablePayment?: boolean;
  /** Spend cap per call in USD (default 0.05; token-verdict is $0.03). */
  maxPriceUsd?: number;
  /** viem EVM private key (0x…), used only when enablePayment is true. */
  evmPrivateKey?: `0x${string}`;
}

// Loaded via a runtime string so TypeScript keeps these modules OPTIONAL: the
// package builds and runs with zero x402 deps installed (free tier). They are
// only resolved when payment is enabled and a key is present.
async function dynImport(name: string): Promise<any> {
  return import(name);
}

async function buildPaidFetch(opts: X402BazaarOptions): Promise<typeof fetch | null> {
  if (!opts.enablePayment || !opts.evmPrivateKey) return null;
  try {
    const [fetchMod, coreMod, evmMod, viemMod] = await Promise.all([
      dynImport("@x402/fetch"),
      dynImport("@x402/core/client"),
      dynImport("@x402/evm/exact/client"),
      dynImport("viem/accounts"),
    ]);
    const signer = viemMod.privateKeyToAccount(opts.evmPrivateKey);
    const client = new coreMod.x402Client();
    client.register("eip155:*", new evmMod.ExactEvmScheme(signer));
    return fetchMod.wrapFetchWithPayment(fetch, client) as typeof fetch;
  } catch {
    // x402 client packages not installed / version mismatch — degrade to free tier.
    return null;
  }
}

/**
 * Call token-verdict for a Base token and return the result as a JSON string
 * (the shape agent frameworks expect back from a tool). Uses the free daily tier
 * unless payment is enabled with a funded wallet.
 */
export async function getTokenVerdict(
  args: TokenVerdictArgs,
  opts: X402BazaarOptions = {},
): Promise<string> {
  const parsed = TokenVerdictSchema.parse(args);
  const qs = new URLSearchParams({ address: parsed.address });
  if (parsed.amountUsd != null) qs.set("amountUsd", String(parsed.amountUsd));

  const paidFetch = await buildPaidFetch(opts);
  let res: Response;
  if (paidFetch) {
    res = await paidFetch(`${TOKEN_VERDICT_URL}?${qs.toString()}`, { method: "GET" });
  } else {
    qs.set("free", "1");
    res = await fetch(`${TOKEN_VERDICT_URL}?${qs.toString()}`, { method: "GET" });
  }

  if (res.status === 402) {
    return JSON.stringify({
      error: "payment_required",
      chain: BASE_CHAIN,
      asset: USDC_BASE,
      message:
        "token-verdict requires an x402 payment ($0.03 USDC on Base). Enable payment " +
        "with a funded wallet (enablePayment + evmPrivateKey), or omit for the free daily call.",
    });
  }
  if (!res.ok) {
    return JSON.stringify({
      error: "request_failed",
      status: res.status,
      body: (await res.text()).slice(0, 500),
    });
  }
  const json: any = await res.json();
  // Free tier wraps the result in { data }; the paid x402 call returns it raw.
  return JSON.stringify(json.data ?? json);
}
