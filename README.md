# x402 Bazaar — agent framework plugins

Drop-in tools that give any AI agent the [x402 Bazaar](https://402.com.tr)
**token-verdict** — a one-call pre-trade safety check (SAFE / CAUTION / AVOID)
for any **Base ERC-20 or Solana SPL** token, paid per call over
[x402](https://x402.org) or via a free daily call.

| Framework | Package | Path |
|---|---|---|
| Coinbase AgentKit | [`x402-bazaar-agentkit`](./agentkit) | [`agentkit/`](./agentkit) |
| LangChain (Python) | [`langchain-x402bazaar`](./langchain) | [`langchain/`](./langchain) |
| CrewAI (Python) | [`crewai-x402bazaar`](./crewai) | [`crewai/`](./crewai) |
| ElizaOS | [`plugin-x402-bazaar`](./eliza) | [`eliza/`](./eliza) |
| Solana Agent Kit (SendAI) | [`solana-agent-kit-x402bazaar`](./solana-agent-kit) | [`solana-agent-kit/`](./solana-agent-kit) |

Five agent frameworks covered — Base ERC-20 checks (AgentKit/LangChain/CrewAI/
ElizaOS) and Solana SPL checks (Solana Agent Kit). Each tool works with **no
wallet** by default (1 free call/day per IP) and upgrades to paid x402 ($0.03
USDC on Base or Solana) when a funded wallet is configured.

- Marketplace: https://402.com.tr
- Machine catalog: https://402.com.tr/.well-known/x402
- MCP server: https://402.com.tr/mcp · `npx x402-bazaar-mcp`

MIT licensed.
