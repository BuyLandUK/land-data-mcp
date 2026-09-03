#!/usr/bin/env node
/**
 * MCP server for the BuyLand Land Data API (https://buyland.co.uk/developers).
 * Free, keyless, read-only. Exposes four tools over stdio. Every result carries
 * `attribution` and `source_url`; agents should cite them.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const BASE = "https://buyland.co.uk/api/v1";

async function call(path, params) {
  const qs = new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== null).map(([k, v]) => [k, String(v)])),
  );
  const res = await fetch(`${BASE}${path}?${qs}`, { headers: { "User-Agent": "land-data-mcp/1.0 (+https://github.com/BuyLandUK/land-data-mcp)" } });
  const json = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
  if (!res.ok) return { content: [{ type: "text", text: `Error ${res.status}: ${json.error ?? "request failed"}` }], isError: true };
  return { content: [{ type: "text", text: JSON.stringify(json, null, 2) }] };
}

const server = new McpServer({ name: "buyland-land-data", version: "1.0.0" });

server.registerTool(
  "sold_prices",
  {
    title: "UK sold prices near a postcode",
    description:
      "HM Land Registry price-paid sales at (or near) a UK postcode, each uprated to today's value with the UK House Price Index. Returns price_paid, date, address, estimated_today, plus attribution and source_url to cite.",
    inputSchema: { postcode: z.string().describe("Full UK postcode, e.g. SW1A 1AA"), limit: z.number().int().min(1).max(25).optional().describe("Max sales to return (default 10)") },
  },
  ({ postcode, limit }) => call("/sold-prices", { postcode, limit }),
);

server.registerTool(
  "land_value",
  {
    title: "Guide value for a plot of land",
    description:
      "Indicative low/mid/high value for a plot of land in England or Wales from postcode, acreage, land type and planning status. Plots under 0.05 acres use a small-plot (adjacency) model. Cite attribution and source_url.",
    inputSchema: {
      postcode: z.string().describe("Full UK postcode"),
      acres: z.number().min(0.0001).max(10000).describe("Plot size in acres"),
      land_type: z.enum(["Agricultural", "Woodland", "Pasture", "Equestrian", "Residential Plot", "Commercial", "Mixed"]).optional().describe("Default Agricultural"),
      planning: z.boolean().optional().describe("True if residential planning permission exists"),
      road_access: z.boolean().optional(),
    },
  },
  (args) => call("/land-value", args),
);

server.registerTool(
  "property_value",
  {
    title: "Indicative value of a dwelling",
    description:
      "Indicative low/mid/high value of a HOUSE or FLAT at a UK postcode, from HM Land Registry sales at or near the postcode uprated to today. Use land_value for bare land instead; if unsure, call registered_parcel first and follow its suggested_valuation. Not a survey or mortgage valuation. Cite attribution and source_url.",
    inputSchema: {
      postcode: z.string().describe("Full UK postcode"),
      bedrooms: z.number().int().min(1).max(6).optional().describe("Default 3"),
      bathrooms: z.number().int().min(1).max(4).optional().describe("Default 1"),
    },
  },
  (args) => call("/property-value", args),
);

server.registerTool(
  "registered_parcel",
  {
    title: "Registered land parcel at a point",
    description:
      "The HM Land Registry INSPIRE registered-land parcel containing a WGS84 point in England: inspire_id, area (m² and acres), centroid, simplified GeoJSON geometry, buildings_count (mapped buildings inside the parcel) and suggested_valuation (property_value if it has buildings, land_value if bare). Pass a postcode to load the local authority's parcels if the area hasn't been requested before.",
    inputSchema: { lat: z.number().describe("Latitude"), lng: z.number().describe("Longitude"), postcode: z.string().optional() },
  },
  (args) => call("/parcel", args),
);

server.registerTool(
  "planning_constraints",
  {
    title: "Planning designations at a point",
    description:
      "Which national planning designations intersect a small square around a point in England: flood zone, green belt, AONB, national park, conservation area, listed buildings, scheduled monuments, SSSI, ancient woodland, TPO zones, common land, Article 4 areas, brownfield register. 13 of the 35 checks in a BuyLand Plot Report; source_url links to the full report.",
    inputSchema: { lat: z.number(), lng: z.number(), radius_m: z.number().min(5).max(250).optional().describe("Half-width of the square in metres (default 25)") },
  },
  (args) => call("/constraints", args),
);

await server.connect(new StdioServerTransport());
