
import React, { useState, useRef, useEffect } from 'react';
import { Client, Product, Invoice, InvoiceItem, InvoiceStatus, Company } from '../types';

interface InvoiceFormProps {
  clients: Client[];
  products: Product[];
  company: Company;
  invoices: Invoice[];
  onSubmit: (invoice: Invoice) => void;
  onCancel: () => void;
  initialInvoice?: Invoice;
}

const InvoiceForm: React.FC<InvoiceFormProps> = ({ clients, products, company, invoices, onSubmit, onCancel, initialInvoice }) => {
  const [clientId, setClientId] = useState(initialInvoice?.clientId || '');
  const [clientSearch, setClientSearch] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [invoiceDate, setInvoiceDate] = useState(initialInvoice?.date || new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(initialInvoice?.dueDate || '');
  const [poNumber, setPoNumber] = useState(initialInvoice?.poNumber || '');
  const [taxEnabled, setTaxEnabled] = useState<boolean>(initialInvoice?.taxEnabled ?? true);
  const [discountAmount, setDiscountAmount] = useState<number>(initialInvoice?.discountAmount || 0);
  const [adjustmentAmount, setAdjustmentAmount] = useState<number>(initialInvoice?.adjustmentAmount || 0);
  const [notes, setNotes] = useState(initialInvoice?.notes || company.remarques || '');
  const [items, setItems] = useState<Partial<InvoiceItem>[]>(
    initialInvoice?.items || [{ id: crypto.randomUUID(), quantity: 1, price: 0, tvaRate: 20, discount: 0 }]
  );

  const getNextInvoiceNumber = () => {
    const prefix = company.invoice_prefix || 'FAC-';
    const startNum = company.invoice_start_number || 1;
    
    // تصفية الفواتير التي تبدأ بنفس البادئة لاستخراج أعلى رقم
    const relevantInvoices = invoices.filter(inv => inv.number.startsWith(prefix));
    
    if (relevantInvoices.length === 0) {
      return `${prefix}${startNum.toString().padStart(4, '0')}`;
    }

    const numbers = relevantInvoices
      .map(inv => {
        const numPart = inv.number.substring(prefix.length);
        return parseInt(numPart, 10);
      })
      .filter(n => !isNaN(n));

    const maxNum = numbers.length > 0 ? Math.max(...numbers, startNum - 1) : startNum - 1;
    return `${prefix}${(maxNum + 1).toString().padStart(4, '0')}`;
  };

  // تحويل رقم الفاتورة إلى State للسماح بالتعديل في حالة وجود Conflict
  const [invoiceNumber, setInvoiceNumber] = useState(initialInvoice?.number || getNextInvoiceNumber());

  // تحديث الرقم التلقائي إذا تغيرت قائمة الفواتير (مثلاً بعد مزامنة ناجحة)
  useEffect(() => {
    if (!initialInvoice && invoices.length > 0) {
      setInvoiceNumber(getNextInvoiceNumber());
    }
  }, [invoices.length]);

  const subtotal = items.reduce((acc, item) => acc + ((item.price || 0) * (item.quantity || 0) * (1 - (item.discount || 0) / 100)), 0);
  const tvaTotal = taxEnabled 
    ? items.reduce((acc, item) => acc + ((item.price || 0) * (item.quantity || 0) * (1 - (item.discount || 0) / 100) * (item.tvaRate || 0) / 100), 0)
    : 0;

  const grandTotal = Math.max(0, subtotal + tvaTotal - discountAmount - adjustmentAmount);

  const handleAddItem = () => setItems([...items, { id: crypto.randomUUID(), quantity: 1, price: 0, tvaRate: 20, discount: 0 }]);
  const handleRemoveItem = (id: string) => items.length > 1 && setItems(items.filter(item => item.id !== id));

  const handleItemChange = (id: string, field: keyof InvoiceItem, value: any) => {
    setItems(items.map(item => {
      if (item.id === id) {
        let newItem = { ...item, [field]: value };
        if (field === 'productId') {
          const product = products.find(p => p.id === value);
          if (product) { newItem.productName = product.name; newItem.price = product.price; }
        }
        return newItem;
      }
      return item;
    }));
  };

  const selectedClient = clients.find(c => c.id === clientId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) return alert('Sélectionnez un client.');
    if (!invoiceNumber) return alert('Le numéro de facture est requis.');

    const invoice: Invoice = {
      ...initialInvoice,
      id: initialInvoice?.id || crypto.randomUUID(),
      number: invoiceNumber, 
      date: invoiceDate, 
      dueDate: dueDate || invoiceDate,
      poNumber, 
      clientId, 
      items: items as InvoiceItem[],
      status: initialInvoice?.status || InvoiceStatus.DRAFT,
      notes, 
      subtotal, 
      tvaTotal, 
      taxEnabled, 
      discountAmount, 
      adjustmentAmount, 
      grandTotal,
      payments: initialInvoice?.payments || []
    };
    onSubmit(invoice);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="bg-white dark:bg-[#27354c] p-8 rounded-[15px] shadow-sm border border-slate-200 dark:border-white/5">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white uppercase tracking-tight mb-8">Détails de la Facture</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-12">
          <div className="md:col-span-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">N° Facture</label>
            <input 
              type="text" 
              value={invoiceNumber} 
              onChange={(e) => setInvoiceNumber(e.target.value)} 
              className="w-full bg-slate-50 dark:bg-slate-900/40 border border-indigo-200 dark:border-indigo-500/30 rounded-[8px] px-4 py-3 text-xs font-black text-indigo-600 dark:text-indigo-400 outline-none focus:ring-2 focus:ring-indigo-500/20" 
              placeholder="Ex: FAC-0001"
            />
          </div>
          
          <div className="relative md:col-span-1" ref={dropdownRef}>
            <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">Client</label>
            <div onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="w-full bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 rounded-[8px] px-4 py-3 cursor-pointer text-xs font-bold dark:text-white truncate">
              {selectedClient ? selectedClient.name : 'Chercher...'}
            </div>
            {isDropdownOpen && (
              <div className="absolute z-50 mt-2 w-64 bg-white dark:bg-slate-800 rounded-[15px] shadow-2xl border border-slate-100 dark:border-white/10 overflow-hidden">
                <div className="p-3 bg-slate-50 dark:bg-slate-900/50"><input type="text" value={clientSearch} onChange={(e) => setClientSearch(e.target.value)} className="w-full px-3 py-2 border rounded-[8px] text-xs outline-none dark:bg-slate-800 dark:text-white dark:border-white/5" /></div>
                <div className="max-h-60 overflow-y-auto">
                  {clients.filter(c => c.name.toLowerCase().includes(clientSearch.toLowerCase())).map(c => (
                    <div key={c.id} onClick={() => { setClientId(c.id); setIsDropdownOpen(false); }} className="px-4 py-3 text-xs hover:bg-indigo-50 dark:hover:bg-indigo-500/10 cursor-pointer dark:text-slate-200">{c.name}</div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div><label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">Date</label><input type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 rounded-[8px] px-4 py-3 text-xs font-bold dark:text-white" /></div>
          <div><label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">Échéance</label><input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 rounded-[8px] px-4 py-3 text-xs font-bold dark:text-white" /></div>
          <div><label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">BC</label><input type="text" value={poNumber} onChange={(e) => setPoNumber(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 rounded-[8px] px-4 py-3 text-xs font-bold dark:text-white" placeholder="N° Commande" /></div>
        </div>

        <div className="space-y-4 mb-12">
          {items.map((item) => (
            <div key={item.id} className="grid grid-cols-12 gap-4 items-center p-4 bg-slate-50 dark:bg-slate-900/40 rounded-[15px] border border-slate-100 dark:border-white/5">
              <div className="col-span-4"><select value={item.productId || ''} onChange={(e) => handleItemChange(item.id!, 'productId', e.target.value)} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/5 rounded-[8px] px-3 py-2 text-xs font-bold dark:text-white"><option value="">Produit...</option>{products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
              <div className="col-span-2"><input type="number" value={item.quantity} onChange={(e) => handleItemChange(item.id!, 'quantity', parseFloat(e.target.value))} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/5 rounded-[8px] px-3 py-2 text-xs text-center font-bold dark:text-white" /></div>
              <div className="col-span-2"><input type="number" value={item.price} onChange={(e) => handleItemChange(item.id!, 'price', parseFloat(e.target.value))} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/5 rounded-[8px] px-3 py-2 text-xs text-right font-bold dark:text-white" /></div>
              <div className="col-span-3 text-right font-bold text-xs dark:text-slate-200">{((item.price || 0) * (item.quantity || 0)).toLocaleString()} MAD</div>
              <div className="col-span-1 text-center"><button type="button" onClick={() => handleRemoveItem(item.id!)} className="text-rose-400"><i className="fas fa-trash-alt"></i></button></div>
            </div>
          ))}
          <button type="button" onClick={handleAddItem} className="w-full py-4 border-2 border-dashed border-slate-100 dark:border-white/10 rounded-[15px] text-slate-400 text-[10px] font-black uppercase">Ajouter une ligne</button>
        </div>

        <div className="flex flex-col md:flex-row justify-between gap-12">
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="flex-1 bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 rounded-[15px] p-5 text-xs min-h-[140px] dark:text-slate-200" placeholder="Notes..."></textarea>
          <div className="w-full md:w-[350px] p-8 bg-slate-50 dark:bg-slate-900/40 rounded-[15px] space-y-4 shadow-inner border border-slate-100 dark:border-white/5">
             <div className="flex items-center justify-between pb-4 border-b border-slate-200/50 dark:border-white/5">
               <span className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-widest">Activer la TVA (20%)</span>
               <button 
                type="button"
                onClick={() => setTaxEnabled(!taxEnabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${taxEnabled ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'}`}
               >
                 <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${taxEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
               </button>
             </div>

             <div className="flex justify-between text-xs font-bold text-slate-400">
               <span>Sous-total HT</span>
               <span>{subtotal.toLocaleString()} MAD</span>
             </div>
             
             <div className={`flex justify-between text-xs font-bold transition-opacity ${taxEnabled ? 'text-slate-400' : 'text-slate-300 line-through opacity-50'}`}>
               <span>Total TVA</span>
               <span>{tvaTotal.toLocaleString()} MAD</span>
             </div>
             
             <div className="space-y-2 pt-2 border-t border-slate-200/50 dark:border-white/5">
               <div className="flex items-center justify-between gap-4">
                 <label className="text-[10px] font-bold text-rose-400 uppercase shrink-0">Remise (Déd.)</label>
                 <input 
                   type="number" 
                   value={discountAmount} 
                   onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)} 
                   className="w-24 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/5 rounded-[6px] px-2 py-1 text-xs text-right font-bold text-rose-500 outline-none"
                 />
               </div>
               <div className="flex items-center justify-between gap-4">
                 <label className="text-[10px] font-bold text-slate-400 uppercase shrink-0">Ajustement</label>
                 <input 
                   type="number" 
                   value={adjustmentAmount} 
                   onChange={(e) => setAdjustmentAmount(parseFloat(e.target.value) || 0)} 
                   className="w-24 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/5 rounded-[6px] px-2 py-1 text-xs text-right font-bold text-slate-700 dark:text-slate-200 outline-none"
                 />
               </div>
             </div>

             <div className="flex justify-between text-lg font-black pt-4 border-t border-slate-200 dark:border-white/5 text-indigo-600 dark:text-indigo-400">
               <span>TOTAL TTC</span>
               <span>{grandTotal.toLocaleString()} MAD</span>
             </div>
          </div>
        </div>
      </div>
      <div className="flex justify-end space-x-4">
        <button type="button" onClick={onCancel} className="px-8 py-4 text-[10px] font-bold uppercase text-slate-400">Annuler</button>
        <button type="submit" className="px-12 py-4 bg-indigo-600 text-white rounded-[12px] text-[10px] font-black uppercase shadow-xl">Enregistrer</button>
      </div>
    </form>
  );
};

export default InvoiceForm;
