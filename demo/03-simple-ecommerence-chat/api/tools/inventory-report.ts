/**
 * Tool: inventory_report
 *
 * Returns stock levels for ZStore products across branches.
 * Can filter by product ID or branch ID, and optionally
 * flag products that are low in stock (threshold-based).
 */

import { INVENTORY, type InventoryRecord } from '../data/inventory';

// ─── Tool Definition (OpenAI function-calling format) ────────────────────────

export const inventoryReportTool = {
  type: 'function' as const,
  function: {
    name: 'inventory_report',
    description:
      'Get inventory / stock levels for ZStore products. ' +
      'Optionally filter by product ID or branch ID. Can also show only low-stock items.',
    parameters: {
      type: 'object',
      properties: {
        productId: {
          type: 'string',
          description: 'Filter by product ID (optional, e.g. "ZS-001")',
        },
        branchId: {
          type: 'string',
          description: 'Filter by branch ID (optional, e.g. "BKK-SIAM")',
        },
        lowStockOnly: {
          type: 'boolean',
          description: 'If true, only return items with stock ≤ 5 units',
        },
      },
      required: [],
    },
  },
};

// ─── Tool Handler ────────────────────────────────────────────────────────────

interface InventoryReportResult {
  totalRecords: number;
  totalUnits: number;
  filters: Record<string, string | boolean>;
  items: InventoryRecord[];
}

export function handleInventoryReport(args: {
  productId?: string;
  branchId?: string;
  lowStockOnly?: boolean;
}): InventoryReportResult {
  const { productId, branchId, lowStockOnly } = args;

  let filtered = [...INVENTORY];

  // Apply filters
  if (productId) {
    filtered = filtered.filter((inv) => inv.productId === productId);
  }
  if (branchId) {
    filtered = filtered.filter((inv) => inv.branchId === branchId);
  }
  if (lowStockOnly) {
    filtered = filtered.filter((inv) => inv.availableQty <= 5);
  }

  const totalUnits = filtered.reduce((sum, inv) => sum + inv.availableQty, 0);

  // Build active filters for context
  const filters: Record<string, string | boolean> = {};
  if (productId) filters.productId = productId;
  if (branchId) filters.branchId = branchId;
  if (lowStockOnly) filters.lowStockOnly = true;

  return {
    totalRecords: filtered.length,
    totalUnits,
    filters,
    items: filtered,
  };
}
