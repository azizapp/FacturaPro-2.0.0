
import React from 'react';
import { Invoice, Client, Company } from '../types';

interface ClientStatementPDFPreviewProps {
  client: Client;
  invoices: Invoice[];
  company: Company;
  onClose: () => void;
}

const ClientStatementPDFPreview: React.FC<ClientStatementPDFPreviewProps> = ({ client, invoices, company, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  const payments = invoices.flatMap(inv =>
    (inv.payments || []).map(p => ({
      ...p,
      invoiceNumber: inv.number
    }))
  ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
  const totalCollected = payments.reduce((sum, p) => sum + p.amount, 0);
  const totalPieces = invoices.reduce((sum, inv) => sum + inv.items.reduce((s, item) => s + item.quantity, 0), 0);
  const balance = totalInvoiced - totalCollected;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md overflow-hidden print:overflow-visible statement-modal-wrapper">
      <div className="bg-white dark:bg-slate-900 w-full max-w-5xl h-[95vh] rounded-[15px] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-8 duration-300 print:h-auto print:w-full print:shadow-none print:rounded-none print:static print:block border border-transparent dark:border-white/10">

        {/* Header - Hidden on Print */}
        <div className="p-5 bg-slate-900 dark:bg-slate-800 flex items-center justify-between text-white shrink-0 print:hidden border-b border-transparent dark:border-white/10">
          <div className="flex items-center space-x-4 ml-4">
            <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center text-white">
              <i className="fas fa-file-invoice-dollar text-xl"></i>
            </div>
            <div>
              <span className="font-black text-sm uppercase tracking-widest">Relevé de Compte</span>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{client.name}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handlePrint}
              className="px-8 py-2.5 bg-orange-600 hover:bg-orange-700 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95 flex items-center space-x-2"
            >
              <i className="fas fa-print"></i>
              <span>Imprimer Rapport</span>
            </button>
            <button onClick={onClose} className="w-10 h-10 flex items-center justify-center hover:bg-white/10 rounded-full transition-colors ml-2">
              <i className="fas fa-times text-lg text-slate-400"></i>
            </button>
          </div>
        </div>

        {/* Scrollable Preview Area */}
        <div className="flex-1 overflow-y-auto p-12 bg-slate-100 dark:bg-slate-950 custom-scrollbar print:p-0 print:bg-white print:overflow-visible">
          {/* THE PRINTABLE SHEET */}
          <div className="printable-sheet mx-auto bg-white p-[15mm] shadow-2xl border border-slate-200 print:border-none print:shadow-none print:p-15mm print:m-0 w-full max-w-[900px] font-sans text-slate-900 print:max-w-none rounded-[15px]">

            {/* Header */}
            <div className="flex justify-between items-start mb-16">
              <div className="space-y-4">
                {company.logo ? (
                  <img src={company.logo} className="w-24 h-24 object-contain" alt="Logo" />
                ) : (
                  <div className="w-24 h-24 bg-slate-900 rounded-[30px] flex items-center justify-center text-white font-black text-3xl">
                    {company.name.charAt(0)}
                  </div>
                )}
                <div className="text-left">
                  <h1 className="text-2xl font-black uppercase tracking-tighter">{company.name}</h1>
                  <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-widest">{company.address}{company.city ? `, ${company.city}` : ''}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">SIRET: {company.siret}</p>
                </div>
              </div>
              <div className="text-right">
                <h2 className="text-4xl font-black text-indigo-600 mb-2 uppercase tracking-tighter">RELEVÉ DE COMPTE</h2>
                <div className="space-y-1">
                  <p className="text-sm font-black text-slate-800">Généré le: {new Date().toLocaleDateString('fr-FR')}</p>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest italic">Document d'analyse comptable</p>
                </div>
              </div>
            </div>

            {/* Account Summary Bar */}
            <div className="bg-slate-50 rounded-[40px] p-10 mb-16 flex justify-between items-center border border-slate-100 print:bg-white print:border-slate-200">
              <div className="text-left">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-2">Situation du Client</p>
                <p className="text-2xl font-black text-slate-800 uppercase tracking-tight">{client.name}</p>
                <p className="text-sm text-slate-500 mt-1 italic">{client.address}</p>
              </div>
              <div className="text-right bg-white p-6 rounded-3xl border border-slate-100 shadow-sm print:shadow-none">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-2">Solde Débiteur</p>
                <p className="text-4xl font-black text-rose-600 tracking-tighter">{balance.toLocaleString()} <span className="text-sm">MAD</span></p>
              </div>
            </div>

            {/* Invoices History */}
            <div className="mb-12">
              <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-indigo-600 border-b-2 border-indigo-50 pb-3 mb-6 flex items-center">
                <i className="fas fa-file-invoice mr-3"></i> Historique des Facturations
              </h4>
              <table className="w-full text-left mb-8 border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white">
                    <th className="py-4 px-4 text-[9px] font-black uppercase tracking-widest rounded-tl-xl text-left">Date</th>
                    <th className="py-4 px-4 text-[9px] font-black uppercase tracking-widest text-left">Réf. Facture</th>
                    <th className="py-4 px-4 text-center text-[9px] font-black uppercase tracking-widest">Pièces</th>
                    <th className="py-4 px-4 text-right text-[9px] font-black uppercase tracking-widest">Débit (TTC)</th>
                    <th className="py-4 px-4 text-right text-[9px] font-black uppercase tracking-widest">Réglé</th>
                    <th className="py-4 px-4 text-right text-[9px] font-black uppercase tracking-widest rounded-tr-xl">Solde</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-medium">
                  {invoices.map((inv) => {
                    const paid = (inv.payments || []).reduce((s, p) => s + p.amount, 0);
                    const qty = inv.items.reduce((s, i) => s + i.quantity, 0);
                    return (
                      <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 px-4 text-slate-500 text-left">{new Date(inv.date).toLocaleDateString('fr-FR')}</td>
                        <td className="py-4 px-4 font-black text-slate-800 uppercase text-left">{inv.number}</td>
                        <td className="py-4 px-4 text-center font-black text-slate-600">{qty}</td>
                        <td className="py-4 px-4 text-right font-black">{inv.grandTotal.toLocaleString()}</td>
                        <td className="py-4 px-4 text-right font-black text-emerald-600">{paid.toLocaleString()}</td>
                        <td className="py-4 px-4 text-right font-black text-rose-500 bg-rose-50/30 print:bg-white">{(inv.grandTotal - paid).toLocaleString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Payments History */}
            <div className="mb-16">
              <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-600 border-b-2 border-emerald-50 pb-3 mb-6 flex items-center">
                <i className="fas fa-receipt mr-3"></i> Historique des Règlements
              </h4>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white">
                    <th className="py-4 px-4 text-[9px] font-black uppercase tracking-widest rounded-tl-xl text-left">Date Encaissement</th>
                    <th className="py-4 px-4 text-[9px] font-black uppercase tracking-widest text-left">Facture Concernée</th>
                    <th className="py-4 px-4 text-[9px] font-black uppercase tracking-widest text-left">Mode</th>
                    <th className="py-4 px-4 text-right text-[9px] font-black uppercase tracking-widest rounded-tr-xl">Crédit (MAD)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-medium">
                  {payments.map((p, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-4 text-slate-500 text-left">{new Date(p.date).toLocaleDateString('fr-FR')}</td>
                      <td className="py-4 px-4 font-black text-indigo-600 uppercase text-left">{p.invoiceNumber}</td>
                      <td className="py-4 px-4 uppercase text-[10px] font-black text-slate-400 tracking-widest text-left">{p.method}</td>
                      <td className="py-4 px-4 text-right font-black text-emerald-600">+{p.amount.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-12 border-t-4 border-slate-900">
              <div className="w-80 space-y-4">
                <div className="flex justify-between text-[11px] font-black text-slate-400 uppercase tracking-widest">
                  <span>Volume Total</span>
                  <span className="text-slate-800">{totalPieces} UNITÉS</span>
                </div>
                <div className="flex justify-between text-[11px] font-black text-slate-400 uppercase tracking-widest">
                  <span>Cumul Facturé</span>
                  <span className="text-slate-800">{totalInvoiced.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-4">
                  <span>Cumul Encaissé</span>
                  <span className="text-emerald-600">{totalCollected.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-[11px] font-black uppercase text-slate-900 tracking-[0.2em]">Reste à Recouvrer</span>
                  <span className="text-4xl font-black text-indigo-600 tracking-tighter">{balance.toLocaleString()} <span className="text-sm">MAD</span></span>
                </div>
              </div>
            </div>

            <div className="mt-24 pt-12 border-t border-slate-100 text-[10px] text-slate-300 uppercase tracking-[0.4em] text-center leading-loose font-medium">
              {company.footer || "Ce relevé est certifié conforme par FacturaPro."}
            </div>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        @media print {
          @page { size: A4 portrait; margin: 0; }
          
          /* CRITICAL: Disable all animations and transitions */
          * { 
            -webkit-print-color-adjust: exact !important; 
            print-color-adjust: exact !important; 
            color-adjust: exact !important;
            animation: none !important;
            transition: none !important;
            transition-delay: 0s !important;
          }

          /* Force full visibility and opacity */
          .statement-modal-wrapper,
          .statement-modal-wrapper *,
          .printable-sheet,
          .printable-sheet * {
            visibility: visible !important;
            opacity: 1 !important;
            transform: none !important;
          }
          
          /* Ensure all parent containers flow naturally */
          html, body, #root, #root > div {
            margin: 0 !important;
            padding: 0 !important;
            height: auto !important;
            min-height: auto !important;
            overflow: visible !important;
            display: block !important;
            background: white !important;
            opacity: 1 !important;
            visibility: visible !important;
          }

          /* Hide only the main app layout elements, leaving the modal visible. */
          #root > div > *:not(.statement-modal-wrapper) {
            display: none !important;
          }

          .statement-modal-wrapper {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            display: block !important;
            background: white !important;
            visibility: visible !important;
            z-index: auto !important;
            height: auto !important;
            overflow: visible !important;
          }

          /* Modal inner content should not be clipped */
          .statement-modal-wrapper > div {
            position: static !important;
            display: block !important;
            width: 100% !important;
            height: auto !important;
            box-shadow: none !important;
            border: none !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: visible !important;
          }

          /* Hide UI elements specifically */
          .print\:hidden, 
          .statement-modal-wrapper .bg-slate-900\/60, 
          .statement-modal-wrapper .backdrop-blur-md,
          .statement-modal-wrapper > div > div:first-child {
            display: none !important;
          }

          .printable-sheet {
            box-shadow: none !important;
            border: none !important;
            width: 210mm !important;
            min-height: 297mm !important;
            margin: 0 auto !important;
            padding: 15mm !important;
            background: white !important;
            border-radius: 0 !important;
            box-sizing: border-box !important;
            overflow: visible !important;
            display: flex !important;
            flex-direction: column !important;
          }

          .bg-slate-50 {
            background-color: #f8fafc !important;
          }
          
          .bg-slate-900 {
            background-color: #0f172a !important;
          }

          img {
            max-width: 100% !important;
            display: block !important;
            opacity: 1 !important;
            visibility: visible !important;
          }
        }
      `}} />
    </div>
  );
};

export default ClientStatementPDFPreview;
