/**
 * ZStore Chatbot API Server
 *
 * Architecture (local MCP client — no tunnel required):
 *
 *   server.ts (local)
 *     │
 *     ├─── connects to ──→ mcp-server.ts (localhost:9001)
 *     │         fetches tool list at startup, calls tools during chat
 *     │
 *     └─── connects to ──→ Azure Foundry (cloud)
 *               sends: agent reference + function tool definitions
 *               receives: text response OR function_call requests
 *               loop until no more function calls
 *
 * How it works:
 *   1. On startup, server.ts connects to the local MCP server and fetches
 *      the list of available tools (search_products, inventory_report, etc.)
 *   2. Those tools are registered on the Foundry agent as standard function
 *      tool definitions (not MCP type — Foundry doesn't call MCP directly).
 *   3. On each /chat request, server.ts calls responses.create() with the
 *      agent reference. The LLM decides which tools to call.
 *   4. If the response contains function_call items, server.ts executes them
 *      locally via the MCP client (localhost:9001) and submits the results
 *      back to Foundry via a follow-up responses.create() call.
 *   5. The loop repeats until Foundry returns a plain text response.
 *
 * Prerequisites:
 *   - MCP server running: bun run dev:mcp   (port 9001)
 *   - No public tunnel needed — everything stays on localhost
 *
 * Run:
 *   bun run server.ts
 *
 * Test:
 *   curl -X POST http://localhost:9000/chat \
 *     -H "Content-Type: application/json" \
 *     -d '{"message": "What smartphones do you have?"}'
 */

import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { MongoClient } from 'mongodb';
import OpenAI from 'openai';
import { DefaultAzureCredential } from '@azure/identity';
import { AIProjectClient } from '@azure/ai-projects';
import { Client as MCPClient } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

// ─── Configuration ───────────────────────────────────────────────────────────
// .env is loaded automatically by Bun via --env-file flag in package.json scripts.

// Foundry project endpoint (from Azure Portal → your AI project)
const PROJECT_ENDPOINT = process.env.AZURE_AIPROJECT_ENDPOINT!;

// Agent name (created/updated at server startup)
const AGENT_NAME = process.env.AZURE_AGENT_NAME!;

// MCP server URL — local only, no tunnel needed
// server.ts connects to this directly as the MCP client
const MCP_SERVER_URL = process.env.MCP_SERVER_URL ?? 'http://localhost:9001/mcp';

// MongoDB
const MONGODB_URI = process.env.MONGODB_URI!;
const DB_NAME = process.env.DB_NAME ?? 'zstore';

// Azure OpenAI for embeddings
const AZURE_OPENAI_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT!;
const AZURE_OPENAI_API_KEY = process.env.AZURE_OPENAI_API_KEY!;
const EMBEDDING_DEPLOYMENT = process.env.AZURE_EMBEDDING_DEPLOYMENT ?? 'text-embedding-3-small';

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 9000;

// ─── MongoDB Client ─────────────────────────────────────────────────────────

const mongo = new MongoClient(MONGODB_URI);
await mongo.connect();
const db = mongo.db(DB_NAME);
console.log(`🔌 Connected to MongoDB: ${DB_NAME}`);

// ─── OpenAI Client (for embeddings) ────────────────────────────────────────

const embeddingClient = new OpenAI({
  baseURL: AZURE_OPENAI_ENDPOINT,
  apiKey: AZURE_OPENAI_API_KEY,
});

/** Generate a vector embedding for product text */
async function generateEmbedding(text: string): Promise<number[]> {
  const res = await embeddingClient.embeddings.create({
    model: EMBEDDING_DEPLOYMENT,
    input: text,
  });
  return res.data?.[0]?.embedding || [];
}

// ─── Foundry Client ─────────────────────────────────────────────────────────
// AIProjectClient authenticates via DefaultAzureCredential (az login, managed identity, etc.)
// getOpenAIClient() returns an OpenAI-compatible client scoped to the project.

const projectClient = new AIProjectClient(PROJECT_ENDPOINT, new DefaultAzureCredential());
const openAIClient = projectClient.getOpenAIClient();

// ─── Step 1: Connect to local MCP server ────────────────────────────────────
//
// server.ts is the MCP client. It connects to mcp-server.ts running on
// localhost:9001 — no public tunnel needed since both are local processes.
//
// The MCP client is used for two things:
//   a) At startup: fetch the tool list to register them with the Foundry agent
//   b) During chat: execute tool calls that the LLM requests

console.log(`🔌 Connecting to MCP server at ${MCP_SERVER_URL}...`);

const mcpClient = new MCPClient({ name: 'zstore-api-server', version: '1.0.0' });
await mcpClient.connect(new StreamableHTTPClientTransport(new URL(MCP_SERVER_URL)));

