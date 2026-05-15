/**
 * ZStore Inventory Data
 *
 * Tracks stock levels for each product across ZStore branches.
 * Each record shows the available quantity at a specific branch.
 * Used by the "inventory_report" tool to answer stock-related questions.
 */

export interface InventoryRecord {
  productId: string;
  productName: string;
  branchId: string;
  branchName: string;
  availableQty: number;
  unit: string;
}

export const INVENTORY: InventoryRecord[] = [
  // ZS-001: iPhone 16 Pro
  { productId: 'ZS-001', productName: 'iPhone 16 Pro',           branchId: 'BKK-SIAM',   branchName: 'Siam Paragon',  availableQty: 12, unit: 'pcs' },
  { productId: 'ZS-001', productName: 'iPhone 16 Pro',           branchId: 'BKK-CENTRAL', branchName: 'CentralWorld',  availableQty: 5,  unit: 'pcs' },
  { productId: 'ZS-001', productName: 'iPhone 16 Pro',           branchId: 'CNX-MAYA',    branchName: 'Maya Chiang Mai', availableQty: 3, unit: 'pcs' },

  // ZS-002: Samsung Galaxy S25 Ultra
  { productId: 'ZS-002', productName: 'Samsung Galaxy S25 Ultra', branchId: 'BKK-SIAM',   branchName: 'Siam Paragon',  availableQty: 8,  unit: 'pcs' },
  { productId: 'ZS-002', productName: 'Samsung Galaxy S25 Ultra', branchId: 'BKK-CENTRAL', branchName: 'CentralWorld',  availableQty: 0,  unit: 'pcs' },
  { productId: 'ZS-002', productName: 'Samsung Galaxy S25 Ultra', branchId: 'CNX-MAYA',    branchName: 'Maya Chiang Mai', availableQty: 6, unit: 'pcs' },

  // ZS-003: Sony WH-1000XM5
  { productId: 'ZS-003', productName: 'Sony WH-1000XM5',         branchId: 'BKK-SIAM',   branchName: 'Siam Paragon',  availableQty: 25, unit: 'pcs' },
  { productId: 'ZS-003', productName: 'Sony WH-1000XM5',         branchId: 'BKK-CENTRAL', branchName: 'CentralWorld',  availableQty: 18, unit: 'pcs' },
  { productId: 'ZS-003', productName: 'Sony WH-1000XM5',         branchId: 'CNX-MAYA',    branchName: 'Maya Chiang Mai', availableQty: 10, unit: 'pcs' },

  // ZS-004: iPad Pro 13-inch (M4)
  { productId: 'ZS-004', productName: 'iPad Pro 13-inch (M4)',   branchId: 'BKK-SIAM',   branchName: 'Siam Paragon',  availableQty: 7,  unit: 'pcs' },
  { productId: 'ZS-004', productName: 'iPad Pro 13-inch (M4)',   branchId: 'BKK-CENTRAL', branchName: 'CentralWorld',  availableQty: 4,  unit: 'pcs' },
  { productId: 'ZS-004', productName: 'iPad Pro 13-inch (M4)',   branchId: 'CNX-MAYA',    branchName: 'Maya Chiang Mai', availableQty: 2, unit: 'pcs' },

  // ZS-005: Apple Watch Series 10
  { productId: 'ZS-005', productName: 'Apple Watch Series 10',   branchId: 'BKK-SIAM',   branchName: 'Siam Paragon',  availableQty: 30, unit: 'pcs' },
  { productId: 'ZS-005', productName: 'Apple Watch Series 10',   branchId: 'BKK-CENTRAL', branchName: 'CentralWorld',  availableQty: 20, unit: 'pcs' },
  { productId: 'ZS-005', productName: 'Apple Watch Series 10',   branchId: 'CNX-MAYA',    branchName: 'Maya Chiang Mai', availableQty: 9, unit: 'pcs' },

  // ZS-006: MacBook Air 15-inch (M3)
  { productId: 'ZS-006', productName: 'MacBook Air 15-inch (M3)', branchId: 'BKK-SIAM',  branchName: 'Siam Paragon',  availableQty: 6,  unit: 'pcs' },
  { productId: 'ZS-006', productName: 'MacBook Air 15-inch (M3)', branchId: 'BKK-CENTRAL', branchName: 'CentralWorld', availableQty: 3,  unit: 'pcs' },
  { productId: 'ZS-006', productName: 'MacBook Air 15-inch (M3)', branchId: 'CNX-MAYA',   branchName: 'Maya Chiang Mai', availableQty: 1, unit: 'pcs' },

  // ZS-007: AirPods Pro 2
  { productId: 'ZS-007', productName: 'AirPods Pro 2 (USB-C)',   branchId: 'BKK-SIAM',   branchName: 'Siam Paragon',  availableQty: 40, unit: 'pcs' },
  { productId: 'ZS-007', productName: 'AirPods Pro 2 (USB-C)',   branchId: 'BKK-CENTRAL', branchName: 'CentralWorld',  availableQty: 35, unit: 'pcs' },
  { productId: 'ZS-007', productName: 'AirPods Pro 2 (USB-C)',   branchId: 'CNX-MAYA',    branchName: 'Maya Chiang Mai', availableQty: 15, unit: 'pcs' },

  // ZS-008: Nintendo Switch 2
  { productId: 'ZS-008', productName: 'Nintendo Switch 2',       branchId: 'BKK-SIAM',   branchName: 'Siam Paragon',  availableQty: 0,  unit: 'pcs' },
  { productId: 'ZS-008', productName: 'Nintendo Switch 2',       branchId: 'BKK-CENTRAL', branchName: 'CentralWorld',  availableQty: 2,  unit: 'pcs' },
  { productId: 'ZS-008', productName: 'Nintendo Switch 2',       branchId: 'CNX-MAYA',    branchName: 'Maya Chiang Mai', availableQty: 0, unit: 'pcs' },
];
