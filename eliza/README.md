# plugin-x402-bazaar

An [ElizaOS](https://elizaos.ai) plugin for [x402 Bazaar](https://402.com.tr) — a
**pre-trade token safety verdict** for any Base ERC-20.

The `TOKEN_VERDICT_CHECK` action triggers when a user mentions a Base token
address (`0x…`) and asks whether it is safe. It returns a **SAFE / CAUTION /
AVOID / UNKNOWN** verdict with the reasons behind it and a recommended max
position size, distilling the full pre-trade stack (honeypot, sell-tax, owner
powers, exit-liquidity, deployer, B20 seize/freeze).

Uses the free daily tier (1 call/day per IP) — no wallet or config needed. For
per-call paid x402, use the AgentKit provider
([`x402-bazaar-agentkit`](https://www.npmjs.com/package/x402-bazaar-agentkit)) or
the [x402 Bazaar MCP server](https://402.com.tr/mcp).

## Install

```bash
npm i plugin-x402-bazaar
```

## Use

```ts
import x402BazaarPlugin from "plugin-x402-bazaar";

// Register the plugin with your ElizaOS agent/character:
const character = {
  name: "MyAgent",
  plugins: [x402BazaarPlugin],
  // ...
};
```

Then: *"Is 0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed safe to buy?"* →
`TOKEN_VERDICT_CHECK` runs and replies with the verdict.

Part of [x402 Bazaar](https://402.com.tr) — 230+ pay-per-call APIs for AI agents on Base + NEAR. MIT licensed.
