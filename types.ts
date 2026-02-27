
export enum InvoiceStatus {
  DRAFT = 'Brouillon',
  SENT = 'Envoyée',
  PARTIAL = 'Partielle',
  PAID = 'Payée',
  OVERDUE = 'En retard'
}

export enum PaymentMethod {
  CASH = 'Espèces',
  CHECK = 'Chèque',
  TRANSFER = 'Virement'
}

export interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  date: string;
  method: PaymentMethod;
  checkImage?: string; // Base64 string for the mock
  note?: string;
}

export interface Company {
  id: string;
  name: string;
  address: string;
  email: string;
  phone: string;
  siret: string;
  logo?: string;
  city?: string;
  country?: string;
  footer?: string;
  signature?: string;
  app_icon?: string;
  icons?: string;
  remarques?: string;
  invoice_prefix?: string;
  invoice_start_number?: number;
}

export interface Client {
  id: string;
  name: string;
  manager?: string;
  location?: string;
  city?: string;
  region?: string;
  address: string;
  gsm1?: string;
  gsm2?: string;
  phone: string;
  email: string;
  gamme?: string;
  user_email?: string;
  is_blocked: boolean;
  created_at?: string;
  balance: number; // Virtuel pour l'UI
  ice?: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  unit: string;
}

export interface InvoiceItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  tvaRate: number;
  discount: number;
}

export interface Invoice {
  id: string;
  number: string;
  date: string;
  dueDate: string;
  poNumber?: string; // Bon de commande
  clientId: string;
  items: InvoiceItem[];
  status: InvoiceStatus;
  notes?: string;
  subtotal: number;
  tvaTotal: number;
  taxEnabled: boolean; // Nouveau champ pour activer/désactiver la TVA
  discountAmount: number;
  adjustmentAmount: number;
  grandTotal: number;
  payments?: Payment[];
}
export interface User {
  id: string;
  email: string;
}
