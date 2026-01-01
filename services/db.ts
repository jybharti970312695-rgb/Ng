
import Dexie, { Table } from 'dexie';
import { ICustomer, IProduct, IInvoice } from '../types';

class PharmaDatabase extends Dexie {
  customers!: Table<ICustomer>;
  products!: Table<IProduct>;
  invoices!: Table<IInvoice>;

  constructor() {
    super('GopiPharmaDB_v3');
    (this as any).version(1).stores({
      customers: '++id, name, type, gstin, mobile, [name+gstin], [name+mobile]',
      products: '++id, name, batch, manufacturer, hsn, schedule, expiry',
      invoices: '++id, customerId, date'
    });
  }
}

export const db = new PharmaDatabase();

// Seed function for demo purposes
export const seedDatabase = async () => {
  const count = await db.products.count();
  if (count === 0) {
    const customers: ICustomer[] = [];
    // Seed Wholesale
    for (let i = 1; i <= 5; i++) {
      customers.push({
        name: `Wholesale Dist ${i}`,
        type: 'wholesale',
        gstin: `27AAAAA${1000 + i}A1Z5`,
        mobile: `98000${10000 + i}`,
        stateCode: '27',
        address: `Sector ${i}, Industrial Area`,
        searchIndex: [`wholesale dist ${i}`, `27aaaaa${1000 + i}a1z5`]
      });
    }
    // Seed Retail
    for (let i = 1; i <= 5; i++) {
      customers.push({
        name: `Retail Chemist ${i}`,
        type: 'retail',
        mobile: `99000${20000 + i}`,
        stateCode: '27',
        address: `Main Market, Shop ${i}`,
        searchIndex: [`retail chemist ${i}`]
      });
    }
    await db.customers.bulkAdd(customers);
    
    // Seed Products with Compliance Data
    const products: IProduct[] = [
      {
        name: 'Dolo 650',
        batch: 'B202401',
        expiry: '2025-12-31',
        mrp: 30,
        rate: 22.5,
        ptr: 22.5,
        pts: 20.25,
        stock: 500,
        manufacturer: 'Micro Labs',
        hsn: '3004',
        gstPercent: 12,
        schedule: 'General'
      },
      {
        name: 'Augmentin 625',
        batch: 'AUG-001',
        expiry: '2024-10-15',
        mrp: 200,
        rate: 160,
        ptr: 160,
        pts: 144,
        stock: 100,
        manufacturer: 'GSK',
        hsn: '3004',
        gstPercent: 12,
        schedule: 'H1' // Requires Doctor details
      },
      {
        name: 'Corex Syrup',
        batch: 'CX-99',
        expiry: '2024-06-30', // Near expiry (FEFO test)
        mrp: 120,
        rate: 95,
        ptr: 95,
        pts: 85.5,
        stock: 50,
        manufacturer: 'Pfizer',
        hsn: '3004',
        gstPercent: 12,
        schedule: 'H'
      },
      {
        name: 'Shelcal 500',
        batch: 'SH-22',
        expiry: '2026-01-01',
        mrp: 110,
        rate: 80,
        ptr: 80,
        pts: 72,
        stock: 300,
        manufacturer: 'Torrent',
        hsn: '3004',
        gstPercent: 12,
        schedule: 'General'
      },
      {
        name: 'Azithral 500',
        batch: 'AZ-55',
        expiry: '2025-05-20',
        mrp: 70,
        rate: 55,
        ptr: 55,
        pts: 49.5,
        stock: 200,
        manufacturer: 'Alembic',
        hsn: '3004',
        gstPercent: 12,
        schedule: 'H1'
      }
    ];
    await db.products.bulkAdd(products);
  }
};
