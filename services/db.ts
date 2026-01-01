import Dexie, { Table } from 'dexie';
import { ICustomer, IProduct } from '../types';

class PharmaDatabase extends Dexie {
  customers!: Table<ICustomer>;
  products!: Table<IProduct>;

  constructor() {
    super('GopiPharmaDB_v2');
    (this as any).version(1).stores({
      customers: '++id, name, type, gstin, mobile, [name+gstin], [name+mobile]',
      products: '++id, name, batch, manufacturer'
    });
  }
}

export const db = new PharmaDatabase();

// Seed function for demo purposes
export const seedDatabase = async () => {
  const count = await db.customers.count();
  if (count === 0) {
    const customers: ICustomer[] = [];
    // Seed Wholesale
    for (let i = 1; i <= 20; i++) {
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
    for (let i = 1; i <= 30; i++) {
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
    
    // Seed Products
    const products: IProduct[] = Array.from({ length: 50 }).map((_, i) => ({
      name: `Medicine ${String.fromCharCode(65 + (i % 26))}-${i}`,
      batch: `B${202400 + i}`,
      expiry: '12/2026',
      mrp: 100 + (i * 5),
      rate: 80 + (i * 4),
      stock: 1000,
      manufacturer: `Pharma Corp ${i % 5}`
    }));
    await db.products.bulkAdd(products);
  }
};