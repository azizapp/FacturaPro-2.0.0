
import Dexie, { Table } from 'dexie';
import { Invoice, Client, Product, Company } from '../types';

export interface AppSettings {
  id: string;
  aiApiKey?: string;
}

export class FacturaProDB extends Dexie {
  invoices!: Table<Invoice>;
  clients!: Table<Client>;
  products!: Table<Product>;
  company!: Table<Company>;
  settings!: Table<AppSettings>;

  constructor() {
    super('FacturaProDB');
    this.version(1).stores({
      invoices: 'id, number, clientId, date',
      clients: 'id, name, email',
      products: 'id, name',
      company: 'id',
      settings: 'id'
    });
  }
}

export const localDb = new FacturaProDB();