// Fetch all available tools from the MCP server
const { tools: mcpTools } = await mcpClient.listTools();
console.log(`   ✅ MCP tools discovered: ${mcpTools.map(t => t.name).join(', ')}`);

// ─── Step 2: Create the Foundry agent with function tool definitions ─────────
//
// We register the MCP tools on the Foundry agent as standard function tools.
// The LLM sees these definitions and decides when to call them.
// Foundry does NOT call the MCP server — server.ts handles execution locally.

// Load system instructions — plain text file, ready to use as-is.
const agentInstructions = await Bun.file(import.meta.dir + '/../agent-instructions.txt').text();

// Build the agent definition from MCP tools
const agentDefinition = {
  kind: 'prompt' as const,
  model: process.env.AZURE_MODEL_DEPLOYMENT ?? 'gpt-4o-mini',
  instructions: agentInstructions,
  // Convert MCP tool definitions → Foundry function tool definitions
  tools: mcpTools.map(tool => ({
    type: 'function' as const,
    name: tool.name,
    description: tool.description ?? '',
    parameters: tool.inputSchema as Record<string, unknown>,
    strict: false,
  })),
};

// ─── Create / update agent version ──────────────────────────────────────────
// createVersion() creates a new immutable version each time but keeps the same
// agent name. This is by design — Foundry treats agents as versioned artifacts.
// Each restart syncs the latest tool definitions from the MCP server.
console.log('🤖 Setting up Agent Smith in Foundry...');
console.log(`   Tools: [${agentDefinition.tools.map(t => t.name).join(', ')}]`);

const agentVersion = await projectClient.agents.createVersion(AGENT_NAME, agentDefinition);
console.log(`   ✅ Agent ready: ${agentVersion.name} (version ${agentVersion.version})`);

// ─── Conversation Store ─────────────────────────────────────────────────────
// In production you'd persist conversation IDs per user/session.
// For this demo, we store them in-memory keyed by a session ID.

const conversations = new Map<string, string>(); // sessionId → conversationId

// ─── API Endpoints ──────────────────────────────────────────────────────────

