
import React, { useState } from 'react';
import { Invoice, Client, Company, InvoiceStatus } from '../types';
import { generateFollowUpEmail } from '../services/geminiService';

interface InvoiceDetailViewProps {
  invoice: Invoice;
  client: Client;
  company: Company;
  onBack: () => void;
  onAddPayment: (id: string) => void;
  onPdf: (id: string) => void;
  onDelete: (id: string) => void;
}

const InvoiceDetailView: React.FC<InvoiceDetailViewProps> = ({
  invoice,
  client,
  company,
  onBack,
  onAddPayment,
  onPdf,
  onDelete
}) => {
  const [isGeneratingEmail, setIsGeneratingEmail] = useState(false);

  const getStatusStyle = (status: InvoiceStatus) => {
    switch (status) {
      case InvoiceStatus.PAID:
        return 'bg-emerald-600 text-white border-emerald-700 shadow-sm shadow-emerald-200';
      case InvoiceStatus.PARTIAL:
        return 'bg-orange-500 text-white border-orange-600 shadow-sm shadow-orange-200';
      case InvoiceStatus.SENT:
        return 'bg-blue-500 text-white border-blue-600 shadow-sm shadow-blue-200';
      case InvoiceStatus.OVERDUE:
        return 'bg-rose-700 text-white border-rose-800 shadow-sm shadow-rose-200';
      case InvoiceStatus.DRAFT:
        return 'bg-rose-600 text-white border-rose-700 shadow-sm shadow-rose-200';
      default:
        return 'bg-slate-500 text-white border-slate-600';
    }
  };

  const calculateTotalPaid = (inv: Invoice) => (inv.payments || []).reduce((s, p) => s + p.amount, 0);
  const remaining = Math.max(0, invoice.grandTotal - calculateTotalPaid(invoice));

  const handleSendEmail = async () => {
    setIsGeneratingEmail(true);
    try {
      const emailBody = await generateFollowUpEmail(invoice, client);
      const subject = encodeURIComponent(`Facture ${invoice.number} - ${company.name}`);
      const body = encodeURIComponent(emailBody);
      window.location.href = `mailto:${client.email}?subject=${subject}&body=${body}`;
    } catch (error) {
      alert("Erreur lors de la génération de l'email via l'IA.");
    } finally {
      setIsGeneratingEmail(false);
    }
  };

  const handleWhatsApp = () => {
    if (!client.phone && !client.gsm1) {
      alert("Le numéro de téléphone du client est manquant.");
      return;
    }

    const message = encodeURIComponent(
      `*FACTURE : ${invoice.number}*\n` +
      `Bonjour *${client.name}*,\n\n` +
      `Veuillez trouver ci-dessous le récapitulatif de votre facture du ${new Date(invoice.date).toLocaleDateString('fr-FR')} :\n\n` +
      `• *Montant Total :* ${invoice.grandTotal.toLocaleString()} MAD\n` +
      `• *Déjà réglé :* ${calculateTotalPaid(invoice).toLocaleString()} MAD\n` +
      `• *Solde restant :* ${remaining.toLocaleString()} MAD\n\n` +
      `Vous pouvez télécharger votre facture PDF sur notre portail.\n\n` +
      `Cordialement,\n*${company.name}*`
    );

    const phone = (client.gsm1 || client.phone || "").replace(/\s+/g, '');
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-white dark:bg-[#1b263b] border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-200 dark:hover:border-indigo-500/30 transition-all shadow-sm"
          >
            <i className="fas fa-arrow-left"></i>
          </button>
          <div>
            <h3 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight flex items-center space-x-3">
              <span>{invoice.number}</span>
              <span className={`text-[10px] font-black uppercase px-4 py-1.5 rounded-xl border-b-2 ${getStatusStyle(invoice.status)}`}>
                {invoice.status}
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium italic mt-1">Émise le {new Date(invoice.date).toLocaleDateString('fr-FR')}</p>
          </div>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => onPdf(invoice.id)}
            className="px-5 py-2.5 bg-white dark:bg-[#1b263b] border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold uppercase text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm flex items-center space-x-2"
          >
            <i className="fas fa-print"></i>
            <span>Imprimer</span>
          </button>
          <button
            onClick={() => onPdf(invoice.id)}
            className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold uppercase hover:bg-indigo-700 shadow-xl shadow-indigo-600/20 flex items-center space-x-2 transition-all"
          >
            <i className="fas fa-file-pdf"></i>
            <span>Télécharger PDF</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white dark:bg-[#1b263b] rounded-[15px] p-10 shadow-sm border border-slate-200 dark:border-white/10">
            <div className="grid grid-cols-2 gap-12 mb-12">
              <div className="space-y-4">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">De</h4>
                <div className="space-y-1">
                  <p className="font-black text-slate-800 dark:text-white uppercase">{company.name}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{company.address}{company.city ? `, ${company.city}` : ''}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">SIRET: {company.siret}</p>
                </div>
              </div>
              <div className="space-y-4">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Facturé à</h4>
                <div className="space-y-1">
                  <p className="font-black text-indigo-600 dark:text-indigo-400 uppercase">{client.name}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{client.address}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{client.city}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{client.email}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-12 p-6 bg-slate-50 dark:bg-slate-900/40 rounded-[15px] border border-slate-100 dark:border-white/5">
              <div>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Date Facture</p>
                <p className="text-sm font-black text-slate-700 dark:text-slate-200">{new Date(invoice.date).toLocaleDateString('fr-FR')}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Date Échéance</p>
                <p className="text-sm font-black text-rose-500">{new Date(invoice.dueDate).toLocaleDateString('fr-FR')}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">N° Bon de Commande</p>
                <p className="text-sm font-black text-indigo-600 dark:text-indigo-400">{invoice.poNumber || '-'}</p>
              </div>
            </div>

            <table className="w-full mb-10">
              <thead>
                <tr className="border-b border-slate-100 dark:border-white/10">
                  <th className="py-4 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Article</th>
                  <th className="py-4 text-center text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 w-24">Qté</th>
                  <th className="py-4 text-right text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 w-32">P.U HT</th>
                  <th className="py-4 text-right text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 w-32">
                    {invoice.taxEnabled ? 'Total TTC' : 'Total'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                {invoice.items.map((item, idx) => {
                  const itemSubtotal = item.price * item.quantity;
                  const itemTtc = invoice.taxEnabled ? itemSubtotal * (1 + item.tvaRate / 100) : itemSubtotal;
                  return (
                    <tr key={idx}>
                      <td className="py-5">
                        <p className="font-bold text-slate-800 dark:text-white text-sm">{item.productName}</p>
                      </td>
                      <td className="py-5 text-center font-bold text-slate-700 dark:text-slate-300">{item.quantity}</td>
                      <td className="py-5 text-right font-medium text-slate-500 dark:text-slate-400">{item.price.toLocaleString()} MAD</td>
                      <td className="py-5 text-right font-bold text-slate-800 dark:text-white">
                        {itemTtc.toLocaleString()} MAD
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="flex flex-col md:flex-row justify-between border-t border-slate-100 dark:border-white/10 pt-8 gap-8">
              <div className="max-w-sm">
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Conditions / Notes</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed italic">{invoice.notes || "Aucune condition particulière mentionnée."}</p>
              </div>
              <div className="w-72 space-y-3">
                <div className="flex justify-between text-sm text-slate-500 dark:text-slate-400">
                  <span className="font-medium">Sous-total</span>
                  <span>{invoice.subtotal.toLocaleString()} MAD</span>
                </div>

                {invoice.taxEnabled && (
                  <div className="flex justify-between text-sm text-slate-500 dark:text-slate-400">
                    <span className="font-medium">Total TVA</span>
                    <span>{invoice.tvaTotal.toLocaleString()} MAD</span>
                  </div>
                )}

                {invoice.discountAmount > 0 && (
                  <div className="flex justify-between text-sm text-rose-500 font-bold italic">
                    <span>Remise</span>
                    <span>- {invoice.discountAmount.toLocaleString()} MAD</span>
                  </div>
                )}

                {invoice.adjustmentAmount !== 0 && (
                  <div className="flex justify-between text-sm text-slate-500 dark:text-slate-400 font-bold italic">
                    <span>Ajustement</span>
                    <span>{invoice.adjustmentAmount > 0 ? '-' : '+'} {Math.abs(invoice.adjustmentAmount).toLocaleString()} MAD</span>
                  </div>
                )}

                <div className="flex justify-between text-lg font-black pt-2 border-t border-slate-200 dark:border-white/10">
                  <span className="text-slate-800 dark:text-white">{invoice.taxEnabled ? 'TOTAL TTC' : 'TOTAL'}</span>
                  <span className="text-indigo-600 dark:text-indigo-400">{invoice.grandTotal.toLocaleString()} MAD</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#1b263b] rounded-[15px] p-10 shadow-xl border border-white/5">
            <div className="flex items-center space-x-3 mb-8">
              <div className="w-8 h-8 rounded-[8px] bg-emerald-500 flex items-center justify-center text-white">
                <i className="fas fa-history text-xs"></i>
              </div>
              <h4 className="text-white font-bold uppercase tracking-widest text-sm">Séquence des Règlements</h4>
            </div>

            {invoice.payments && invoice.payments.length > 0 ? (
              <div className="space-y-4">
                {invoice.payments.map((p, idx) => (
                  <div key={p.id} className="bg-white/5 border border-white/10 rounded-[12px] p-4 flex items-center justify-between group hover:bg-white/10 transition-all">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 rounded-[10px] bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-xs italic">
                        #{idx + 1}
                      </div>
                      <div>
                        <p className="text-white font-bold text-sm">{p.note || 'Encaissement'}</p>
                        <p className="text-[10px] text-slate-500 uppercase font-medium">{new Date(p.date).toLocaleDateString('fr-FR')} • {p.method}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-emerald-400 font-black text-sm">+{p.amount.toLocaleString()} MAD</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-10 text-center border-2 border-dashed border-white/5 rounded-[12px]">
                <p className="text-slate-500 italic text-sm">Aucun règlement enregistré.</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-white dark:bg-[#1b263b] p-8 rounded-[15px] border border-slate-200 dark:border-white/10 shadow-sm space-y-6">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Balance</h4>
            <div className="space-y-4">
              <div>
                <p className="text-2xl font-black text-slate-800 dark:text-white">{invoice.grandTotal.toLocaleString()} MAD</p>
              </div>
              <div className="h-2 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] transition-all duration-1000"
                  style={{ width: `${(calculateTotalPaid(invoice) / invoice.grandTotal) * 100}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-[11px] font-bold">
                <div className="text-emerald-600 dark:text-emerald-400">
                  <p className="uppercase opacity-50">Payé</p>
                  <p>{calculateTotalPaid(invoice).toLocaleString()} MAD</p>
                </div>
                <div className="text-rose-500 dark:text-rose-400 text-right">
                  <p className="uppercase opacity-50">Reste</p>
                  <p>{remaining.toLocaleString()} MAD</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-indigo-600 p-8 rounded-[15px] shadow-xl shadow-indigo-600/20 text-white space-y-6">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-indigo-200">Actions Rapides</h4>
            <div className="space-y-3">
              <button onClick={handleWhatsApp} className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white py-3 rounded-[10px] text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center space-x-2">
                <i className="fab fa-whatsapp text-lg"></i>
                <span>WhatsApp</span>
              </button>
              <button onClick={handleSendEmail} disabled={isGeneratingEmail} className="w-full bg-white/10 hover:bg-white/20 py-3 rounded-[10px] text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center space-x-2 disabled:opacity-50">
                {isGeneratingEmail ? <i className="fas fa-circle-notch animate-spin"></i> : <i className="far fa-envelope"></i>}
                <span>Email IA</span>
              </button>
              <button onClick={() => onAddPayment(invoice.id)} className="w-full bg-white text-indigo-600 py-3 rounded-[10px] text-xs font-bold uppercase tracking-widest transition-all shadow-lg hover:bg-indigo-50 flex items-center justify-center space-x-2">
                <i className="fas fa-plus"></i>
                <span>Payer</span>
              </button>

              <div className="pt-4 mt-4 border-t border-indigo-500/30">
                <button onClick={() => onDelete(invoice.id)} className="w-full bg-rose-500 hover:bg-rose-600 text-white py-3 rounded-[10px] text-[10px] font-black uppercase transition-all flex items-center justify-center space-x-2">
                  <i className="fas fa-trash-alt"></i>
                  <span>Supprimer</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceDetailView;
