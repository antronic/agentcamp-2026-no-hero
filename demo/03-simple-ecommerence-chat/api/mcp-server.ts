/**
 * ZStore MCP Server
 *
 * Exposes the ZStore tools (search products, place order, sales report,
 * inventory report) as an MCP (Model Context Protocol) server over
 * Streamable HTTP transport. The Foundry Agent Service connects to this
 * MCP server to access ZStore data.
 *
 * Run:
 *   bun run mcp-server.ts
 *
 * The MCP endpoint will be available at:
 *   http://localhost:9001/mcp
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { z } from 'zod';
import { MongoClient } from 'mongodb';

// ─── Configuration ───────────────────────────────────────────────────────────
// .env is loaded automatically by Bun via --env-file flag in package.json scripts.

const MONGODB_URI = process.env.MONGODB_URI!;
const DB_NAME = process.env.DB_NAME ?? 'zstore';
const MCP_PORT = process.env.MCP_PORT ? parseInt(process.env.MCP_PORT) : 9001;

// ─── MongoDB Client ─────────────────────────────────────────────────────────

const mongo = new MongoClient(MONGODB_URI);
await mongo.connect();
const db = mongo.db(DB_NAME);
console.log(`🔌 Connected to MongoDB: ${DB_NAME}`);

// =============================================================================
// 1. MCP Server Factory
// =============================================================================
// In stateless mode the MCP SDK requires a fresh McpServer + Transport per
// request, so we wrap tool registration in a factory function.

function createMcpServer() {
  const server = new McpServer({
    name: 'zstore-mcp-server',
    version: '1.0.0',
  });

  // ===========================================================================
  // 2. Register Tools
  // ===========================================================================

  /**
   * Tool: search_products
   * Searches the product catalog in MongoDB by keyword or category.
   */
  server.registerTool(
  'search_products',
  {
    description:
      'Search ZStore products by keyword or category. Returns product details and pricing from MongoDB.',
    inputSchema: {
      query: z.string().optional().describe('Search keyword (e.g. "iPhone", "headphones")'),
      category: z.string().optional().describe('Category filter (e.g. "Smartphones", "Audio", "Laptops", "Tablets", "Wearables", "Gaming")'),
    },
  },
  async ({ query, category }) => {
    console.log('🔍 search_products', { query, category });

    const filter: Record<string, any> = {};
    if (category) filter.category = { $regex: new RegExp(category, 'i') };
    if (query) {
      filter.$or = [
        { name: { $regex: new RegExp(query, 'i') } },
        { description: { $regex: new RegExp(query, 'i') } },
        { category: { $regex: new RegExp(query, 'i') } },
      ];
    }

    const products = await db.collection('products')
      .find(filter, { projection: { embedding: 0, _id: 0 } })
      .toArray();

    return { content: [{ type: 'text', text: JSON.stringify(products) }] };
  },
);

/**
 * Tool: inventory_report
 * Returns stock levels per product and branch from MongoDB.
 */
server.registerTool(
  'inventory_report',
  {
    description:
      'Get inventory / stock levels for ZStore products. Filter by product ID, branch ID, or low-stock only.',
    inputSchema: {
      productId: z.string().optional().describe('Filter by product ID (e.g. "ZS-001")'),
      branchId: z.string().optional().describe('Filter by branch ID (e.g. "BKK-SIAM", "BKK-CENTRAL", "CNX-MAYA")'),
      lowStockOnly: z.boolean().optional().describe('If true, only return items with stock ≤ 5 units'),
    },
  },
  async ({ productId, branchId, lowStockOnly }) => {
    console.log('📦 inventory_report', { productId, branchId, lowStockOnly });

    const filter: Record<string, any> = {};
    if (productId) filter.productId = productId;
    if (branchId) filter.branchId = branchId;
    if (lowStockOnly) filter.availableQty = { $lte: 5 };

    const items = await db.collection('inventory').find(filter, { projection: { _id: 0 } }).toArray();
    const totalUnits = items.reduce((sum: number, i: any) => sum + i.availableQty, 0);

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({ totalRecords: items.length, totalUnits, items }),
      }],
    };
  },
);