new Elysia()
  .use(cors())

  // ── Products CRUD ───────────────────────────────────────────────────────
  // GET  /products          — List all products (excludes embedding vectors)
  // POST /products          — Create a new product

  .get('/products', async () => {
    const products = await db.collection('products')
      .find({}, { projection: { embedding: 0 } })
      .toArray();
    return products;
  })

  .post('/products', async ({ body }) => {
    const product = body as Record<string, any>;

    // Generate embedding vector from product text (name + category + description)
    const textToEmbed = `${product.name} | ${product.category} | ${product.description}`;
    console.log(`🔍 Generating embedding for "${product.name}"...`);
    const embedding = await generateEmbedding(textToEmbed);
    console.log(`  ✅ Embedding generated (${embedding.length} dimensions)`);

    // Store product with embedding for Atlas Vector Search
    const result = await db.collection('products').insertOne({ ...product, embedding });
    return { success: true, insertedId: result.insertedId };
  })

  // ── Inventory CRUD ─────────────────────────────────────────────────────
  // GET  /inventory         — List all inventory records
  // PUT  /inventory         — Update stock for a specific product + branch

  .get('/inventory', async () => {
    const inventory = await db.collection('inventory').find({}).toArray();
    return inventory;
  })

  .put('/inventory', async ({ body }) => {
    const { productId, branchId, availableQty } = body as {
      productId: string;
      branchId: string;
      availableQty: number;
    };
    const result = await db.collection('inventory').updateOne(
      { productId, branchId },
      { $set: { availableQty } },
    );
    return { success: true, matchedCount: result.matchedCount, modifiedCount: result.modifiedCount };
  })

  // ── Orders CRUD ────────────────────────────────────────────────────────
  // GET  /orders            — List all orders
  // POST /orders            — Create a new order

  .get('/orders', async () => {
    const orders = await db.collection('orders')
      .find({})
      .sort({ orderDate: -1 })
      .toArray();
    return orders;
  })

  .post('/orders', async ({ body }) => {
    const order = body as Record<string, any>;
    order.orderDate = order.orderDate ?? new Date().toISOString().slice(0, 10);
    order.status = order.status ?? 'pending';
    const result = await db.collection('orders').insertOne(order);
    return { success: true, insertedId: result.insertedId };
  })

  // ── Sales Report ───────────────────────────────────────────────────────
  // GET /sales-report       — Aggregated sales stats from orders collection

  .get('/sales-report', async () => {
    const orders = await db.collection('orders').find({}).toArray();

    const completed = orders.filter((o: any) => o.status === 'completed');
    const pending = orders.filter((o: any) => o.status === 'pending');
    const cancelled = orders.filter((o: any) => o.status === 'cancelled');
    const totalRevenue = completed.reduce((sum: number, o: any) => sum + (o.totalPrice || 0), 0);

    // Group by product
    const byProduct: Record<string, { name: string; revenue: number; orders: number; statuses: string[] }> = {};
    for (const o of orders as any[]) {
      const key = o.productId || o.productName;
      if (!byProduct[key]) {
        byProduct[key] = { name: o.productName, revenue: 0, orders: 0, statuses: [] };
      }
      byProduct[key].orders++;
      byProduct[key].statuses.push(o.status);
      if (o.status === 'completed') byProduct[key].revenue += o.totalPrice || 0;
    }

    return {
      totalOrders: orders.length,
      completedOrders: completed.length,
      pendingOrders: pending.length,
      cancelledOrders: cancelled.length,
      totalRevenue,
      avgOrderValue: completed.length > 0 ? Math.round(totalRevenue / completed.length) : 0,
      byProduct: Object.values(byProduct),
    };
  })

  // ── Chat (Foundry Agent) ───────────────────────────────────────────────
  // POST /chat              — Send a message to Agent Smith and get a response

  .post('/chat', async ({ body }) => {
    const { message, sessionId = 'default' } = body as {
      message: string;
      sessionId?: string;
    };

    /**
     * Step 1: Get or create a conversation
     *
     * Conversations are server-managed objects that persist history across turns.
     * The Foundry service stores all items (messages, tool calls, tool outputs)
     * so we don't need to rebuild context on every request.
     */
    let conversationId = conversations.get(sessionId);

    if (!conversationId) {
      console.log(`📝 Creating new conversation for session: ${sessionId}`);
      const conversation = await openAIClient.conversations.create({
        items: [
          { type: 'message', role: 'user', content: message },
        ],
      });
      conversationId = conversation.id;
      conversations.set(sessionId, conversationId);
    } else {
      // Add the new user message to the existing conversation
      await openAIClient.conversations.items.create(conversationId, {
        items: [
          { type: 'message', role: 'user', content: message },
        ],
      });
    }

    console.log(`💬 User [${sessionId}]: ${message}`);

    /**
     * Step 2: Tool-call loop
     *
     * Send the conversation to the Foundry LLM and handle any tool calls
     * it requests — locally via the MCP client (localhost:9001).
     *
     * Loop:
     *   a) Call responses.create() → Foundry LLM returns a response
     *   b) Check output for function_call items (tool requests from the LLM)
     *   c) Execute each tool call locally via mcpClient.callTool()
     *   d) Submit all tool results back to Foundry via another responses.create()
     *      using previous_response_id to continue the same turn
     *   e) Repeat until the response contains no more function_call items
     */
    const agentRef = {
      agent_reference: {
        name: agentVersion.name,
        version: agentVersion.version,
        type: 'agent_reference',
      },
    };

    // Initial LLM call
    let response = await openAIClient.responses.create(
      { conversation: conversationId },
      { body: agentRef },
    );

    // Tool-call loop — keeps going until LLM returns a plain text response
    while (true) {
      const toolCalls = response.output.filter(
        (item): item is OpenAI.Responses.ResponseFunctionToolCall =>
          item.type === 'function_call',
      );

      if (toolCalls.length === 0) break; // No tool calls → done

      // Execute every requested tool call against the local MCP server
      console.log(`🔧 Executing ${toolCalls.length} tool call(s)...`);
      const toolOutputs = await Promise.all(
        toolCalls.map(async (call) => {
          const args = JSON.parse(call.arguments);
          console.log(`   → ${call.name}(${JSON.stringify(args)})`);

          const result = await mcpClient.callTool({ name: call.name, arguments: args });
          const content = result.content as Array<{ type: string; text?: string }>;
          const output = content
            .map(c => (c.type === 'text' ? (c.text ?? '') : JSON.stringify(c)))
            .join('\n');

          console.log(`   ← ${call.name}: ${output.slice(0, 80)}...`);

          return { call_id: call.call_id, output };
        }),
      );

      // Submit tool results back via the same conversation.
      // Per Foundry docs, use conversation: conversationId (not previous_response_id)
      // and send only the function_call_output items — the conversation already
      // tracks the prior function_call items so no need to echo them back.
      const functionCallOutputs = toolOutputs.map(({ call_id, output }) => ({
        type: 'function_call_output' as const,
        call_id,
        output,
      }));

      response = await openAIClient.responses.create(
        { input: functionCallOutputs, conversation: conversationId },
        { body: agentRef },
      );
    }

    console.log(`🤖 Agent Smith: ${response.output_text?.slice(0, 100)}...`);

    return { reply: response.output_text };
  })
  .listen(PORT);

console.log(`🏪 ZStore Chatbot API (Agent Smith) — listening at http://localhost:${PORT}`);
