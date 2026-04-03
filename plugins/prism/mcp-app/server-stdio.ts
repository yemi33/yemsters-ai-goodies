import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createPrismServer } from "./prism-server.js";

const server = createPrismServer();
const transport = new StdioServerTransport();
await server.connect(transport);
