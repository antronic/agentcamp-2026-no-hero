/**
 * rag.ts — A single-file RAG (Retrieval Augmented Generation) demo
 *
 * This CLI demonstrates the full RAG pipeline:
 *   1. Embedding documents into MongoDB Atlas with Azure AI embeddings
 *   2. Querying relevant documents via Atlas Vector Search
 *   3. Generating an answer using Azure AI Chat with retrieved context
 *
 * Usage:
 *   bun run rag.ts embed            — Embed sample documents into MongoDB
 *   bun run rag.ts chat "question"  — Ask a question using RAG
 */

import { MongoClient } from 'mongodb';
import OpenAI from 'openai';
import { SAMPLE_DOCUMENTS } from './data';

// ─── Configuration ───────────────────────────────────────────────────────────

const MONGODB_URI = process.env.MONGODB_URI!;
const AZURE_OPENAI_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT!;
const AZURE_OPENAI_API_KEY = process.env.AZURE_OPENAI_API_KEY!;

const DB_NAME = 'rag_demo';
const COLLECTION_NAME = 'documents';
const VECTOR_INDEX_NAME = 'vector_index';

// These must match your Azure AI deployment names
const EMBEDDING_DEPLOYMENT = process.env.AZURE_EMBEDDING_DEPLOYMENT ?? 'text-embedding-3-small';
const CHAT_DEPLOYMENT = process.env.AZURE_CHAT_DEPLOYMENT ?? 'gpt-4o-mini';

// ─── Clients ─────────────────────────────────────────────────────────────────

const mongo = new MongoClient(MONGODB_URI);

// Point the standard OpenAI client to the Azure AI Foundry endpoint
const openai = new OpenAI({
  baseURL: AZURE_OPENAI_ENDPOINT,
  apiKey: AZURE_OPENAI_API_KEY,
});

// ─── Sample Documents ────────────────────────────────────────────────────────
// In a real app these would come from files, a database, or an API.
// The sample data lives in a separate file to keep this file focused on the pipeline.

// =============================================================================
// Step 1 — Generate Embeddings
// =============================================================================
// We call Azure AI's Embeddings API to convert text into a numeric vector.
// This vector captures the *meaning* of the text so we can do similarity search.

async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: EMBEDDING_DEPLOYMENT,
    input: text,
  });

  // Print the embedding dimensions for debugging
  console.log(`Generated embedding for "${text.slice(0, 30)}..." (${response.data?.[0]?.embedding.length} dimensions)`);

  return response.data?.[0]?.embedding || [];
}

// =============================================================================
// Step 2 — Embed Documents into MongoDB
// =============================================================================
// For each sample document we:
//   a) Generate an embedding from its content
//   b) Store the document + embedding vector in MongoDB Atlas
//
// After inserting, we remind the user to create a Vector Search index in Atlas.

async function embedDocuments() {
  console.log('📥 Embedding documents into MongoDB Atlas...\n');

  const db = mongo.db(DB_NAME);
  const collection = db.collection(COLLECTION_NAME);

  // Clear existing documents to make re-runs idempotent
  await collection.deleteMany({});

  for (const doc of SAMPLE_DOCUMENTS) {
    // Generate the embedding vector for this document's content
    const embedding = await generateEmbedding(doc.content);

    // Store the document along with its embedding
    await collection.insertOne({
      title: doc.title,
      content: doc.content,
      embedding, // <-- this is the vector Atlas Vector Search will query
    });

    console.log(`  ✅ Embedded: "${doc.title}" (${embedding.length} dimensions)`);
  }

  console.log(`\n🎉 Done! ${SAMPLE_DOCUMENTS.length} documents embedded.\n`);
  console.log('⚠️  Make sure you have a Vector Search index in Atlas:');
  console.log('   Index name :', VECTOR_INDEX_NAME);
  console.log('   Field path : embedding');
  console.log('   Dimensions :', 1536);
  console.log('   Similarity : cosine');
}

// =============================================================================
// Step 3 — Query Relevant Documents via Atlas Vector Search
// =============================================================================
// We convert the user's question into an embedding, then use the
// $vectorSearch aggregation stage to find the most similar documents.

async function queryDocuments(question: string, topK = 3) {
  // Turn the question into a vector using the same embedding model
  const queryVector = await generateEmbedding(question);

  const db = mongo.db(DB_NAME);
  const collection = db.collection(COLLECTION_NAME);

  // Atlas Vector Search aggregation pipeline
  const results = await collection
    .aggregate([
      {
        $vectorSearch: {
          index: VECTOR_INDEX_NAME,
          path: 'embedding',
          queryVector,
          numCandidates: topK * 10, // broader candidate pool for better recall
          limit: topK,
        },
      },
      {
        // Project only the fields we need (exclude the large embedding array)
        $project: {
          _id: 0,
          title: 1,
          content: 1,
          score: { $meta: 'vectorSearchScore' },
        },
      },
    ])
    .toArray();

  return results;
}

// =============================================================================
// Step 4 — Generate an Answer with Azure AI (Responses API)
// =============================================================================
// We take the retrieved documents and inject them as context into a single
// prompt string, then stream the answer token-by-token using the Responses API.

async function generateAnswer(question: string) {
  console.log(`\n💬 Question: "${question}"\n`);
  console.log('🔍 Searching for relevant documents...\n');

  // Retrieve the most relevant documents
  const relevantDocs = await queryDocuments(question);

  if (relevantDocs.length === 0) {
    console.log('❌ No relevant documents found. Try embedding first.');
    return;
  }

  // Display retrieved documents
  for (const doc of relevantDocs) {
    console.log(`  📄 [score: ${doc.score.toFixed(4)}] ${doc.title}`);
  }

  // Build the context string from retrieved documents
  const context = relevantDocs
    .map((doc, i) => `[Document ${i + 1}: ${doc.title}]\n${doc.content}`)
    .join('\n\n');

  // Combine system instructions, context, and the user question into one prompt
  const prompt =
    'You are a helpful assistant. Answer the question based ONLY on the provided context. ' +
    'If the context does not contain enough information, say so. Keep your answer concise.\n\n' +
    `Context:\n${context}\n\nQuestion: ${question}`;

  console.log('\n🤖 Generating answer...\n');

  // Stream the response — each text delta is printed to stdout as it arrives
  const runner = openai.responses
    .stream({
      model: CHAT_DEPLOYMENT,
      input: prompt,
    })
    .on('response.output_text.delta', (diff) => process.stdout.write(diff.delta));

  // Wait for streaming to finish and retrieve the complete response
  await runner.finalResponse();
  console.log('\n');
}

// =============================================================================
// CLI Entry Point
// =============================================================================

const [command, ...args] = process.argv.slice(2);

async function main() {
  try {
    await mongo.connect();

    switch (command) {
      case 'embed':
        await embedDocuments();
        break;

      case 'chat': {
        const question = args.join(' ');
        if (!question) {
          console.error('Usage: bun run rag.ts chat "Your question here"');
          process.exit(1);
        }
        await generateAnswer(question);
        break;
      }

      default:
        console.log('Usage:');
        console.log('  bun run rag.ts embed               — Embed documents into MongoDB');
        console.log('  bun run rag.ts chat "question"      — Ask a question using RAG');
        process.exit(1);
    }
  } finally {
    await mongo.close();
  }
}

main();
