
import React, { useState, useEffect } from 'react';
import { Invoice, Client, InvoiceStatus, Company } from '../types';

interface InvoiceListProps {
  invoices: Invoice[];
  clients: Client[];
  company: Company;
  onRefresh: () => void;
  onExportStatement?: (clientId: string) => void;
  initialClientId?: string;
  onDeletePayment?: (invoiceId: string, paymentId: string) => void;
}

const InvoiceList: React.FC<InvoiceListProps> = ({ invoices, clients, company, onRefresh, onExportStatement, initialClientId, onDeletePayment }) => {
  const [searchTermSidebar, setSearchTermSidebar] = useState('');

  const activeClientsWithInvoices = clients.filter(client => {
    const hasInvoices = invoices.some(inv => inv.clientId === client.id);
    const matchesSearch = client.name.toLowerCase().includes(searchTermSidebar.toLowerCase());
    return hasInvoices && matchesSearch;
  });

  const [selectedClientId, setSelectedClientId] = useState<string>(initialClientId || activeClientsWithInvoices[0]?.id || '');
  const [activeTab, setActiveTab] = useState<string>("Vue d'ensemble");

  useEffect(() => {
    if (initialClientId) {
      setSelectedClientId(initialClientId);
    } else if (!selectedClientId && activeClientsWithInvoices.length > 0) {
      setSelectedClientId(activeClientsWithInvoices[0].id);
    }
  }, [initialClientId, activeClientsWithInvoices]);

  const selectedClient = clients.find(c => c.id === selectedClientId);
  const clientInvoices = invoices.filter(inv => inv.clientId === selectedClientId);

  const clientPayments = clientInvoices.flatMap(inv =>
    (inv.payments || []).map(p => ({
      ...p,
      invoiceNumber: inv.number,
      originalInvoiceId: inv.id
    }))
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const operations = [
    ...clientInvoices.map(inv => ({
      date: inv.date,
      type: 'Facture',
      reference: inv.number,
      debit: inv.grandTotal,
      credit: 0,
      timestamp: new Date(inv.date).getTime()
    })),
    ...clientPayments.map(p => ({
      date: p.date.split('T')[0],
      type: 'Paiement',
      reference: `Paiement / ${p.invoiceNumber}`,
      debit: 0,
      credit: p.amount,
      timestamp: new Date(p.date).getTime()
    }))
  ].sort((a, b) => a.timestamp - b.timestamp);

  let runningBalance = 0;
  const operationsWithBalance = operations.map(op => {
    runningBalance += (op.debit - op.credit);
    return { ...op, balance: runningBalance };
  });

  const totalInvoiced = clientInvoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
  const totalCollected = clientPayments.reduce((sum, p) => sum + p.amount, 0);
  const totalPieces = clientInvoices.reduce((sum, inv) => sum + inv.items.reduce((s, item) => s + item.quantity, 0), 0);
  const soldeDebiteur = totalInvoiced - totalCollected;

  const handleShareWhatsApp = () => {
    if (!selectedClient) return;
    const phone = (selectedClient.gsm1 || selectedClient.phone || "").replace(/\s+/g, '');
    const message = encodeURIComponent(
      `*RELEVÉ DE COMPTE : ${selectedClient.name}*\n` +
      `Bonjour,\n\nVeuillez trouver le récapitulatif de votre compte chez *${company.name}* :\n\n` +
      `• *Cumul Ventes :* ${totalInvoiced.toLocaleString()} MAD\n` +
      `• *Cumul Règlements :* ${totalCollected.toLocaleString()} MAD\n` +
      `• *SOLDE DÉBITEUR :* ${soldeDebiteur.toLocaleString()} MAD\n\n` +
      `Merci de votre confiance.`
    );
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
  };

  const handleShareEmail = () => {
    if (!selectedClient) return;
    const subject = encodeURIComponent(`Relevé de Compte - ${company.name}`);
    const body = encodeURIComponent(`Bonjour ${selectedClient.name},\n\nVeuillez trouver ci-joint votre relevé de compte.\nSolde débiteur: ${soldeDebiteur.toLocaleString()} MAD.\n\nCordialement,\n${company.name}`);
    window.location.href = `mailto:${selectedClient.email}?subject=${subject}&body=${body}`;
  };

  const handleDelete = (invoiceId: string, paymentId: string) => {
    if (!invoiceId || !paymentId) {
      console.error("Identifiants manquants pour la suppression:", { invoiceId, paymentId });
      return;
    }

    // Remarque : window.confirm est bloqué en sandbox iframe sans permissions explicites.
    // On appelle directement le callback du parent qui va déclencher le modal de l'App.
    onDeletePayment?.(invoiceId, paymentId);
  };

  const TabItem: React.FC<{ label: string }> = ({ label }) => (
    <button
      onClick={() => setActiveTab(label)}
      className={`px-4 py-2 text-sm font-medium transition-all relative ${activeTab === label ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-800'
        }`}
    >
      {label}
      {activeTab === label && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600"></div>}
    </button>
  );

  return (
    <div className="flex h-[calc(100vh-160px)] bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      <div className="w-80 border-r border-slate-200 flex flex-col bg-slate-50/30">
        <div className="p-4 border-b border-slate-200 bg-white space-y-3">
          <div className="flex items-center justify-between">
            <button className="text-slate-800 font-bold text-sm flex items-center uppercase tracking-tight">
              Comptes Actifs <i className="fas fa-chevron-down ml-2 text-indigo-500 text-xs"></i>
            </button>
          </div>
          <div className="relative">
            <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 text-xs"></i>
            <input
              type="text"
              placeholder="Filtrer..."
              value={searchTermSidebar}
              onChange={(e) => setSearchTermSidebar(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {activeClientsWithInvoices.length > 0 ? (
            activeClientsWithInvoices.map(client => {
              const cInvoices = invoices.filter(inv => inv.clientId === client.id);
              const cPaid = cInvoices.flatMap(i => i.payments || []).reduce((s, p) => s + p.amount, 0);
              const cInvoiced = cInvoices.reduce((s, i) => s + i.grandTotal, 0);
              const cBalance = cInvoiced - cPaid;

              return (
                <div
                  key={client.id}
                  onClick={() => setSelectedClientId(client.id)}
                  className={`p-4 border-b border-slate-100 cursor-pointer transition-colors flex items-center space-x-3 ${selectedClientId === client.id ? 'bg-white shadow-sm ring-1 ring-inset ring-slate-200 z-10' : 'hover:bg-white'
                    }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-[10px] ${selectedClientId === client.id ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'
                    }`}>
                    {client.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-bold truncate uppercase tracking-tight ${selectedClientId === client.id ? 'text-indigo-600' : 'text-slate-800'}`}>
                      {client.name}
                    </p>
                    <p className={`text-[10px] uppercase font-bold ${cBalance > 0 ? 'text-rose-500' : 'text-slate-400'}`}>
                      {cBalance.toLocaleString()} MAD
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-slate-400 italic text-xs">
              Aucun client avec factures.
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-white overflow-hidden">
        {selectedClient ? (
          <>
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">{selectedClient.name}</h2>
                  <p className="text-xs text-slate-400 font-medium italic mt-1">{selectedClient.address} • {selectedClient.city}</p>
                </div>
                <div className="flex space-x-2">                  <button
                  onClick={handleShareWhatsApp}
                  className="w-10 h-10 bg-[#25D366] text-white rounded-xl flex items-center justify-center hover:bg-[#128C7E] transition-all shadow-sm"
                  title="Partager Relevé sur WhatsApp"
                >
                  <i className="fab fa-whatsapp text-lg"></i>
                </button>
                  <button
                    onClick={handleShareEmail}
                    className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center hover:bg-blue-100 transition-all shadow-sm"
                    title="Email"
                  >
                    <i className="far fa-envelope"></i>
                  </button>
                  <button
                    onClick={async () => {
                      if (!selectedClient) return;
                      const { summarizeInvoices } = await import('../services/geminiService');
                      const analysis = await summarizeInvoices(clientInvoices);
                      alert(`Rapport IA pour ${selectedClient.name} :\n\n${analysis.summary}\n\nRecommandation : ${analysis.recommendation}`);
                    }}
                    className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center hover:bg-indigo-100 transition-all shadow-sm"
                    title="Diagnostic IA du Compte"
                  >
                    <i className="fas fa-brain"></i>
                  </button>
                  <button
                    onClick={() => onExportStatement?.(selectedClientId)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 uppercase tracking-widest flex items-center space-x-2"
                  >
                    <i className="fas fa-file-pdf"></i>
                    <span>Rapport PDF</span>
                  </button>
                </div>
              </div>

              <div className="flex space-x-4 -mb-[25px]">
                <TabItem label="Vue d'ensemble" />
                <TabItem label="Factures" />
                <TabItem label="Paiements" />
                <TabItem label="Relevé" />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50 custom-scrollbar">
              {activeTab === "Vue d'ensemble" && (
                <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Total Pièces</p>
                      <p className="text-xl font-black text-slate-800">{totalPieces} <span className="text-[10px] text-slate-400">UNITÉS</span></p>
                    </div>
                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Total Facturé</p>
                      <p className="text-xl font-black text-slate-800">{totalInvoiced.toLocaleString()} <span className="text-[10px] text-slate-400">MAD</span></p>
                    </div>
                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Total Recouvré</p>
                      <p className="text-xl font-black text-emerald-500">{totalCollected.toLocaleString()} <span className="text-[10px] text-slate-400">MAD</span></p>
                    </div>
                    <div className="bg-white p-6 rounded-3xl border border-rose-100 shadow-sm ring-1 ring-rose-50">
                      <p className="text-[10px] font-bold text-rose-400 uppercase tracking-widest mb-2">Solde Restant</p>
                      <p className="text-xl font-black text-rose-500">{soldeDebiteur.toLocaleString()} <span className="text-[10px] text-rose-300">MAD</span></p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'Factures' && (
                <div className="max-w-5xl mx-auto space-y-6 animate-in slide-in-from-bottom-2 duration-300">
                  <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-left">Date</th>
                          <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-left">N° Facture</th>
                          <th className="px-6 py-4 text-center text-[10px] font-bold uppercase tracking-widest text-slate-400">Pièces</th>
                          <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-right">Montant TTC</th>
                          <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-right">Payé</th>
                          <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-right">Reste</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {clientInvoices.map((inv) => {
                          const paid = (inv.payments || []).reduce((sum, p) => sum + p.amount, 0);
                          const pieces = inv.items.reduce((sum, item) => sum + item.quantity, 0);
                          return (
                            <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                              <td className="px-6 py-4 text-xs text-slate-500 text-left">{new Date(inv.date).toLocaleDateString('fr-FR')}</td>
                              <td className="px-6 py-4 text-xs font-bold text-indigo-600 uppercase text-left">{inv.number}</td>
                              <td className="px-6 py-4 text-center text-xs font-bold text-slate-600">{pieces}</td>
                              <td className="px-6 py-4 text-right text-xs font-bold text-slate-800">{inv.grandTotal.toLocaleString()}</td>
                              <td className="px-6 py-4 text-right text-xs font-bold text-emerald-500">{paid.toLocaleString()}</td>
                              <td className={`px-6 py-4 text-right text-xs font-bold ${inv.grandTotal - paid > 0 ? 'text-rose-500' : 'text-slate-200'}`}>
                                {(inv.grandTotal - paid).toLocaleString()}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'Paiements' && (
                <div className="max-w-5xl mx-auto space-y-6 animate-in slide-in-from-bottom-2 duration-300">
                  <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-left">Date</th>
                          <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-left">Référence Facture</th>
                          <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-left">Mode</th>
                          <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-right">Montant Payé</th>
                          <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {clientPayments.map((p) => (
                          <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4 text-xs text-slate-500 text-left">{new Date(p.date).toLocaleDateString('fr-FR')}</td>
                            <td className="px-6 py-4 text-xs font-bold text-indigo-600 uppercase text-left">{p.invoiceNumber}</td>
                            <td className="px-6 py-4 text-xs font-medium text-slate-600 uppercase text-left">{p.method}</td>
                            <td className="px-6 py-4 text-right text-xs font-bold text-emerald-600">+{p.amount.toLocaleString()} MAD</td>
                            <td className="px-6 py-4 text-center">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(p.originalInvoiceId, p.id);
                                }}
                                className="w-8 h-8 rounded-lg text-rose-400 hover:bg-rose-50 hover:text-rose-600 transition-all flex items-center justify-center mx-auto"
                                title="Supprimer le règlement"
                              >
                                <i className="fas fa-trash-alt text-[10px]"></i>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'Relevé' && (
                <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500">
                  <div className="bg-white shadow-xl border border-slate-200 p-12 font-sans text-slate-900 mx-auto w-full max-w-4xl min-h-[600px]">
                    <div className="flex justify-between items-start mb-12 pb-8 border-b border-slate-100">
                      <div>
                        <div className="mb-4">
                          <span className="text-3xl font-black text-orange-500 tracking-tighter">FACTURAPRO<span className="text-xs align-top">™</span></span>
                        </div>
                        <p className="text-[10px] text-slate-800 font-bold uppercase">{company.name}</p>
                      </div>
                      <div className="text-right">
                        <h1 className="text-xl font-black text-slate-800 uppercase tracking-widest mb-1">Relevé de Compte</h1>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Client: {selectedClient.name}</p>
                      </div>
                    </div>

                    <table className="w-full mb-12 border-collapse">
                      <thead>
                        <tr className="bg-slate-900 text-white">
                          <th className="py-3 px-4 text-left text-[9px] font-bold uppercase tracking-widest">Date</th>
                          <th className="py-3 px-4 text-left text-[9px] font-bold uppercase tracking-widest">Nature</th>
                          <th className="py-3 px-4 text-right text-[9px] font-bold uppercase tracking-widest">Débit</th>
                          <th className="py-3 px-4 text-right text-[9px] font-bold uppercase tracking-widest">Crédit</th>
                          <th className="py-3 px-4 text-right text-[9px] font-bold uppercase tracking-widest bg-slate-800">Solde</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 border-b border-slate-200">
                        {operationsWithBalance.map((op, idx) => (
                          <tr key={idx} className="hover:bg-slate-50 transition-colors">
                            <td className="py-3 px-4 text-[10px] text-slate-500 font-medium">{new Date(op.date).toLocaleDateString('fr-FR')}</td>
                            <td className="py-3 px-4 text-[10px] font-bold text-slate-700">{op.type} ({op.reference})</td>
                            <td className="py-3 px-4 text-right text-[10px] font-medium text-slate-800">{op.debit > 0 ? op.debit.toLocaleString() : '-'}</td>
                            <td className="py-3 px-4 text-right text-[10px] font-medium text-emerald-600">{op.credit > 0 ? op.credit.toLocaleString() : '-'}</td>
                            <td className="py-3 px-4 text-right text-[10px] font-black text-slate-900 bg-slate-50/50">{op.balance.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-slate-50 font-black">
                          <td colSpan={2} className="py-4 px-4 text-[9px] uppercase tracking-widest">Totals</td>
                          <td className="py-4 px-4 text-right text-[11px]">{totalInvoiced.toLocaleString()}</td>
                          <td className="py-4 px-4 text-right text-[11px] text-emerald-600">{totalCollected.toLocaleString()}</td>
                          <td className="py-4 px-4 text-right text-[12px] text-rose-500 bg-rose-50">{soldeDebiteur.toLocaleString()} MAD</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-300">
            <i className="fas fa-id-badge text-6xl mb-4 opacity-10"></i>
            <p className="text-xs font-bold uppercase tracking-widest">Sélectionnez un compte client</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default InvoiceList;
