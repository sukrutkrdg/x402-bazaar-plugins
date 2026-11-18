// Live free-tier smoke test — no wallet, no AgentKit. Proves the tool returns a
// real verdict from the production endpoint. Run: npm run build && npm run smoke
import { getTokenVerdict } from "../dist/core.js";

const DEGEN = "0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed";
const out = await getTokenVerdict({ address: DEGEN, amountUsd: 1000 });
console.log(out);

const j = JSON.parse(out);
if (!j.verdict || !["SAFE", "CAUTION", "AVOID", "UNKNOWN"].includes(j.verdict)) {
  console.error("\nSMOKE FAIL: no valid verdict in response");
  process.exit(1);
}
console.log(`\nSMOKE OK — ${DEGEN} -> ${j.verdict} (${j.confidence})`);
