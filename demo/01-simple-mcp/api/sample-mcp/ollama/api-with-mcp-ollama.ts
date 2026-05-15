/**
 * Run:
 *   bun run api-with-mcp-ollama.ts
 *
 * Test (by product + branch):
 *   curl -X POST http://localhost:9000/chat \
 *     -H "Content-Type: application/json" \
 *     -d '{"message": "How many units of GAD-001 are left at BKK-SILOM?"}'
 *
 * Test (by product, all branches):
 *   curl -X POST http://localhost:9000/chat \
 *     -H "Content-Type: application/json" \
 *     -d '{"message": "How many units of GAD-001 are left across all branches?"}'
 *
 * Test (all products at a branch):
 *   curl -X POST http://localhost:9000/chat \
 *     -H "Content-Type: application/json" \
 *     -d '{"message": "What is the inventory at BKK-SIAM?"}'
 *
 * Test (track order):
 *   curl -X POST http://localhost:9000/chat \
 *     -H "Content-Type: application/json" \
 *     -d '{"message": "What is the status of order ORD-002?"}'
 */
import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { z } from 'zod';
import { MOCK_INVENTORY_DATA } from '../../data/inventory';
import { MOCK_ORDER_DATA } from '../../data/orders';

const OLLAMA_URL = process.env.OLLAMA_URL ?? 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? 'llama3.1';
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 9000;

/**
 * 1. Create MCP Server
 */
const mcpServer = new McpServer({
  name: 'ecommerce-admin-mcp-server',
  version: '1.0.0'
});

/**
 * 2. Implement tool handlers
 *    Replace these stubs with real DB/service calls.
 */

async function checkInventory(args: { productId?: string; branchId?: string }) {
  // Log the incoming request for visibility
  console.log('Checking inventory for', args);

  // Look up inventory from mock data — replace with a real DB/service call
  const results = MOCK_INVENTORY_DATA.filter((item) => {
    // Match by productId (exact) — skip if not provided
    const productMatch = args.productId ? item.productId === args.productId : true;

    // Match by branchId — skip filter if not provided (return all branches)
    const branchMatch = args.branchId ? item.branchId === args.branchId : true;

    return productMatch && branchMatch;
  });

  if (results.length === 0) {
    return { ...args, availableQty: 0, unit: 'pcs', message: 'Product not found' };
  }

  // Return a single object if only one row matched, otherwise return the full array
  return results.length === 1 ? results[0] : results;
}

async function trackOrder(args: { orderId?: string; customerName?: string }) {
  // Log the incoming request for visibility
  console.log('Tracking order for', args);

  // Look up orders from mock data — replace with a real DB/service call
  const results = MOCK_ORDER_DATA.filter((order) => {
    const orderMatch = args.orderId ? order.orderId === args.orderId : true;
    const customerMatch = args.customerName
      ? order.customerName.toLowerCase() === args.customerName.toLowerCase()
      : true;
    return orderMatch && customerMatch;
  });

  if (results.length === 0) {
    return { ...args, message: 'Order not found' };
  }

  return results.length === 1 ? results[0] : results;
}

/**
 * 3. Register MCP Tools
 */

mcpServer.registerTool(
  'check_inventory',
  {
    description: 'Check product inventory by product ID and/or branch ID. If branchId is omitted, returns inventory across all branches.',
    inputSchema: {
      productId: z.string().optional().describe('Product ID, e.g. GAD-001. Omit to get all products.'),
      branchId:  z.string().optional().describe('Branch ID, e.g. BKK-SILOM or BKK-SIAM. Omit if the user asks about all branches.')
    }
  },
  async (args) => {
    const data = await checkInventory(args);
    return {
      content: [{ type: 'text', text: JSON.stringify(data) }]
    };
  }
);

mcpServer.registerTool(
  'track_order',
  {
    description: 'Track an order by order ID or customer name. Returns order status, tracking info, and details.',
    inputSchema: {
      orderId:      z.string().optional().describe('Order ID, e.g. ORD-001. Omit to search by customer name.'),
      customerName: z.string().optional().describe('Customer name to look up orders for. Omit if order ID is provided.')
    }
  },
  async (args) => {
    const data = await trackOrder(args);
    return {
      content: [{ type: 'text', text: JSON.stringify(data) }]
    };
  }
);

/**
 * 4. Create in-process MCP client and connect it to the server via an in-memory transport
 */
const mcpClient = new Client({
  name: 'elysia-api',
  version: '1.0.0'
});

const [clientTransport, serverTransport] =
  InMemoryTransport.createLinkedPair();

await mcpServer.connect(serverTransport);
await mcpClient.connect(clientTransport);

/**
 * 5. Convert MCP tools to Ollama tool format
 */
async function getOllamaToolsFromMcp() {
  // Fetch the list of tools registered on the MCP server
  const result = await mcpClient.listTools();

  // Map each MCP tool definition to the shape Ollama expects
  return result.tools.map((tool) => ({
    type: 'function',
    function: {
      name: tool.name,
      description: tool.description ?? '',
      parameters: tool.inputSchema
    }
  }));
}

/**
 * 6. Call Ollama chat API
 */
async function callOllama(messages: any[], tools: any[]) {
  // Send the conversation history + MCP-sourced tools to Ollama
  const res = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      messages,
      tools,
      stream: false
    })
  });

  // Throw on HTTP errors so callers receive a clear message
  if (!res.ok) throw new Error(await res.text());
  return await res.json();
}

/**
 * 7. Elysia API — /chat endpoint
 *    Flow: user message → Ollama (first call) → dispatch tool calls via MCP client → Ollama (final call) → reply
 */
new Elysia()
  .use(cors())
  .post('/chat', async ({ body }) => {
    const { message } = body as { message: string };

    // Fetch available tools from MCP server and convert to Ollama format
    const tools = await getOllamaToolsFromMcp();

    // Build the initial message history with a system prompt and the user message
    const messages: any[] = [
      {
        role: 'system',
        content: 'Use tools when needed. Do not invent inventory values.'
      },
      {
        role: 'user',
        content: message
      }
    ];

    // First call: ask Ollama to respond (it may request tool calls)
    const first = await callOllama(messages, tools);
    const assistantMessage = first.message;

    // Append the assistant turn so the next call has full context
    messages.push(assistantMessage);

    // Execute each tool call the model requested via the MCP client
    for (const toolCall of assistantMessage.tool_calls ?? []) {
      const toolName = toolCall.function.name;
      const toolArgs = toolCall.function.arguments;

      // Dispatch the tool call through the MCP client — it routes to the MCP server handler
      const result = await mcpClient.callTool({
        name: toolName,
        arguments: toolArgs
      });

      // Append the tool result so the model can use it in the next turn
      messages.push({
        role: 'tool',
        content: JSON.stringify(result.content)
      });
    }

    // Final call: let Ollama produce a natural-language reply using the tool results
    const final = await callOllama(messages, tools);

    return {
      reply: final.message.content
    };
  })
  .listen(PORT);

console.log('▶ Sample: Tool Calling WITH MCP — Ollama');
console.log(`  Listening at http://localhost:${PORT}`);