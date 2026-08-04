# mcp-econdata

Econdata MCP — wraps BLS (Bureau of Labor Statistics) public API v2

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1394+ live data sources.

## Tools

| Tool | Description |
|------|-------------|
| `get_series` | Fetch any economic time series by ID (e.g., "CPUR0000SA0" for CPI, "LNS14000000" for unemployment). Returns historical data points with dates and values. |
| `get_unemployment` | Get the US civilian unemployment rate over time (Bureau of Labor Statistics) — the percentage of the labor force currently unemployed. Use this for "unemployment rate" / "jobless rate" queries. Returns monthly values by year and month. |
| `get_cpi` | Current US inflation rate (CPI year-over-year) and Consumer Price Index history. Returns monthly index values with computed yoy_inflation_pct per month plus a latest summary — answers "what is the latest inflation rate" directly. |
| `get_employment_by_industry` | Get US non-farm payroll employment by industry (manufacturing, construction, retail, financial, government, etc.). Returns employment figures in thousands by period. |

## Quick Start

Add to your MCP client (Claude Desktop, Cursor, Windsurf, etc.):

```json
{
  "mcpServers": {
    "econdata": {
      "url": "https://gateway.pipeworx.io/econdata/mcp"
    }
  }
}
```

Or connect to the full Pipeworx gateway for access to all 1394+ data sources:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English:

```
ask_pipeworx({ question: "your question about Econdata data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
