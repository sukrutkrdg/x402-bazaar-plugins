import { ActionProvider, CreateAction, type Network, type WalletProvider } from "@coinbase/agentkit";
import {
  TokenVerdictSchema,
  getTokenVerdict,
  type TokenVerdictArgs,
  type X402BazaarOptions,
} from "./core.js";

export * from "./core.js";

/**
 * Coinbase AgentKit action provider for x402 Bazaar.
 *
 * Exposes `token_verdict_check` — a pre-trade SAFE / CAUTION / AVOID verdict for
 * any Base ERC-20, paid per call over x402 ($0.03 USDC) or via a free daily call.
 */
export class X402BazaarActionProvider extends ActionProvider<WalletProvider> {
  private readonly opts: X402BazaarOptions;

  constructor(opts: X402BazaarOptions = {}) {
    super("x402bazaar", []);
    this.opts = { enablePayment: false, maxPriceUsd: 0.05, ...opts };
  }

  @CreateAction({
    name: "token_verdict_check",
    description:
      "Pre-trade safety check for a Base (eip155:8453) ERC-20 token before buying or approving it. " +
      "Returns a SAFE / CAUTION / AVOID / UNKNOWN verdict with confidence, the reasons behind it, and a " +
      "recommended max position size — covering honeypot, sell-tax, owner powers, exit-liquidity and B20 " +
      "seize/freeze. Powered by x402 Bazaar: $0.03 USDC/call over x402, or 1 free call/day per IP.",
    schema: TokenVerdictSchema,
  })
  async tokenVerdictCheck(_walletProvider: WalletProvider, args: TokenVerdictArgs): Promise<string> {
    return getTokenVerdict(args, this.opts);
  }

  supportsNetwork(network: Network): boolean {
    return (
      network.protocolFamily === "evm" &&
      (network.chainId === "8453" || network.networkId === "base-mainnet")
    );
  }
}

/** Factory, matching AgentKit's `xxxActionProvider()` convention. */
export const x402BazaarActionProvider = (opts?: X402BazaarOptions) =>
  new X402BazaarActionProvider(opts);
