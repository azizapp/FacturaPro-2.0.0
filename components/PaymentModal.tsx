
import React, { useState } from 'react';
import { Invoice, Payment, PaymentMethod } from '../types';

interface PaymentModalProps {
  invoice: Invoice;
  onClose: () => void;
  onPaymentAdded: (invoiceId: string, payment: Payment) => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ invoice, onClose, onPaymentAdded }) => {
  const calculatePaid = (inv: Invoice) => (inv.payments || []).reduce((s, p) => s + p.amount, 0);
  const remaining = invoice.grandTotal - calculatePaid(invoice);

  const [amount, setAmount] = useState<number>(remaining);
  const [method, setMethod] = useState<PaymentMethod>(PaymentMethod.CHECK);
  const [note, setNote] = useState('');

  const handleSave = () => {
    if (amount <= 0 || amount > remaining) return alert("Montant invalide");

    const newPayment: Payment = {
      id: crypto.randomUUID(),
      invoiceId: invoice.id,
      amount,
      date: new Date().toISOString(),
      method,
      note: note || `Règlement - ${method}`
    };

    onPaymentAdded(invoice.id, newPayment);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-[#1b263b] w-full max-w-lg rounded-[15px] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-transparent dark:border-white/5">
        <div className="p-6 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-white/10 flex items-center justify-between">
          <h4 className="text-lg font-bold text-slate-800 dark:text-white uppercase tracking-tight">Encaissement Rapide</h4>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-slate-200 dark:hover:bg-white/10 text-slate-400 dark:text-slate-500 transition-colors"><i className="fas fa-times"></i></button>
        </div>

        <div className="p-8 space-y-6">
          <div className="bg-indigo-50 dark:bg-indigo-500/10 p-4 rounded-xl border border-indigo-100 dark:border-indigo-500/20">
            <p className="text-xs text-indigo-800 dark:text-indigo-300">Facture: <span className="font-bold text-indigo-900 dark:text-indigo-200">{invoice.number}</span></p>
            <p className="text-xs text-indigo-800 dark:text-indigo-300">Reste à payer: <span className="font-black text-indigo-900 dark:text-white">{remaining.toLocaleString()} MAD</span></p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500">Montant</label>
              <input type="number" value={amount} onChange={(e) => setAmount(parseFloat(e.target.value) || 0)} className="w-full bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-white/10 rounded-[8px] px-4 py-3 text-lg font-bold text-indigo-600 dark:text-indigo-400 outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500">Mode</label>
              <select value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)} className="w-full bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-white/10 rounded-[8px] px-4 py-3 text-sm font-bold outline-none dark:text-slate-200 focus:ring-2 focus:ring-indigo-500/20 transition-all">
                <option value={PaymentMethod.CHECK}>Chèque</option>
                <option value={PaymentMethod.CASH}>Espèces</option>
                <option value={PaymentMethod.TRANSFER}>Virement</option>
              </select>
            </div>
          </div>
          <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note (optionnel)" className="w-full bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-white/10 rounded-[8px] px-4 py-3 text-sm outline-none dark:text-slate-200 focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600" />
        </div>

        <div className="p-6 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-white/10 flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase hover:text-slate-600 dark:hover:text-slate-300 transition-colors">Annuler</button>
          <button onClick={handleSave} className="flex-[2] bg-indigo-600 text-white px-8 py-3 rounded-[8px] text-[10px] font-black uppercase shadow-xl hover:bg-indigo-500 transition-all transform hover:scale-[1.02]">Confirmer</button>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