/**
 * Tool: update_inventory
 * Updates stock levels for a specific product at a specific branch.
 */
server.registerTool(
  'update_inventory',
  {
    description:
      'Update the stock quantity for a product at a specific branch. Use this to restock, adjust, or correct inventory levels.',
    inputSchema: {
      productId: z.string().describe('Product ID (e.g. "ZS-001")'),
      branchId: z.string().describe('Branch ID (e.g. "BKK-SIAM", "BKK-CENTRAL", "CNX-MAYA")'),
      availableQty: z.number().describe('New available quantity to set'),
    },
  },
  async ({ productId, branchId, availableQty }) => {
    console.log('📝 update_inventory', { productId, branchId, availableQty });

    // Validate the inventory record exists
    const existing = await db.collection('inventory').findOne({ productId, branchId });
    if (!existing) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: `No inventory record found for product "${productId}" at branch "${branchId}".`,
          }),
        }],
      };
    }

    const previousQty = existing.availableQty;
    await db.collection('inventory').updateOne(
      { productId, branchId },
      { $set: { availableQty } },
    );

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          productId,
          branchId,
          branchName: existing.branchName,
          previousQty,
          newQty: availableQty,
        }),
      }],
    };
  },
);

/**
 * Tool: place_order
 * Creates a new customer order in MongoDB. Validates stock before inserting.
 */
server.registerTool(
  'place_order',
  {
    description:
      'Place an order for a ZStore product. Requires product ID, quantity, customer name, and branch ID.',
    inputSchema: {
      productId: z.string().describe('Product ID (e.g. "ZS-001")'),
      quantity: z.number().describe('Number of units to order'),
      customerName: z.string().describe('Customer name'),
      branchId: z.string().describe('Branch ID (e.g. "BKK-SIAM", "BKK-CENTRAL", "CNX-MAYA")'),
    },
  },
  async ({ productId, quantity, customerName, branchId }) => {
    console.log('🛒 place_order', { productId, quantity, customerName, branchId });

    // Validate product
    const product = await db.collection('products').findOne({ productId }, { projection: { embedding: 0 } });
    if (!product) {
      return { content: [{ type: 'text', text: JSON.stringify({ success: false, error: `Product "${productId}" not found.` }) }] };
    }

    // Check stock
    const stock = await db.collection('inventory').findOne({ productId, branchId });
    if (!stock || stock.availableQty < quantity) {
      const available = stock?.availableQty ?? 0;
      // Also check other branches for helpful suggestion
      const otherStock = await db.collection('inventory').find({ productId, branchId: { $ne: branchId }, availableQty: { $gt: 0 } }).toArray();
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: `Insufficient stock: only ${available} units at ${branchId}.`,
            availableElsewhere: otherStock.map((s: any) => ({ branchId: s.branchId, branchName: s.branchName, qty: s.availableQty })),
          }),
        }],
      };
    }

    // Create order
    const today = new Date().toISOString().slice(0, 10);
    const count = await db.collection('orders').countDocuments();
    const orderId = `ORD-${today.replace(/-/g, '')}-${String(count + 1).padStart(3, '0')}`;

    const order = {
      orderId, customerName, productId,
      productName: product.name,
      quantity, unitPrice: product.price,
      totalPrice: product.price * quantity,
      currency: product.currency ?? 'THB',
      branchId, branchName: stock.branchName,
      status: 'pending', orderDate: today,
    };

    await db.collection('orders').insertOne(order);
    await db.collection('inventory').updateOne({ productId, branchId }, { $inc: { availableQty: -quantity } });

    return { content: [{ type: 'text', text: JSON.stringify({ success: true, order }) }] };
  },
);

/**
 * Tool: sales_report
 * Generates revenue and order statistics from MongoDB orders collection.
 */
