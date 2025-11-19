import express from "express";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { DwrMcpServer } from "./index.js";

const app = express();
const port = process.env.PORT || 3000;

const server = new DwrMcpServer();
let transport: SSEServerTransport;

app.get("/sse", async (req, res) => {
    console.log("New SSE connection");
    transport = new SSEServerTransport("/messages", res);
    await server.run(transport);
});

app.post("/messages", async (req, res) => {
    console.log("New message");
    if (!transport) {
        res.sendStatus(400);
        return;
    }
    await transport.handlePostMessage(req, res);
});

// REST Endpoints for ChatGPT
app.get("/api/surface-water/stations", async (req, res) => {
    try {
        const result = await server.handleApiCall("surfacewater/surfacewaterstations", req.query);
        res.json(JSON.parse(result.content[0].text));
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.get("/api/surface-water/ts-day", async (req, res) => {
    try {
        const { abbrev, startDate, endDate } = req.query;
        const params = {
            abbrev,
            "min-measDate": startDate,
            "max-measDate": endDate
        };
        const result = await server.handleApiCall("surfacewater/surfacewatertsday", params);
        res.json(JSON.parse(result.content[0].text));
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.get("/api/water-rights/net-amount", async (req, res) => {
    try {
        const result = await server.handleApiCall("waterrights/netamount", req.query);
        res.json(JSON.parse(result.content[0].text));
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.get("/api/well-permits", async (req, res) => {
    try {
        const result = await server.handleApiCall("wellpermits/wellpermit", req.query);
        res.json(JSON.parse(result.content[0].text));
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.get("/api/admin-calls/active", async (req, res) => {
    try {
        const result = await server.handleApiCall("administrativecalls/active", req.query);
        res.json(JSON.parse(result.content[0].text));
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(port, () => {
    console.log(`DWR MCP Server listening on http://localhost:${port}`);
    console.log(`SSE endpoint: http://localhost:${port}/sse`);
});
