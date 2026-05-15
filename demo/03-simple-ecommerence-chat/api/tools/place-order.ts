/**
 * Tool: place_order
 *
 * Places a new order for a ZStore product.
 * Validates product ID, checks stock at the specified branch,
 * and creates a new order record if stock is available.
 */

import { PRODUCTS } from '../data/products';
import { INVENTORY } from '../data/inventory';
import { ORDERS, type Order } from '../data/sales';

// ─── Tool Definition (OpenAI function-calling format) ────────────────────────

export const placeOrderTool = {
  type: 'function' as const,
  function: {
    name: 'place_order',
    description:
      'Place an order for a ZStore product. Requires the product ID, quantity, ' +
      'customer name, and branch ID. Returns the order confirmation or an error if out of stock.',
    parameters: {
      type: 'object',
      properties: {
        productId: {
          type: 'string',
          description: 'Product ID (e.g. "ZS-001")',
        },
        quantity: {
          type: 'number',
          description: 'Number of units to order',
        },
        customerName: {
          type: 'string',
          description: 'Customer name for the order',
        },
        branchId: {
          type: 'string',
          description: 'Branch ID to fulfill the order from (e.g. "BKK-SIAM", "BKK-CENTRAL", "CNX-MAYA")',
        },
      },
      required: ['productId', 'quantity', 'customerName', 'branchId'],
    },
  },
};

// ─── Tool Handler ────────────────────────────────────────────────────────────

export function handlePlaceOrder(args: {
  productId: string;
  quantity: number;
  customerName: string;
  branchId: string;
}): { success: boolean; order?: Order; error?: string } {
  const { productId, quantity, customerName, branchId } = args;

  // 1. Validate product exists
  const product = PRODUCTS.find((p) => p.productId === productId);
  if (!product) {
    return { success: false, error: `Product "${productId}" not found.` };
  }

  // 2. Check stock at the specified branch
  const stock = INVENTORY.find(
    (inv) => inv.productId === productId && inv.branchId === branchId
  );
  if (!stock) {
    return { success: false, error: `Branch "${branchId}" does not carry "${product.name}".` };
  }
  if (stock.availableQty < quantity) {
    return {
      success: false,
      error: `Insufficient stock: only ${stock.availableQty} ${stock.unit} available at ${stock.branchName}.`,
    };
  }

  // 3. Create the order (mock — appends to in-memory array)
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const orderId = `ORD-${today.replace(/-/g, '')}-${String(ORDERS.length + 1).padStart(3, '0')}`;

  const newOrder: Order = {
    orderId,
    customerName,
    productId,
    productName: product.name,
    quantity,
    unitPrice: product.price,
    totalPrice: product.price * quantity,
    currency: product.currency,
    branchId,
    branchName: stock.branchName,
    status: 'pending',
    orderDate: today,
  };

  // 4. Update stock and save order (in-memory only)
  stock.availableQty -= quantity;
  ORDERS.push(newOrder);

  return { success: true, order: newOrder };
}
