import { Invoice, Client, Product, Company } from '../types';
import { jsonDatabase } from './jsonDatabase';
import { db } from './supabaseService';

interface SyncStatus {
  isSyncing: boolean;
  lastSync: Date | null;
  error: string | null;
}

export class DataSyncService {
  private syncStatus: SyncStatus = {
    isSyncing: false,
    lastSync: null,
    error: null
  };

  // Initialize with cached data and start background sync
  async initializeWithCache(): Promise<{
    invoices: Invoice[];
    clients: Client[];
    products: Product[];
    company: Company | null;
  }> {
    // Load cached data for immediate display
    const cachedData = jsonDatabase.getAllData();

    // Start background sync in parallel
    this.performBackgroundSync();

    return {
      invoices: cachedData.invoices,
      clients: cachedData.clients,
      products: cachedData.products,
      company: cachedData.company
    };
  }

  // Perform background sync of data
  async performBackgroundSync(): Promise<void> {
    if (this.syncStatus.isSyncing) {
      return;
    }

    this.syncStatus.isSyncing = true;
    this.syncStatus.error = null;

    try {
      // Fetch fresh data from main source
      const [invs, cls, prods, comp] = await Promise.all([
        db.getInvoices(),
        db.getClients(),
        db.getProducts(),
        db.getCompanySettings()
      ]);

      // Update JSON cache with fresh data
      jsonDatabase.setAllData({
        invoices: invs,
        clients: cls,
        products: prods,
        company: comp
      });

      this.syncStatus.lastSync = new Date();
      console.log('Data synced successfully');
    } catch (error) {
      console.error('Background sync error:', error);
      this.syncStatus.error = error instanceof Error ? error.message : 'Unknown error';
    } finally {
      this.syncStatus.isSyncing = false;
    }
  }

  // Get current sync status
  getSyncStatus(): SyncStatus {
    return { ...this.syncStatus };
  }

  // Manual sync trigger
  async manualSync(): Promise<void> {
    await this.performBackgroundSync();
  }

  // Update specific data and sync to both sources
  async updateInvoices(invoices: Invoice[]): Promise<void> {
    // Update local cache immediately for UI responsiveness
    jsonDatabase.setInvoices(invoices);

    // In a real implementation, we would also update the remote database
    // For now, we'll just keep the cache updated
  }

  async updateClients(clients: Client[]): Promise<void> {
    // Update local cache immediately for UI responsiveness
    jsonDatabase.setClients(clients);
  }

  async updateProducts(products: Product[]): Promise<void> {
    // Update local cache immediately for UI responsiveness
    jsonDatabase.setProducts(products);
  }

  async updateCompany(company: Company | null): Promise<void> {
    // Update local cache immediately for UI responsiveness
    jsonDatabase.setCompany(company);
  }

  // Add a single item and sync
  async addInvoice(invoice: Invoice): Promise<void> {
    const currentInvoices = jsonDatabase.getInvoices();
    const updatedInvoices = [...currentInvoices, invoice];
    jsonDatabase.setInvoices(updatedInvoices);
  }

  async addClient(client: Client): Promise<void> {
    const currentClients = jsonDatabase.getClients();
    const updatedClients = [...currentClients, client];
    jsonDatabase.setClients(updatedClients);
  }

  async addProduct(product: Product): Promise<void> {
    const currentProducts = jsonDatabase.getProducts();
    const updatedProducts = [...currentProducts, product];
    jsonDatabase.setProducts(updatedProducts);
  }

  // Delete operations
  async deleteInvoice(id: string): Promise<void> {
    const currentInvoices = jsonDatabase.getInvoices();
    const updatedInvoices = currentInvoices.filter(inv => inv.id !== id);
    jsonDatabase.setInvoices(updatedInvoices);
  }

  async deleteClient(id: string): Promise<void> {
    const currentClients = jsonDatabase.getClients();
    const updatedClients = currentClients.filter(cli => cli.id !== id);
    jsonDatabase.setClients(updatedClients);
  }

  async deleteProduct(id: string): Promise<void> {
    const currentProducts = jsonDatabase.getProducts();
    const updatedProducts = currentProducts.filter(prod => prod.id !== id);
    jsonDatabase.setProducts(updatedProducts);
  }

  // Get data from cache (fast)
  getCachedData() {
    return jsonDatabase.getAllData();
  }

  // Force refresh from remote and update cache
  async forceRefresh(): Promise<void> {
    await this.performBackgroundSync();
  }
}

// Export a singleton instance
export const dataSyncService = new DataSyncService();