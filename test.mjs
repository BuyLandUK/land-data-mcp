// Smoke test: spawn the server over stdio, list tools, call two of them.
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const client = new Client({ name: "land-data-mcp-test", version: "1.0.0" });
await client.connect(new StdioClientTransport({ command: "node", args: ["index.mjs"] }));
const tools = (await client.listTools()).tools.map((t) => t.name);
console.log("tools:", tools.join(", "));
const sales = await client.callTool({ name: "sold_prices", arguments: { postcode: "CW5 7PX", limit: 1 } });
console.log("sold_prices:", sales.content[0].text.slice(0, 160).replace(/\n/g, " "), "…");
const cons = await client.callTool({ name: "planning_constraints", arguments: { lat: 51.2287, lng: -0.4, radius_m: 50 } });
console.log("planning_constraints flagged:", JSON.parse(cons.content[0].text).flagged);
await client.close();
