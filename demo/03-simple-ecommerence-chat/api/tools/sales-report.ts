/**
 * Tool: sales_report
 *
 * Generates a sales report from ZStore order history.
 * Can filter by date range, product, branch, or status.
 * Returns summary statistics and matching orders.
 */

import { ORDERS, type Order } from '../data/sales';

// ─── Tool Definition (OpenAI function-calling format) ────────────────────────

export const salesReportTool = {
  type: 'function' as const,
  function: {
    name: 'sales_report',
    description:
      'Generate a sales report for ZStore. Optionally filter by date range, product ID, branch ID, or order status. ' +
      'Returns total revenue, order count, and order details.',
    parameters: {
      type: 'object',
      properties: {
        startDate: {
          type: 'string',
          description: 'Start date in YYYY-MM-DD format (optional)',
        },
        endDate: {
          type: 'string',
          description: 'End date in YYYY-MM-DD format (optional)',
        },
        productId: {
          type: 'string',
          description: 'Filter by product ID (optional, e.g. "ZS-001")',
        },
        branchId: {
          type: 'string',
          description: 'Filter by branch ID (optional, e.g. "BKK-SIAM")',
        },
        status: {
          type: 'string',
          enum: ['completed', 'pending', 'cancelled'],
          description: 'Filter by order status (optional)',
        },
      },
      required: [],
    },
  },
};

// ─── Tool Handler ────────────────────────────────────────────────────────────

interface SalesReportResult {
  totalOrders: number;
  totalRevenue: number;
  currency: string;
  filters: Record<string, string>;
  orders: Order[];
}

export function handleSalesReport(args: {
  startDate?: string;
  endDate?: string;
  productId?: string;
  branchId?: string;
  status?: string;
}): SalesReportResult {
  const { startDate, endDate, productId, branchId, status } = args;

  let filtered = [...ORDERS];

  // Apply filters
  if (startDate) {
    filtered = filtered.filter((o) => o.orderDate >= startDate);
  }
  if (endDate) {
    filtered = filtered.filter((o) => o.orderDate <= endDate);
  }
  if (productId) {
    filtered = filtered.filter((o) => o.productId === productId);
  }
  if (branchId) {
    filtered = filtered.filter((o) => o.branchId === branchId);
  }
  if (status) {
    filtered = filtered.filter((o) => o.status === status);
  }

  // Calculate totals (only from completed orders for revenue)
  const completedOrders = filtered.filter((o) => o.status === 'completed');
  const totalRevenue = completedOrders.reduce((sum, o) => sum + o.totalPrice, 0);

  // Build the active filters for context
  const filters: Record<string, string> = {};
  if (startDate) filters.startDate = startDate;
  if (endDate) filters.endDate = endDate;
  if (productId) filters.productId = productId;
  if (branchId) filters.branchId = branchId;
  if (status) filters.status = status;

  return {
    totalOrders: filtered.length,
    totalRevenue,
    currency: 'THB',
    filters,
    orders: filtered,
  };
}
