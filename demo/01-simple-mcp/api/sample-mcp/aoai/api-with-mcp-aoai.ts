/**
 * Run:
 *   AZURE_OPENAI_ENDPOINT=<endpoint> \
 *   AZURE_OPENAI_API_KEY=<key> \
 *   AZURE_OPENAI_DEPLOYMENT=<deployment> \
 *   bun run api-with-mcp-aoai.ts
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
import OpenAI from 'openai';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { z } from 'zod';
import { MOCK_INVENTORY_DATA } from '../../data/inventory';
import { MOCK_ORDER_DATA } from '../../data/orders';

const AZURE_OPENAI_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT!;
const AZURE_OPENAI_API_KEY = process.env.AZURE_OPENAI_API_KEY!;
const AZURE_OPENAI_DEPLOYMENT = process.env.AZURE_OPENAI_DEPLOYMENT!;
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 9000;

// Point the OpenAI client at the Azure OpenAI endpoint
const openai = new OpenAI({
  baseURL: AZURE_OPENAI_ENDPOINT,
  apiKey: AZURE_OPENAI_API_KEY,
});

/**
 * 1. Create MCP Server
 */
const mcpServer = new McpServer({
  name: 'ecommerce-admin-mcp-server',
  version: '1.0.0'
});

/**
 * 2. Implement tool handler
 *    Replace this stub with a real DB/service call.
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
 * 4. Create in-process MCP client
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
 * 5. Convert MCP tools to OpenAI SDK tool format
 */
async function getOpenAIToolsFromMcp(): Promise<OpenAI.ChatCompletionTool[]> {
  // Fetch the list of tools registered on the MCP server
  const result = await mcpClient.listTools();

  // Map each MCP tool definition to the shape OpenAI SDK expects
  return result.tools.map((tool) => ({
    type: 'function' as const,
    function: {
      name: tool.name,
      description: tool.description ?? '',
      parameters: tool.inputSchema as OpenAI.FunctionParameters,
    }
  }));
}

/**
 * 6. Call Azure OpenAI via SDK
 */
async function callAzureOpenAI(
  messages: OpenAI.ChatCompletionMessageParam[],
  tools: OpenAI.ChatCompletionTool[]
) {
  // Send the conversation history + MCP-sourced tools to Azure OpenAI
  return openai.chat.completions.create({
    model: AZURE_OPENAI_DEPLOYMENT,
    messages,
    tools,
    tool_choice: 'auto',
  });
}

/**
 * 7. Elysia API
 */
new Elysia()
  .use(cors())
  .post('/chat', async ({ body }) => {
    const { message } = body as { message: string };

    // Fetch available tools from MCP server and convert to Azure OpenAI format
    const tools = await getOpenAIToolsFromMcp();

    // Build the initial message history with a system prompt and the user message
    const messages: any[] = [
      {
        role: 'system',
        content:
          'You are a helpful assistant. Use tools when needed. Do not invent inventory values.'
      },
      {
        role: 'user',
        content: message
      }
    ];

    // First call: ask Azure OpenAI to respond (it may request tool calls)
    const firstResponse = await callAzureOpenAI(messages, tools);
    const assistantMessage = firstResponse.choices[0].message;

    // Append the assistant turn so the next call has full context
    messages.push(assistantMessage);

    // Execute each tool call the model requested via the MCP client
    const toolCalls = (assistantMessage.tool_calls ?? [])
      .filter((tc): tc is OpenAI.ChatCompletionMessageToolCall & { type: 'function' } => tc.type === 'function');

    for (const toolCall of toolCalls) {
      const toolName = toolCall.function.name;
      // Arguments arrive as a JSON string — parse them before passing to the MCP client
      const toolArgs = JSON.parse(toolCall.function.arguments);

      // Dispatch the tool call through the MCP client — it routes to the MCP server handler
      const toolResult = await mcpClient.callTool({
        name: toolName,
        arguments: toolArgs
      });

      // Append the tool result so the model can use it in the next turn
      messages.push({
        role: 'tool',
        tool_call_id: toolCall.id,
        content: JSON.stringify(toolResult.content)
      });
    }

    // Final call: let Azure OpenAI produce a natural-language reply using the tool results
    const finalResponse = await callAzureOpenAI(messages, tools);
    const reply = finalResponse.choices[0].message.content;

    return { reply };
  })
  .listen(PORT);

console.log('▶ Sample: Tool Calling WITH MCP — Azure OpenAI');
console.log(`  Listening at http://localhost:${PORT}`);