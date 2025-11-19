# Colorado DWR MCP Server

This is a Model Context Protocol (MCP) server that interfaces with the Colorado Division of Water Resources (DWR) REST API. It allows AI models to retrieve water data, rights, permits, and administrative calls.

## Features

- **Surface Water Stations**: Search for stations by name, location, etc.
- **Surface Water Time Series**: Get daily time series data (streamflow, etc.).
- **Water Rights**: Query net amounts and transactions.
- **Well Permits**: Search for well permits.
- **Administrative Calls**: Get active administrative calls.
- **Generic Query**: Flexible tool to query any DWR API endpoint.

## Installation

1.  Clone this repository.
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Build the server:
    ```bash
    npm run build
    ```

## Usage

### Stdio Mode (for local clients like Claude Desktop)

```bash
node build/index.js
```

### HTTP/SSE Mode (for remote connections)

```bash
node build/sse.js
```

This will start a server at `http://localhost:3000`.
- **SSE Endpoint**: `http://localhost:3000/sse`

### Configuration

No API key is strictly required for basic usage, but if you have one, you can set it via the `DWR_API_KEY` environment variable.

### Tools

- `get_surface_water_stations`
- `get_surface_water_ts_day`
- `get_water_rights_net_amount`
- `get_well_permits`
- `get_active_admin_calls`
- `query_dwr_api`

## Development

Run the test client to verify functionality:

```bash
npx tsx test_client.ts
```
