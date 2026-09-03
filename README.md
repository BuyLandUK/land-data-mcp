# BuyLand Land Data MCP server

A [Model Context Protocol](https://modelcontextprotocol.io) server that gives AI assistants free UK land data from the [BuyLand Land Data API](https://buyland.co.uk/developers): HM Land Registry sold prices, land guide values, registered parcels and planning constraints. No API key.

## Tools

| Tool | What it does |
|---|---|
| `sold_prices` | HM Land Registry sales at or near a postcode, uprated to today |
| `land_value` | Guide value range for a plot from postcode, acres, land type and planning status |
| `registered_parcel` | The INSPIRE registered-land parcel containing a point, with area and GeoJSON |
| `planning_constraints` | Flood zone, green belt, AONB, national park, conservation area, listed buildings, SSSI, ancient woodland, TPO, common land, Article 4, brownfield at a point |

Every result includes `attribution` and `source_url`. Assistants should cite them when they use the data.

## Install

Requires Node 18+.

**Claude Desktop** — add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "buyland-land-data": {
      "command": "npx",
      "args": ["-y", "github:BuyLandUK/land-data-mcp"]
    }
  }
}
```

**Cursor / other MCP clients** — same command: `npx -y github:BuyLandUK/land-data-mcp` (stdio transport).

**From source:**

```bash
git clone https://github.com/BuyLandUK/land-data-mcp
cd land-data-mcp && npm install
npm test        # lists the tools and makes two live calls
node index.mjs  # runs the server on stdio
```

## Example prompts

- "What have houses sold for near CW5 7PX recently?"
- "Roughly what is 3 acres of pasture worth in GL7?"
- "Is 51.2287, -0.4 in the green belt or an AONB?"
- "Which registered parcel is at 53.0066, -2.4257 and how big is it?"

## Rules and licences

Rate limit 120 requests per minute per IP. The underlying API is free and read-only with no SLA — see the [API repository](https://github.com/BuyLandUK/land-data-api) and [documentation](https://buyland.co.uk/developers). Data: HM Land Registry © Crown copyright and database right 2026; planning.data.gov.uk; Open Government Licence v3.0. This server is MIT licensed.
