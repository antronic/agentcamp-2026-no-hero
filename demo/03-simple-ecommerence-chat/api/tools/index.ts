/**
 * Tool Registry
 *
 * Central registry for all tools available to the chatbot.
 * Each tool has:
 *   - A definition (OpenAI function-calling schema) used by the LLM
 *   - A handler function that executes the tool logic
 *
 * To add a new tool:
 *   1. Create a new file in this directory (e.g. my-tool.ts)
 *   2. Export a tool definition and handler
 *   3. Import and register them below
 */

import { searchProductsTool, handleSearchProducts } from './search-products';
import { placeOrderTool, handlePlaceOrder } from './place-order';
import { salesReportTool, handleSalesReport } from './sales-report';
import { inventoryReportTool, handleInventoryReport } from './inventory-report';

// ─── All tool definitions (passed to OpenAI on every request) ────────────────

export const TOOL_DEFINITIONS = [
  searchProductsTool,
  placeOrderTool,
  salesReportTool,
  inventoryReportTool,
];

// ─── Tool handler map (name → function) ─────────────────────────────────────
// When the LLM calls a tool, we look up the handler by name and execute it.

type ToolHandler = (args: any) => any;

export const TOOL_HANDLERS: Record<string, ToolHandler> = {
  search_products: handleSearchProducts,
  place_order: handlePlaceOrder,
  sales_report: handleSalesReport,
  inventory_report: handleInventoryReport,
};
