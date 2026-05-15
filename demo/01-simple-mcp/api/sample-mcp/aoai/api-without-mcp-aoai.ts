/**
 * Run:
 *   AZURE_OPENAI_ENDPOINT=<endpoint> \
 *   AZURE_OPENAI_API_KEY=<key> \
 *   AZURE_OPENAI_DEPLOYMENT=<deployment> \
 *   bun run api-without-mcp-aoai.ts
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
 * 1. Define tools manually (no MCP)
 *    Tools are hardcoded here and passed directly to Azure OpenAI on every request.
 */
const tools: OpenAI.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'check_inventory',
      description: 'Check product inventory by product ID and/or branch ID. If branchId is omitted, returns inventory across all branches.',
      parameters: {
        type: 'object',
        properties: {
          productId: { type: 'string', description: 'Product ID, e.g. GAD-001. Omit to get all products.' },
          branchId:  { type: 'string', description: 'Branch ID, e.g. BKK-SILOM or BKK-SIAM. Omit if the user asks about all branches.' }
        },
        required: []
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'track_order',
      description: 'Track an order by order ID or customer name. Returns order status, tracking info, and details.',
      parameters: {
        type: 'object',
        properties: {
          orderId:      { type: 'string', description: 'Order ID, e.g. ORD-001. Omit to search by customer name.' },
          customerName: { type: 'string', description: 'Customer name to look up orders for. Omit if order ID is provided.' }
        },
        required: []
      }
    }
  }
];

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
 * 3. Map tool names to their handler functions
 */
const toolRegistry: Record<string, (args: any) => Promise<any>> = {
  check_inventory: checkInventory,
  track_order: trackOrder
};

/**
 * 4. Call Azure OpenAI via SDK
 */
async function callAzureOpenAI(messages: OpenAI.ChatCompletionMessageParam[]) {
  // Send the conversation history + available tools to Azure OpenAI
  return openai.chat.completions.create({
    model: AZURE_OPENAI_DEPLOYMENT,
    messages,
    tools,
    tool_choice: 'auto',
  });
}

/**
 * 5. Elysia API — /chat endpoint
 *    Flow: user message → Azure OpenAI (first call) → execute tool calls → Azure OpenAI (final call) → reply
 */
new Elysia()
  .use(cors())
  .post('/chat', async ({ body }) => {
    const { message } = body as { message: string };

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
    const firstResponse = await callAzureOpenAI(messages);
    const assistantMessage = firstResponse.choices[0].message;

    // Append the assistant turn so the next call has full context
    messages.push(assistantMessage);

    // Execute each tool call the model requested
    const toolCalls = (assistantMessage.tool_calls ?? [])
      .filter((tc): tc is OpenAI.ChatCompletionMessageToolCall & { type: 'function' } => tc.type === 'function');

    for (const toolCall of toolCalls) {
      const toolName = toolCall.function.name;
      // Arguments arrive as a JSON string — parse them before passing to the handler
      const toolArgs = JSON.parse(toolCall.function.arguments);

      // Look up and run the matching local handler
      const toolFn = toolRegistry[toolName];

      if (!toolFn) {
        throw new Error(`Unknown tool: ${toolName}`);
      }

      const toolResult = await toolFn(toolArgs);

      // Append the tool result so the model can use it in the next turn
      messages.push({
        role: 'tool',
        tool_call_id: toolCall.id,
        content: JSON.stringify(toolResult)
      });
    }

    // Final call: let Azure OpenAI produce a natural-language reply using the tool results
    const finalResponse = await callAzureOpenAI(messages);
    const reply = finalResponse.choices[0].message.content;

    return { reply };
  })
  .listen(PORT);

console.log('▶ Sample: Tool Calling WITHOUT MCP — Azure OpenAI');
console.log(`  Listening at http://localhost:${PORT}`);