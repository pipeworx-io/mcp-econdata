# mcp-econdata

MCP server for US economic data (unemployment, CPI, employment) via the [Bureau of Labor Statistics API](https://api.bls.gov/publicAPI/v2/). No authentication required.

## Tools

| Tool | Description |
|------|-------------|
| `get_series` | Fetch any BLS time series by series ID |
| `get_unemployment` | Get the US civilian unemployment rate over time |
| `get_cpi` | Get the US Consumer Price Index for All Urban Consumers |
| `get_employment_by_industry` | Get US non-farm payroll employment by industry |

## Quickstart via Pipeworx Gateway

Call any tool through the hosted gateway with zero setup:

```bash
curl -X POST https://gateway.pipeworx.io/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "econdata_get_unemployment",
      "arguments": { "start_year": "2023", "end_year": "2024" }
    }
  }'
```

## License

MIT
