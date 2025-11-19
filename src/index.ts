import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import axios from "axios";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

const BASE_URL = "https://dwr.state.co.us/Rest/GET/api/v2";

// Helper to format query params
const formatParams = (params: Record<string, any>) => {
    const formatted: Record<string, any> = {};
    for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null) {
            formatted[key] = value;
        }
    }
    return formatted;
};

export class DwrMcpServer {
    private server: Server;
    private apiKey?: string;

    constructor() {
        this.server = new Server(
            {
                name: "dwr-mcp-server",
                version: "1.0.0",
            },
            {
                capabilities: {
                    tools: {},
                },
            }
        );

        this.apiKey = process.env.DWR_API_KEY;

        this.setupToolHandlers();
        this.setupErrorHandling();
    }

    private setupErrorHandling() {
        this.server.onerror = (error) => {
            console.error("[MCP Error]", error);
        };
        process.on("SIGINT", async () => {
            await this.server.close();
            process.exit(0);
        });
    }

    private setupToolHandlers() {
        this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
            tools: [
                {
                    name: "get_surface_water_stations",
                    description: "Search for surface water stations in Colorado",
                    inputSchema: zodToJsonSchema(
                        z.object({
                            stationName: z.string().optional().describe("Name of the station (supports wildcards like *AB*)"),
                            division: z.number().optional().describe("Water division number (1-7)"),
                            county: z.string().optional().describe("County name"),
                            waterDistrict: z.number().optional().describe("Water district number"),
                            pageSize: z.number().optional().describe("Number of results to return (default 50)"),
                        })
                    ),
                },
                {
                    name: "get_surface_water_ts_day",
                    description: "Get daily time series data for a surface water station",
                    inputSchema: zodToJsonSchema(
                        z.object({
                            abbrev: z.string().describe("Station abbreviation (e.g., 'PLAPLACO')"),
                            startDate: z.string().describe("Start date (MM/DD/YYYY or YYYY-MM-DD)"),
                            endDate: z.string().describe("End date (MM/DD/YYYY or YYYY-MM-DD)"),
                        })
                    ),
                },
                {
                    name: "get_water_rights_net_amount",
                    description: "Get net amounts for water rights",
                    inputSchema: zodToJsonSchema(
                        z.object({
                            waterRightName: z.string().optional().describe("Name of the water right"),
                            division: z.number().optional().describe("Water division number"),
                            pageSize: z.number().optional().describe("Number of results to return"),
                        })
                    ),
                },
                {
                    name: "get_well_permits",
                    description: "Search for well permits",
                    inputSchema: zodToJsonSchema(
                        z.object({
                            wellName: z.string().optional().describe("Name of the well"),
                            receipt: z.string().optional().describe("Receipt number"),
                            pageSize: z.number().optional().describe("Number of results to return"),
                        })
                    ),
                },
                {
                    name: "get_active_admin_calls",
                    description: "Get active administrative calls",
                    inputSchema: zodToJsonSchema(
                        z.object({
                            division: z.number().optional().describe("Water division number"),
                        })
                    ),
                },
                {
                    name: "query_dwr_api",
                    description: "Generic tool to query any Colorado DWR REST API endpoint",
                    inputSchema: zodToJsonSchema(
                        z.object({
                            endpoint: z.string().describe("API endpoint path (e.g., 'surfacewater/surfacewaterstations')"),
                            params: z.record(z.any()).optional().describe("Query parameters"),
                        })
                    ),
                },
            ],
        }));

        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            try {
                switch (request.params.name) {
                    case "get_surface_water_stations": {
                        const args = request.params.arguments as any;
                        return await this.handleApiCall("surfacewater/surfacewaterstations", args);
                    }
                    case "get_surface_water_ts_day": {
                        const args = request.params.arguments as any;
                        const params = {
                            abbrev: args.abbrev,
                            "min-measDate": args.startDate,
                            "max-measDate": args.endDate
                        };
                        return await this.handleApiCall("surfacewater/surfacewatertsday", params);
                    }
                    case "get_water_rights_net_amount": {
                        const args = request.params.arguments as any;
                        return await this.handleApiCall("waterrights/netamount", args);
                    }
                    case "get_well_permits": {
                        const args = request.params.arguments as any;
                        return await this.handleApiCall("wellpermits/wellpermit", args);
                    }
                    case "get_active_admin_calls": {
                        const args = request.params.arguments as any;
                        return await this.handleApiCall("administrativecalls/active", args);
                    }
                    case "query_dwr_api": {
                        const args = request.params.arguments as any;
                        return await this.handleApiCall(args.endpoint, args.params || {});
                    }
                    default:
                        throw new Error(`Unknown tool: ${request.params.name}`);
                }
            } catch (error) {
                if (axios.isAxiosError(error)) {
                    return {
                        content: [
                            {
                                type: "text",
                                text: `DWR API Error: ${error.message}\n${JSON.stringify(
                                    error.response?.data || {},
                                    null,
                                    2
                                )}`,
                            },
                        ],
                        isError: true,
                    };
                }
                throw error;
            }
        });
    }

    private async handleApiCall(endpoint: string, params: any) {
        const url = `${BASE_URL}/${endpoint}`;
        const headers: Record<string, string> = {};
        if (this.apiKey) {
            headers["Authorization"] = this.apiKey; // Or however DWR expects it, docs say 'Token: ...' or query param
        }

        // DWR docs say: "Token: B9xxxxx-xxxx-4D47-y" in header OR apiKey query param
        // I'll use query param if apiKey is present to be safe/easy, or header if I can confirm.
        // Docs: "Request Header: ... Token: ..."
        // Let's stick to query params for simplicity if header format is custom.
        // Actually, let's use the params object.

        const finalParams = formatParams(params);
        if (this.apiKey) {
            finalParams["apiKey"] = this.apiKey;
        }

        console.error(`Fetching ${url} with params ${JSON.stringify(finalParams)}`);

        const response = await axios.get(url, {
            params: finalParams,
            headers,
        });

        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(response.data, null, 2),
                },
            ],
        };
    }

    async run(transport: any) {
        await this.server.connect(transport);
        console.error("DWR MCP Server running");
    }

    getMcpServer() {
        return this.server;
    }
}

// Only run if main module
import { fileURLToPath } from 'url';
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    const server = new DwrMcpServer();
    const transport = new StdioServerTransport();
    server.run(transport).catch(console.error);
}
