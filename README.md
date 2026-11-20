# x402 Bazaar — agent framework plugins

Drop-in tools that give any AI agent — or any trading bot — the
[x402 Bazaar](https://402.com.tr) **token-verdict**: a one-call pre-trade safety
check (SAFE / CAUTION / AVOID) for any **Base, Solana or Arbitrum** token, paid per
call over [x402](https://x402.org) or via a free daily call.

**Any Node bot (no framework):** [`x402-bazaar-verdict`](./sdk) — one line:
```ts
import { isSafeToTrade } from "x402-bazaar-verdict";
if (!(await isSafeToTrade(token))) return "🚫 Failed safety check";
```

**Agent frameworks:**

| Framework | Package | Path |
|---|---|---|
| Coinbase AgentKit | [`x402-bazaar-agentkit`](./agentkit) | [`agentkit/`](./agentkit) |
| LangChain (Python) | [`langchain-x402bazaar`](./langchain) | [`langchain/`](./langchain) |
| CrewAI (Python) | [`crewai-x402bazaar`](./crewai) | [`crewai/`](./crewai) |
| ElizaOS | [`plugin-x402-bazaar`](./eliza) | [`eliza/`](./eliza) |
| Solana Agent Kit (SendAI) | [`solana-agent-kit-x402bazaar`](./solana-agent-kit) | [`solana-agent-kit/`](./solana-agent-kit) |

Universal SDK + five agent frameworks — Base + Arbitrum ERC-20 and Solana SPL
checks. Each works with **no wallet** by default (1 free call/day per IP) and
upgrades to paid x402 ($0.03 USDC on Base or Solana) when a credit token or funded
wallet is configured. Landing a B2B partner? See [`B2B-OUTREACH.md`](./B2B-OUTREACH.md).

- Marketplace: https://402.com.tr
- Machine catalog: https://402.com.tr/.well-known/x402
- MCP server: https://402.com.tr/mcp · `npx x402-bazaar-mcp`

MIT licensed.
