
import React, { useState, useEffect } from 'react';
import { Invoice, Client, InvoiceStatus, Payment, PaymentMethod } from '../types';

interface PaymentPageProps {
  invoices: Invoice[];
  clients: Client[];
  onPaymentAdded: (invoiceId: string, payment: Payment) => void;
}

const PaymentPage: React.FC<PaymentPageProps> = ({ invoices, clients, onPaymentAdded }) => {
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  const [amount, setAmount] = useState<number>(0);
  const [method, setMethod] = useState<PaymentMethod>(PaymentMethod.CHECK);
  const [note, setNote] = useState('');

  const pendingInvoices = invoices.filter(inv => {
    const matchesStatus = inv.status !== InvoiceStatus.PAID;
    const matchesSearch = searchTerm.trim() === '' || String(inv.number).toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const pageSizeOptions = [10, 20, 30, 50, 100, 200];

  // Reset pagination when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, itemsPerPage]);

  // Paginated Data
  const totalPages = Math.ceil(pendingInvoices.length / itemsPerPage);
  const paginatedInvoices = pendingInvoices.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getClientName = (id: string) => clients.find(c => c.id === id)?.name || 'Client inconnu';
  const calculatePaid = (invoice: Invoice) => (invoice.payments || []).reduce((s, p) => s + p.amount, 0);
  const calculateRemaining = (invoice: Invoice) => invoice.grandTotal - calculatePaid(invoice);

  const handleOpenPayment = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setAmount(calculateRemaining(invoice));
    setIsModalOpen(true);
  };

  const handleSavePayment = () => {
    if (!selectedInvoice || amount <= 0) return;
    
    const newPayment: Payment = {
      id: crypto.randomUUID(),
      invoiceId: selectedInvoice.id,
      amount,
      date: new Date().toISOString(),
      method,
      note: note || `Versement #${(selectedInvoice.payments?.length || 0) + 1}`
    };

    onPaymentAdded(selectedInvoice.id, newPayment);
    setIsModalOpen(false);
    setNote('');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-white dark:bg-[#27354c] rounded-[20px] shadow-xl border border-slate-200 dark:border-white/5 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-100 dark:border-white/5 bg-slate-50/30 dark:bg-slate-900/40 space-y-4 shrink-0">
          <div className="flex justify-between items-center">
             <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Gestion des Encaissements</h3>
             <div className="flex items-center space-x-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
               <i className="fas fa-info-circle text-indigo-500"></i>
               <span>{pendingInvoices.length} factures en attente</span>
             </div>
          </div>
          <div className="relative max-w-md">
            <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher par n° de facture..."
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white"
            />
          </div>
        </div>

        <div className="overflow-x-auto custom-scrollbar relative">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="sticky top-0 z-20 bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-white/10 shadow-sm">
              <tr>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] w-[15%]">Facture</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] w-[25%]">Client</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] text-right w-[15%]">Total TTC</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] text-right w-[15%]">Déjà Payé</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] text-right w-[15%]">Reste</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] text-center w-[15%]">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {paginatedInvoices.length > 0 ? paginatedInvoices.map((invoice) => {
                const paid = calculatePaid(invoice);
                const remaining = calculateRemaining(invoice);
                return (
                  <tr key={invoice.id} className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-[11px] font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2.5 py-1.5 rounded-lg border border-indigo-100 dark:border-indigo-500/10">
                        {invoice.number}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase truncate max-w-[200px]" title={getClientName(invoice.clientId)}>
                        {getClientName(invoice.clientId)}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-slate-400 dark:text-slate-500 text-xs whitespace-nowrap">
                      {invoice.grandTotal.toLocaleString()} MAD
                    </td>
                    <td className="px-6 py-4 text-right font-black text-emerald-500 text-xs whitespace-nowrap">
                      {paid.toLocaleString()} MAD
                    </td>
                    <td className="px-6 py-4 text-right font-black text-rose-500 text-xs whitespace-nowrap">
                      {remaining.toLocaleString()} MAD
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => handleOpenPayment(invoice)} 
                        className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 shadow-md transition-all active:scale-95 whitespace-nowrap"
                      >
                        Encaisser
                      </button>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={6} className="py-24 text-center text-slate-400 italic text-sm">
                    <div className="flex flex-col items-center justify-center opacity-30">
                      <i className="fas fa-money-check-alt text-5xl mb-4"></i>
                      <p className="text-[10px] font-black uppercase tracking-widest">Aucune facture en attente</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-100 dark:border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-8">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">
              Affichage de <span className="text-slate-800 dark:text-slate-200">
                {pendingInvoices.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}
              </span> à <span className="text-slate-800 dark:text-slate-200">
                {Math.min(currentPage * itemsPerPage, pendingInvoices.length)}
              </span> sur <span className="text-indigo-600 dark:text-indigo-400 font-black">{pendingInvoices.length}</span> documents
            </div>

            <div className="flex items-center space-x-2">
              <label className="text-[9px] font-black uppercase text-slate-400 tracking-tighter whitespace-nowrap">Lignes par page:</label>
              <select 
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg text-[10px] font-black px-2 py-1 outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white cursor-pointer"
              >
                {pageSizeOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="w-10 h-10 rounded-xl flex items-center justify-center border border-slate-200 dark:border-white/10 text-slate-400 disabled:opacity-30 hover:bg-white dark:hover:bg-slate-800 transition-all active:scale-90"
              >
                <i className="fas fa-chevron-left text-[10px]"></i>
              </button>
              
              <div className="flex items-center space-x-1 overflow-x-auto no-scrollbar max-w-[200px] sm:max-w-none">
                {[...Array(totalPages)].map((_, i) => {
                  const page = i + 1;
                  if (
                    page === 1 || 
                    page === totalPages || 
                    (page >= currentPage - 2 && page <= currentPage + 2)
                  ) {
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-10 h-10 rounded-xl text-xs font-black transition-all active:scale-90 shrink-0 ${
                          currentPage === page 
                          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' 
                          : 'text-slate-500 hover:bg-white dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-white/10'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  } else if (page === currentPage - 3 || page === currentPage + 3) {
                    return <span key={page} className="text-slate-300 dark:text-slate-700 text-xs px-1">...</span>;
                  }
                  return null;
                })}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="w-10 h-10 rounded-xl flex items-center justify-center border border-slate-200 dark:border-white/10 text-slate-400 disabled:opacity-30 hover:bg-white dark:hover:bg-slate-800 transition-all active:scale-90"
              >
                <i className="fas fa-chevron-right text-[10px]"></i>
              </button>
            </div>
          )}
        </div>
      </div>

      {isModalOpen && selectedInvoice && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#27354c] w-full max-w-lg rounded-[20px] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-transparent dark:border-white/10">
            <div className="p-6 bg-slate-50 dark:bg-slate-900/40 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
               <h4 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">Nouveau Versement</h4>
               <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-rose-50 hover:text-rose-500 text-slate-400 transition-colors">
                 <i className="fas fa-times"></i>
               </button>
            </div>
            <div className="p-10 space-y-8">
              <div className="bg-indigo-50 dark:bg-indigo-500/10 p-5 rounded-xl border border-indigo-100 dark:border-indigo-500/20 flex justify-between items-center">
                <div>
                   <p className="text-[10px] font-bold uppercase text-indigo-400 mb-1">Facture n°</p>
                   <p className="text-sm font-black text-indigo-900 dark:text-indigo-200">{selectedInvoice.number}</p>
                </div>
                <div className="text-right">
                   <p className="text-[10px] font-bold uppercase text-indigo-400 mb-1">Reste à régler</p>
                   <p className="text-lg font-black text-indigo-900 dark:text-white">{calculateRemaining(selectedInvoice).toLocaleString()} MAD</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Montant à encaisser</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      value={amount} 
                      onChange={(e) => setAmount(parseFloat(e.target.value) || 0)} 
                      className="w-full bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 rounded-xl px-4 py-4 text-xl font-black text-indigo-600 dark:text-indigo-400 outline-none focus:ring-2 focus:ring-indigo-500/20" 
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-400 uppercase tracking-widest">MAD</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Mode de règlement</label>
                  <select 
                    value={method} 
                    onChange={(e) => setMethod(e.target.value as PaymentMethod)} 
                    className="w-full bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 rounded-xl px-4 py-4 text-xs font-black uppercase tracking-widest outline-none text-slate-700 dark:text-white appearance-none cursor-pointer"
                  >
                    <option value={PaymentMethod.CHECK}>Chèque</option>
                    <option value={PaymentMethod.CASH}>Espèces</option>
                    <option value={PaymentMethod.TRANSFER}>Virement</option>
                  </select>
                </div>
              </div>
              {/* // هذا تعليق سطر واحد */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Notes / Référence</label>
                <input 
                  type="text" 
                  placeholder="Ex: Chèque n°123456..." 
                  value={note} 
                  onChange={(e) => setNote(e.target.value)} 
                  className="w-full bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3.5 text-xs font-bold outline-none text-slate-800 dark:text-slate-200" 
                />
              </div>
            </div>
            <div className="p-6 bg-slate-50 dark:bg-slate-900/40 border-t border-slate-100 dark:border-white/5 flex gap-4">
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="flex-1 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-slate-600 transition-colors"
              >
                Fermer
              </button>
              <button 
                onClick={handleSavePayment} 
                className="flex-[2] bg-indigo-600 text-white px-8 py-4 rounded-xl text-[11px] font-black uppercase tracking-[0.2em] hover:bg-indigo-700 shadow-xl shadow-indigo-600/20 transition-all active:scale-95"
              >
                Valider l'encaissement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentPage;
