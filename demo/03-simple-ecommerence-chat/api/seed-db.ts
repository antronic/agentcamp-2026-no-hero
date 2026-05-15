/**
 * seed-db.ts — ZStore Database Seeder & Embedding Generator
 *
 * This helper script loads all ZStore mock data into MongoDB Atlas and
 * generates vector embeddings for products using Azure OpenAI.
 * The embeddings enable semantic search via Atlas Vector Search.
 *
 * What it does:
 *   1. Connects to MongoDB Atlas
 *   2. Seeds the "products" collection (with embeddings for Vector Search)
 *   3. Seeds the "inventory" collection
 *   4. Seeds the "orders" collection
 *   5. Prints instructions for creating the Atlas Vector Search index
 *
 * Usage:
 *   bun run seed-db.ts              — Seed all collections
 *   bun run seed-db.ts products     — Seed only products (with embeddings)
 *   bun run seed-db.ts inventory    — Seed only inventory
 *   bun run seed-db.ts orders       — Seed only orders
 */

import { MongoClient } from 'mongodb';
import OpenAI from 'openai';
import { PRODUCTS } from './data/products';
import { INVENTORY } from './data/inventory';
import { ORDERS } from './data/sales';

// ─── Configuration ───────────────────────────────────────────────────────────
// .env is loaded automatically by Bun via --env-file flag in package.json scripts.

const MONGODB_URI = process.env.MONGODB_URI!;
const DB_NAME = process.env.DB_NAME ?? 'zstore';

// Azure OpenAI for embeddings (uses the same baseURL pattern as demo 02)
const AZURE_OPENAI_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT!;
const AZURE_OPENAI_API_KEY = process.env.AZURE_OPENAI_API_KEY!;
const EMBEDDING_DEPLOYMENT = process.env.AZURE_EMBEDDING_DEPLOYMENT ?? 'text-embedding-3-small';

const VECTOR_INDEX_NAME = 'vector_index';

// ─── Clients ─────────────────────────────────────────────────────────────────

const mongo = new MongoClient(MONGODB_URI);
const openai = new OpenAI({
  baseURL: AZURE_OPENAI_ENDPOINT,
  apiKey: AZURE_OPENAI_API_KEY,
});

// =============================================================================
// Step 1 — Generate Embeddings via Azure OpenAI
// =============================================================================
// Converts product text (name + category + description) into a vector.
// This embedding is stored alongside the product document in MongoDB
// so Atlas Vector Search can do semantic similarity matching.

async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: EMBEDDING_DEPLOYMENT,
    input: text,
  });
  return response.data?.[0]?.embedding || [];
}

// =============================================================================
// Step 2 — Seed Products (with embeddings)
// =============================================================================
// For each product, we:
//   a) Build a text representation combining name, category, and description
//   b) Generate an embedding vector from that text
//   c) Store the product + embedding in the "products" collection

async function seedProducts() {
  console.log('\n📦 Seeding products with embeddings...\n');

  const db = mongo.db(DB_NAME);
  const collection = db.collection('products');

  // Clear existing data for idempotent re-runs
  await collection.deleteMany({});

  for (const product of PRODUCTS) {
    // Combine fields into a single text for richer embeddings
    const textToEmbed = `${product.name} | ${product.category} | ${product.description}`;

    // Generate the embedding vector
    const embedding = await generateEmbedding(textToEmbed);

    // Store product + embedding in MongoDB
    await collection.insertOne({
      ...product,
      embedding, // <-- Atlas Vector Search will query this field
    });

    console.log(`  ✅ ${product.productId}: "${product.name}" (${embedding.length}d vector)`);
  }

  console.log(`\n🎉 ${PRODUCTS.length} products seeded with embeddings.`);
}

// =============================================================================
// Step 3 — Seed Inventory
// =============================================================================

async function seedInventory() {
  console.log('\n🏭 Seeding inventory...\n');

  const db = mongo.db(DB_NAME);
  const collection = db.collection('inventory');

  await collection.deleteMany({});
  await collection.insertMany([...INVENTORY]);

  console.log(`  ✅ ${INVENTORY.length} inventory records seeded.`);
}

// =============================================================================
// Step 4 — Seed Orders
// =============================================================================

async function seedOrders() {
  console.log('\n🛒 Seeding orders...\n');

  const db = mongo.db(DB_NAME);
  const collection = db.collection('orders');

  await collection.deleteMany({});
  await collection.insertMany([...ORDERS]);

  console.log(`  ✅ ${ORDERS.length} orders seeded.`);
}

// =============================================================================
// Step 5 — Print Vector Search Index Instructions
// =============================================================================

function printVectorIndexInstructions() {
  console.log('\n' + '='.repeat(70));
  console.log('⚠️  IMPORTANT: Create an Atlas Vector Search index');
  console.log('='.repeat(70));
  console.log(`
In MongoDB Atlas, go to your cluster → Atlas Search → Create Index
and create a Vector Search index with this JSON definition:

{
  "fields": [
    {
      "type": "vector",
      "path": "embedding",
      "numDimensions": 1536,
      "similarity": "cosine"
    }
  ]
}

Settings:
  Database    : ${DB_NAME}
  Collection  : products
  Index name  : ${VECTOR_INDEX_NAME}
`);
}

// =============================================================================
// CLI Entry Point
// =============================================================================

const [target] = process.argv.slice(2);

async function main() {
  try {
    console.log(`🔌 Connecting to MongoDB Atlas...`);
    await mongo.connect();
    console.log(`✅ Connected to database: ${DB_NAME}`);

    switch (target) {
      case 'products':
        await seedProducts();
        printVectorIndexInstructions();
        break;

      case 'inventory':
        await seedInventory();
        break;

      case 'orders':
        await seedOrders();
        break;

      default:
        // Seed everything
        await seedProducts();
        await seedInventory();
        await seedOrders();
        printVectorIndexInstructions();
        console.log('\n✨ All collections seeded successfully!\n');
        break;
    }
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  } finally {
    await mongo.close();
  }
}

main();
