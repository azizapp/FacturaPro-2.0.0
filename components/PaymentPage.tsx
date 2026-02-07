
import React, { useState } from 'react';
import { Invoice, Client, InvoiceStatus, Payment, PaymentMethod } from '../types';

interface PaymentPageProps {
  invoices: Invoice[];
  clients: Client[];
  onPaymentAdded: (invoiceId: string, payment: Payment) => void;
}

const PaymentPage: React.FC<PaymentPageProps> = ({ invoices, clients, onPaymentAdded }) => {
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedInvoiceId, setExpandedInvoiceId] = useState<string | null>(null);
  
  const [amount, setAmount] = useState<number>(0);
  const [method, setMethod] = useState<PaymentMethod>(PaymentMethod.CHECK);
  const [note, setNote] = useState('');

  const pendingInvoices = invoices.filter(inv => inv.status !== InvoiceStatus.PAID);
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
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-white dark:bg-[#27354c] rounded-3xl shadow-sm border border-slate-200 dark:border-white/5 overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-white/5 bg-slate-50/30 dark:bg-slate-900/40">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white uppercase tracking-tight">Gestion des Encaissements</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-900/20">
              <tr className="bg-slate-50/50 dark:bg-transparent">
                <th className="px-6 py-4 text-[10px] font-bold uppercase text-slate-400">Facture</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase text-slate-400 text-right">Total TTC</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase text-slate-400 text-right">Payé</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase text-slate-400 text-right">Reste</th>
                <th className="px-6 py-4 text-center text-[10px] font-bold uppercase text-slate-400">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-white/5">
              {pendingInvoices.map((invoice) => {
                const paid = calculatePaid(invoice);
                const remaining = calculateRemaining(invoice);
                return (
                  <tr key={invoice.id} className="hover:bg-slate-50/30 dark:hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 font-bold text-indigo-600 dark:text-indigo-400">{invoice.number}</td>
                    <td className="px-6 py-4 text-right font-medium text-slate-400 dark:text-slate-500">{invoice.grandTotal.toLocaleString()} MAD</td>
                    <td className="px-6 py-4 text-right font-bold text-emerald-500">{paid.toLocaleString()} MAD</td>
                    <td className="px-6 py-4 text-right font-bold text-rose-500">{remaining.toLocaleString()} MAD</td>
                    <td className="px-6 py-4 text-center">
                      <button onClick={() => handleOpenPayment(invoice)} className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-[10px] font-bold uppercase hover:bg-indigo-700 shadow-md">Encaisser</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#27354c] w-full max-w-lg rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-transparent dark:border-white/10">
            <div className="p-6 bg-slate-50 dark:bg-slate-900/40 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
               <h4 className="text-lg font-bold text-slate-800 dark:text-white uppercase tracking-tight">Nouveau Versement</h4>
               <button onClick={() => setIsModalOpen(false)} className="text-slate-300 hover:text-rose-500"><i className="fas fa-times"></i></button>
            </div>
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase text-slate-400">Montant</label>
                  <input type="number" value={amount} onChange={(e) => setAmount(parseFloat(e.target.value))} className="w-full bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 rounded-xl px-4 py-3 text-lg font-bold text-indigo-600 dark:text-indigo-400 outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase text-slate-400">Mode</label>
                  <select value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)} className="w-full bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 rounded-xl px-4 py-3 text-sm font-bold outline-none text-slate-700 dark:text-white">
                    <option value={PaymentMethod.CHECK}>Chèque</option>
                    <option value={PaymentMethod.CASH}>Espèces</option>
                    <option value={PaymentMethod.TRANSFER}>Virement</option>
                  </select>
                </div>
              </div>
              <input type="text" placeholder="Note (Ex: Chèque n°...)" value={note} onChange={(e) => setNote(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 rounded-xl px-4 py-3 text-sm outline-none text-slate-800 dark:text-slate-200" />
            </div>
            <div className="p-6 bg-slate-50 dark:bg-slate-900/40 border-t border-slate-100 dark:border-white/5 flex gap-3">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 py-3 text-xs font-bold text-slate-500 uppercase">Fermer</button>
              <button onClick={handleSavePayment} className="flex-2 bg-indigo-600 text-white px-8 py-3 rounded-xl text-xs font-bold uppercase hover:bg-indigo-700 shadow-xl">Valider</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentPage;
