/**
 * ZStore Sales / Order Data
 *
 * Contains mock order history for ZStore. Each order includes
 * the order ID, customer name, product details, quantity, total price,
 * status, and timestamps. Used by the "sales_report" and "place_order" tools.
 */

export interface Order {
  orderId: string;
  customerName: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  currency: string;
  branchId: string;
  branchName: string;
  status: 'completed' | 'pending' | 'cancelled';
  orderDate: string; // ISO date string
}

export const ORDERS: Order[] = [
  {
    orderId: 'ORD-20250501-001',
    customerName: 'Somchai K.',
    productId: 'ZS-001', productName: 'iPhone 16 Pro',
    quantity: 1, unitPrice: 42900, totalPrice: 42900, currency: 'THB',
    branchId: 'BKK-SIAM', branchName: 'Siam Paragon',
    status: 'completed', orderDate: '2025-05-01',
  },
  {
    orderId: 'ORD-20250502-002',
    customerName: 'Ploy M.',
    productId: 'ZS-003', productName: 'Sony WH-1000XM5',
    quantity: 2, unitPrice: 12990, totalPrice: 25980, currency: 'THB',
    branchId: 'BKK-CENTRAL', branchName: 'CentralWorld',
    status: 'completed', orderDate: '2025-05-02',
  },
  {
    orderId: 'ORD-20250503-003',
    customerName: 'James T.',
    productId: 'ZS-006', productName: 'MacBook Air 15-inch (M3)',
    quantity: 1, unitPrice: 52900, totalPrice: 52900, currency: 'THB',
    branchId: 'BKK-SIAM', branchName: 'Siam Paragon',
    status: 'completed', orderDate: '2025-05-03',
  },
  {
    orderId: 'ORD-20250504-004',
    customerName: 'Nattapong S.',
    productId: 'ZS-005', productName: 'Apple Watch Series 10',
    quantity: 3, unitPrice: 15900, totalPrice: 47700, currency: 'THB',
    branchId: 'CNX-MAYA', branchName: 'Maya Chiang Mai',
    status: 'completed', orderDate: '2025-05-04',
  },
  {
    orderId: 'ORD-20250505-005',
    customerName: 'Supaporn W.',
    productId: 'ZS-002', productName: 'Samsung Galaxy S25 Ultra',
    quantity: 1, unitPrice: 47900, totalPrice: 47900, currency: 'THB',
    branchId: 'BKK-SIAM', branchName: 'Siam Paragon',
    status: 'pending', orderDate: '2025-05-05',
  },
  {
    orderId: 'ORD-20250506-006',
    customerName: 'Arun P.',
    productId: 'ZS-007', productName: 'AirPods Pro 2 (USB-C)',
    quantity: 5, unitPrice: 9490, totalPrice: 47450, currency: 'THB',
    branchId: 'BKK-CENTRAL', branchName: 'CentralWorld',
    status: 'completed', orderDate: '2025-05-06',
  },
  {
    orderId: 'ORD-20250507-007',
    customerName: 'Kanya L.',
    productId: 'ZS-004', productName: 'iPad Pro 13-inch (M4)',
    quantity: 1, unitPrice: 49900, totalPrice: 49900, currency: 'THB',
    branchId: 'BKK-SIAM', branchName: 'Siam Paragon',
    status: 'cancelled', orderDate: '2025-05-07',
  },
  {
    orderId: 'ORD-20250508-008',
    customerName: 'Tawan R.',
    productId: 'ZS-008', productName: 'Nintendo Switch 2',
    quantity: 2, unitPrice: 16900, totalPrice: 33800, currency: 'THB',
    branchId: 'BKK-CENTRAL', branchName: 'CentralWorld',
    status: 'completed', orderDate: '2025-05-08',
  },
  {
    orderId: 'ORD-20250509-009',
    customerName: 'Manee C.',
    productId: 'ZS-001', productName: 'iPhone 16 Pro',
    quantity: 1, unitPrice: 42900, totalPrice: 42900, currency: 'THB',
    branchId: 'CNX-MAYA', branchName: 'Maya Chiang Mai',
    status: 'completed', orderDate: '2025-05-09',
  },
  {
    orderId: 'ORD-20250510-010',
    customerName: 'Piyapong D.',
    productId: 'ZS-003', productName: 'Sony WH-1000XM5',
    quantity: 1, unitPrice: 12990, totalPrice: 12990, currency: 'THB',
    branchId: 'BKK-SIAM', branchName: 'Siam Paragon',
    status: 'pending', orderDate: '2025-05-10',
  },
];