server.registerTool(
  'sales_report',
  {
    description:
      'Generate a sales report. Optionally filter by date range, product ID, branch ID, or status.',
    inputSchema: {
      startDate: z.string().optional().describe('Start date YYYY-MM-DD'),
      endDate: z.string().optional().describe('End date YYYY-MM-DD'),
      productId: z.string().optional().describe('Filter by product ID'),
      branchId: z.string().optional().describe('Filter by branch ID'),
      status: z.enum(['completed', 'pending', 'cancelled']).optional().describe('Filter by order status'),
    },
  },
  async ({ startDate, endDate, productId, branchId, status }) => {
    console.log('📊 sales_report', { startDate, endDate, productId, branchId, status });

    const filter: Record<string, any> = {};
    if (startDate) filter.orderDate = { ...filter.orderDate, $gte: startDate };
    if (endDate) filter.orderDate = { ...filter.orderDate, $lte: endDate };
    if (productId) filter.productId = productId;
    if (branchId) filter.branchId = branchId;
    if (status) filter.status = status;

    const orders = await db.collection('orders').find(filter, { projection: { _id: 0 } }).toArray();
    const completed = orders.filter((o: any) => o.status === 'completed');
    const totalRevenue = completed.reduce((sum: number, o: any) => sum + (o.totalPrice || 0), 0);

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          totalOrders: orders.length,
          completedOrders: completed.length,
          pendingOrders: orders.filter((o: any) => o.status === 'pending').length,
          cancelledOrders: orders.filter((o: any) => o.status === 'cancelled').length,
          totalRevenue,
          orders,
        }),
      }],
    };
  },
  );

/**
 * Tool: create_product
 * Creates a new product in the MongoDB products collection.
 */
server.registerTool(
  'create_product',
  {
    description:
      'Create a new product in the ZStore catalog. Returns the created product with its generated ID.',
    inputSchema: {
      name:        z.string().describe('Product name, e.g. "MacBook Air M4"'),
      category:    z.string().describe('Category, e.g. "Smartphones", "Audio", "Laptops", "Tablets", "Wearables", "Gaming"'),
      description: z.string().describe('Product description'),
      price:       z.number().describe('Price in THB'),
      imageUrl:    z.string().optional().describe('Product image URL (optional)'),
    },
  },
  async ({ name, category, description, price, imageUrl }) => {
    console.log('🆕 create_product', { name, category, price });

    // Generate the next product ID (ZS-XXX)
    const lastProduct = await db.collection('products')
      .find({}, { projection: { productId: 1 } })
      .sort({ productId: -1 })
      .limit(1)
      .toArray();

    const lastNum = lastProduct.length > 0
      ? parseInt(lastProduct[0].productId.replace('ZS-', ''))
      : 0;
    const productId = `ZS-${String(lastNum + 1).padStart(3, '0')}`;

    const product = {
      productId,
      name,
      category,
      description,
      price,
      currency: 'THB',
      imageUrl: imageUrl ?? '',
    };

    await db.collection('products').insertOne(product);

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          product,
          note: 'Product created. Embedding vector not generated — use POST /products endpoint or re-run seed for vector search support.',
        }),
      }],
    };
  },
);

  return server;
}

// =============================================================================
// 3. Start Web Standard Streamable HTTP Transport
// =============================================================================
// Stateless mode (sessionIdGenerator: undefined) — each request is independent.
// A fresh McpServer + Transport pair is created per request because the MCP SDK
// binds a server to exactly one transport and stateless transports are single-use.

async function handleMcpRequest(req: Request): Promise<Response> {
  const mcpServer = createMcpServer();
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });
  await mcpServer.connect(transport);
  return transport.handleRequest(req);
}

const httpServer = Bun.serve({
  port: MCP_PORT,
  routes: {
    // MCP endpoint — fresh transport per request (stateless mode)
    '/mcp': {
      POST: (req) => handleMcpRequest(req),
      GET: (req) => handleMcpRequest(req),
      DELETE: (req) => handleMcpRequest(req),
    },
    // Health check
    '/health': new Response(
      JSON.stringify({ status: 'ok', server: 'zstore-mcp-server' }),
      { headers: { 'Content-Type': 'application/json' } },
    ),
  },
  fetch() {
    return new Response('Not Found', { status: 404 });
  },
});

console.log(`🔧 ZStore MCP Server — listening at http://localhost:${httpServer.port}/mcp`);