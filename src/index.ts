/**
 * Econdata MCP — wraps BLS (Bureau of Labor Statistics) public API v2
 * (https://api.bls.gov/publicAPI/v2/)
 *
 * Tools:
 * - get_series: Fetch any BLS time series by ID
 * - get_unemployment: US unemployment rate (series LNS14000000)
 * - get_cpi: Consumer Price Index (series CUUR0000SA0)
 * - get_employment_by_industry: Non-farm payroll employment by industry
 */

interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

interface McpToolExport {
  tools: McpToolDefinition[];
  callTool: (name: string, args: Record<string, unknown>) => Promise<unknown>;
}

const BASE_URL = 'https://api.bls.gov/publicAPI/v2';

// --- Raw API types ---

type RawDataPoint = {
  year: string;
  period: string;
  periodName: string;
  value: string;
  footnotes: unknown[];
};

type RawSeries = {
  seriesID: string;
  data: RawDataPoint[];
};

type RawBLSResponse = {
  status: string;
  responseTime: number;
  message: string[];
  Results?: {
    series: RawSeries[];
  };
};

// --- Tool definitions ---

const tools: McpToolExport['tools'] = [
  {
    name: 'get_series',
    description:
      'Fetch a BLS time series by series ID. Returns data points with year, period, and value. Example series IDs: "CUUR0000SA0" (CPI), "LNS14000000" (unemployment rate), "CES0000000001" (total nonfarm employment).',
    inputSchema: {
      type: 'object' as const,
      properties: {
        series_id: {
          type: 'string',
          description: 'BLS series ID (e.g. "CUUR0000SA0" for CPI)',
        },
        start_year: {
          type: 'string',
          description: 'Start year as 4-digit string (e.g. "2020"). Optional.',
        },
        end_year: {
          type: 'string',
          description: 'End year as 4-digit string (e.g. "2024"). Optional.',
        },
      },
      required: ['series_id'],
    },
  },
  {
    name: 'get_unemployment',
    description:
      'Get the US civilian unemployment rate over time (BLS series LNS14000000). Returns year, month, and rate for each period.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        start_year: {
          type: 'string',
          description: 'Start year as 4-digit string (e.g. "2020"). Optional.',
        },
        end_year: {
          type: 'string',
          description: 'End year as 4-digit string (e.g. "2024"). Optional.',
        },
      },
      required: [],
    },
  },
  {
    name: 'get_cpi',
    description:
      'Get the US Consumer Price Index for All Urban Consumers (BLS series CUUR0000SA0). Returns year, month, and index value for each period.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        start_year: {
          type: 'string',
          description: 'Start year as 4-digit string (e.g. "2020"). Optional.',
        },
        end_year: {
          type: 'string',
          description: 'End year as 4-digit string (e.g. "2024"). Optional.',
        },
      },
      required: [],
    },
  },
  {
    name: 'get_employment_by_industry',
    description:
      'Get US non-farm payroll employment figures by industry. Industry options: "total_nonfarm" (default), "manufacturing", "construction", "retail", "financial", "government". Returns employment in thousands.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        industry: {
          type: 'string',
          description:
            'Industry to retrieve. One of: "total_nonfarm", "manufacturing", "construction", "retail", "financial", "government". Defaults to "total_nonfarm".',
        },
        start_year: {
          type: 'string',
          description: 'Start year as 4-digit string (e.g. "2020"). Optional.',
        },
        end_year: {
          type: 'string',
          description: 'End year as 4-digit string (e.g. "2024"). Optional.',
        },
      },
      required: [],
    },
  },
];

// --- Industry series ID map ---

const INDUSTRY_SERIES: Record<string, string> = {
  total_nonfarm: 'CES0000000001',
  manufacturing: 'CES3000000001',
  construction: 'CES2000000001',
  retail: 'CES4200000001',
  financial: 'CES5500000001',
  government: 'CES9000000001',
};

// --- callTool dispatcher ---

async function callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  switch (name) {
    case 'get_series':
      return getSeries(
        args.series_id as string,
        args.start_year as string | undefined,
        args.end_year as string | undefined,
      );
    case 'get_unemployment':
      return getUnemployment(
        args.start_year as string | undefined,
        args.end_year as string | undefined,
      );
    case 'get_cpi':
      return getCpi(
        args.start_year as string | undefined,
        args.end_year as string | undefined,
      );
    case 'get_employment_by_industry':
      return getEmploymentByIndustry(
        (args.industry as string | undefined) ?? 'total_nonfarm',
        args.start_year as string | undefined,
        args.end_year as string | undefined,
      );
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

// --- Shared fetch helper ---

async function fetchSeries(
  seriesId: string,
  startYear?: string,
  endYear?: string,
): Promise<RawDataPoint[]> {
  const body: Record<string, unknown> = { seriesid: [seriesId] };
  if (startYear) body.startyear = startYear;
  if (endYear) body.endyear = endYear;

  const res = await fetch(`${BASE_URL}/timeseries/data/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`BLS API error: ${res.status}`);

  const data = (await res.json()) as RawBLSResponse;
  if (data.status !== 'REQUEST_SUCCEEDED') {
    throw new Error(`BLS API error: ${data.message?.join(', ') ?? data.status}`);
  }

  return data.Results?.series[0]?.data ?? [];
}

function formatDataPoint(point: RawDataPoint) {
  return {
    year: point.year,
    period: point.period,
    period_name: point.periodName,
    value: Number(point.value),
  };
}

// --- Tool implementations ---

async function getSeries(seriesId: string, startYear?: string, endYear?: string) {
  const data = await fetchSeries(seriesId, startYear, endYear);
  return {
    series_id: seriesId,
    start_year: startYear ?? null,
    end_year: endYear ?? null,
    total: data.length,
    data: data.map(formatDataPoint),
  };
}

async function getUnemployment(startYear?: string, endYear?: string) {
  const seriesId = 'LNS14000000';
  const data = await fetchSeries(seriesId, startYear, endYear);
  return {
    series_id: seriesId,
    description: 'Civilian Unemployment Rate (seasonally adjusted)',
    unit: 'percent',
    start_year: startYear ?? null,
    end_year: endYear ?? null,
    total: data.length,
    data: data.map((point) => ({
      year: point.year,
      month: point.periodName,
      period: point.period,
      rate: Number(point.value),
    })),
  };
}

async function getCpi(startYear?: string, endYear?: string) {
  const seriesId = 'CUUR0000SA0';
  const data = await fetchSeries(seriesId, startYear, endYear);
  return {
    series_id: seriesId,
    description: 'CPI for All Urban Consumers (not seasonally adjusted)',
    unit: 'index (1982-84=100)',
    start_year: startYear ?? null,
    end_year: endYear ?? null,
    total: data.length,
    data: data.map((point) => ({
      year: point.year,
      month: point.periodName,
      period: point.period,
      value: Number(point.value),
    })),
  };
}

async function getEmploymentByIndustry(
  industry: string,
  startYear?: string,
  endYear?: string,
) {
  const seriesId = INDUSTRY_SERIES[industry] ?? INDUSTRY_SERIES['total_nonfarm'];
  const data = await fetchSeries(seriesId, startYear, endYear);
  return {
    series_id: seriesId,
    industry,
    description: 'All Employees (seasonally adjusted)',
    unit: 'thousands of persons',
    start_year: startYear ?? null,
    end_year: endYear ?? null,
    total: data.length,
    data: data.map((point) => ({
      year: point.year,
      month: point.periodName,
      period: point.period,
      employment_thousands: Number(point.value),
    })),
  };
}

export default { tools, callTool } satisfies McpToolExport;
