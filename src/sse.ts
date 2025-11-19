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

app.listen(port, () => {
    console.log(`DWR MCP Server listening on http://localhost:${port}`);
    console.log(`SSE endpoint: http://localhost:${port}/sse`);
});
