/**
 * Tool: search_products
 *
 * Searches the ZStore product catalog by keyword or category.
 * Matches against product name, category, or description.
 * Returns matching products with their details and pricing.
 */

import { PRODUCTS, type Product } from '../data/products';

// ─── Tool Definition (OpenAI function-calling format) ────────────────────────

export const searchProductsTool = {
  type: 'function' as const,
  function: {
    name: 'search_products',
    description:
      'Search ZStore products by keyword or category. ' +
      'Use this when the user asks about products, prices, specs, or what is available.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search keyword (e.g. "iPhone", "headphones", "laptop")',
        },
        category: {
          type: 'string',
          description: 'Optional product category filter (e.g. "Smartphones", "Audio", "Laptops", "Tablets", "Wearables", "Gaming")',
        },
      },
      required: [],
    },
  },
};

// ─── Tool Handler ────────────────────────────────────────────────────────────

export function handleSearchProducts(args: { query?: string; category?: string }): Product[] {
  const { query, category } = args;

  let results = [...PRODUCTS];

  // Filter by category (exact match, case-insensitive)
  if (category) {
    results = results.filter(
      (p) => p.category.toLowerCase() === category.toLowerCase()
    );
  }

  // Filter by keyword (searches name + description, case-insensitive)
  if (query) {
    const q = query.toLowerCase();
    results = results.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
    );
  }

  return results;
}
