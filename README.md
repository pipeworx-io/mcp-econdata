# @pipeworx/econdata

US labor and price statistics from the Bureau of Labor Statistics public API v2 — inflation (CPI-U), the unemployment rate, non-farm payroll employment by industry, and any BLS series by ID.

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1679+ live data sources.

## Tools

| Tool | What it returns |
|---|---|
| `get_cpi` | CPI-U index history for the US city average, all items, with `yoy_inflation_pct` computed per month and a `latest` summary. **Not seasonally adjusted by default** (BLS `CUUR0000SA0`); pass `seasonally_adjusted: true` for `CUSR0000SA0` — the same series FRED publishes as `CPIAUCSL`. Every response names the adjustment it used and carries the other month-matched value as `latest.index_value_sa` / `latest.index_value_nsa`, because the two run about a point apart (2026-07: 333.918 NSA vs 332.813 SA). |
| `get_unemployment` | Civilian unemployment rate, seasonally adjusted (`LNS14000000`), monthly. |
| `get_employment_by_industry` | All-employees payroll counts in thousands, seasonally adjusted, for `total_nonfarm`, `manufacturing`, `construction`, `retail`, `financial` or `government`. |
| `get_series` | Any BLS series by ID, for callers who already know the series they want. |

Data arrives **newest first** — every response says so in `observation_order`, so you don't have to infer it from the dates. `total` and `returned` are always equal here: BLS returns every point in the requested year range, so nothing is truncated.

Every data point carries an ISO `date` derived from the BLS `period` code (`M01`–`M12` monthly, `Q01`–`Q04` quarterly, `S01`/`S02` semiannual, `A01`/`M13` annual), so results sort and freshness-check without decoding `"M06"`.

## Auth

Keyless works, at roughly **25 requests per day per IP**. A free BLS registration key raises that to 500/day: get one at <https://data.bls.gov/registrationEngine/>. The gateway supplies a platform key (`PLATFORM_BLS_KEY`); pass `_apiKey` only to override it with your own.

Two BLS limits fail differently and the pack distinguishes them, because they used to read alike:

- **Per-second burst** — BLS returns HTTP 429 "Requests Per Second Limit Exceeded" when concurrent callers land in the same second. The pack retries three times (400 ms, 1200 ms, 2500 ms); only a 429 that survives all three surfaces, as `upstream_throttled`, saying explicitly that this is *not* the daily quota and *not* an exhausted key.
- **Daily threshold** — arrives as a `REQUEST_NOT_PROCESSED` body, not an HTTP error. Also surfaced as `upstream_throttled`, with the registration link.

## Data sources

- BLS Public Data API v2 — <https://api.bls.gov/publicAPI/v2/timeseries/data/> (docs: <https://www.bls.gov/developers/api_signature_v2.htm>)
- Series used: `CUUR0000SA0` / `CUSR0000SA0` (CPI-U, NSA / SA), `LNS14000000` (unemployment rate), `CES*` (Current Employment Statistics by industry)

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

### What this endpoint actually serves

`tools/list` at `https://gateway.pipeworx.io/econdata/mcp` returns the tools in the table
above **plus the shared Pipeworx meta-tools** — `ask_pipeworx`,
`discover_tools`, `search_within`, `remember`/`recall` and the rest of the
gateway-wide set. So the tool count you see is larger than this table: a
single-pack endpoint currently lists roughly 30 shared tools alongside the
pack's own. The connection's `initialize` response states its exact scope, and
is the authoritative answer for a given day.

This is deliberate, not multiplexing by accident. The meta-tools are what let a
scoped connection answer a question this pack does not cover — via
`ask_pipeworx`, which routes across the whole catalog — without you adding a
second MCP server. There is currently no way to mount a pack endpoint without
them; if the extra schemas cost you more context than the routing is worth,
connect to the full gateway once rather than to several pack endpoints.

Or connect to the full Pipeworx gateway to get every pack's tools listed
directly, instead of just this one's:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

Both URLs reach the same gateway and the same 1679+ data sources. The
only difference is which pack's tools are listed **directly**; `ask_pipeworx`
reaches all of them from either one.

## No MCP client? Call it over HTTP

```bash
curl -X POST https://gateway.pipeworx.io/v1/tools/econdata_get_series \
  -H 'Content-Type: application/json' \
  -d '{"series_id":"CUUR0000SA0"}'
```

No account needed for the first calls. Inspect any tool: `GET https://gateway.pipeworx.io/v1/tools/econdata_get_series`. Find one: `POST https://gateway.pipeworx.io/v1/tools/search_packs` with `{"query":"..."}`.

## Standalone (no gateway account)

This package also runs as a local stdio MCP server — no Pipeworx account, no
gateway round-trip:

```json
{
  "mcpServers": {
    "econdata": {
      "command": "npx",
      "args": ["-y", "@pipeworx/mcp-econdata"]
    }
  }
}
```

Or run it directly to confirm it starts:

```bash
npx -y @pipeworx/mcp-econdata
```

It speaks MCP over stdin/stdout and answers `initialize`/`tools/list`/`tools/call`
for **only** this pack's tools — none of the shared meta-tools the gateway
connection above adds. Same source, same tools, no ask_pipeworx routing.

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English —
this works on the pack endpoint above as well as on the full gateway:

```
ask_pipeworx({ question: "your question about Econdata data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
