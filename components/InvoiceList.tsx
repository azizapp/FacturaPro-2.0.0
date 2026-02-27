
import React, { useState, useEffect } from 'react';
import { Invoice, Client, Company } from '../types';

interface InvoiceListProps {
  invoices: Invoice[];
  clients: Client[];
  company: Company;
  onExportStatement?: (clientId: string) => void;
  initialClientId?: string;
  onDeletePayment?: (invoiceId: string, paymentId: string) => void;
}

const TabItem: React.FC<{ label: string; activeTab: string; onClick: (label: string) => void }> = ({ label, activeTab, onClick }) => (
  <button
    onClick={() => onClick(label)}
    className={`px-4 py-2 text-sm font-medium transition-all relative ${activeTab === label ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
      }`}
  >
    {label}
    {activeTab === label && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600"></div>}
  </button>
);

const InvoiceList: React.FC<InvoiceListProps> = ({ invoices, clients, company, onExportStatement, initialClientId, onDeletePayment }) => {
  const [searchTermSidebar, setSearchTermSidebar] = useState('');

  const activeClientsWithInvoices = React.useMemo(() => clients.filter(client => {
    const hasInvoices = invoices.some(inv => inv.clientId === client.id);
    const matchesSearch = client.name.toLowerCase().includes(searchTermSidebar.toLowerCase());
    return hasInvoices && matchesSearch;
  }), [clients, invoices, searchTermSidebar]);

  const [selectedClientId, setSelectedClientId] = useState<string>(initialClientId || activeClientsWithInvoices[0]?.id || '');
  const [activeTab, setActiveTab] = useState<string>("Vue d'ensemble");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const pageSizeOptions = [10, 20, 30, 50, 100, 200];

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  const handleClientSelect = (clientId: string) => {
    setSelectedClientId(clientId);
    setCurrentPage(1);
  };

  const handleItemsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  useEffect(() => {
    if (initialClientId && initialClientId !== selectedClientId) {
      setSelectedClientId(initialClientId);
      setCurrentPage(1);
    } else if (!selectedClientId && activeClientsWithInvoices.length > 0) {
      setSelectedClientId(activeClientsWithInvoices[0].id);
      setCurrentPage(1);
    }
  }, [initialClientId, activeClientsWithInvoices, selectedClientId]);

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

  const operationsWithBalance = operations.reduce((acc, op) => {
    const lastBalance = acc.length > 0 ? acc[acc.length - 1].balance : 0;
    const newBalance = lastBalance + (op.debit - op.credit);
    acc.push({ ...op, balance: newBalance });
    return acc;
  }, [] as (typeof operations[0] & { balance: number })[]);

  const totalInvoiced = clientInvoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
  const totalCollected = clientPayments.reduce((sum, p) => sum + p.amount, 0);
  const totalPieces = clientInvoices.reduce((sum, inv) => sum + inv.items.reduce((s, item) => s + item.quantity, 0), 0);
  const soldeDebiteur = totalInvoiced - totalCollected;

  const getPaginatedData = () => {
    let data: (Invoice | (typeof clientPayments)[0])[] = [];
    if (activeTab === 'Factures') data = clientInvoices;
    else if (activeTab === 'Paiements') data = clientPayments;
    
    const totalPages = Math.ceil(data.length / itemsPerPage);
    const paginatedData = data.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );
    
    return { data, paginatedData, totalPages };
  };

  const { data: currentData, paginatedData, totalPages } = getPaginatedData();

  const handleShareWhatsApp = async () => {
    if (!selectedClient) return;
    const phone = (selectedClient.gsm1 || selectedClient.phone || "").replace(/\s+/g, '');

    const loadScript = (src: string) => new Promise<void>((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) return resolve();
      const s = document.createElement('script');
      s.src = src;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error(`Failed to load ${src}`));
      document.head.appendChild(s);
    });

    try {
      // Build printable HTML fragment
      const rows = clientInvoices.map(inv => `
        <tr>
          <td style="padding:8px;border:1px solid #ddd">${new Date(inv.date).toLocaleDateString('fr-FR')}</td>
          <td style="padding:8px;border:1px solid #ddd">${inv.number}</td>
          <td style="padding:8px;border:1px solid #ddd;text-align:right">${inv.grandTotal.toLocaleString('fr-FR')}</td>
        </tr>
      `).join('');

      const html = `
        <div style="font-family:Arial,Helvetica,sans-serif;color:#111;padding:6px;max-width:800px;font-size:8px;line-height:1.1">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <div>
              <h2 style="margin:0;font-size:10px">${company.name}</h2>
              <div style="font-size:8px">Client: ${selectedClient.name}</div>
            </div>
            <div style="text-align:right;font-size:8px">
              <strong>Relevé de compte</strong>
              <div>${new Date().toLocaleDateString('fr-FR')}</div>
            </div>
          </div>
          <div style="margin-top:8px;font-size:8px">
            <div>Cumul Ventes: <strong>${totalInvoiced.toLocaleString('fr-FR')} MAD</strong></div>
            <div>Cumul Règlements: <strong>${totalCollected.toLocaleString('fr-FR')} MAD</strong></div>
            <div>Solde Débiteur: <strong>${soldeDebiteur.toLocaleString('fr-FR')} MAD</strong></div>
          </div>
          <table style="width:100%;border-collapse:collapse;margin-top:8px;font-size:8px">
            <thead>
              <tr>
                <th style="border:1px solid #ddd;padding:4px;background:#f5f5f5;text-align:left">Date</th>
                <th style="border:1px solid #ddd;padding:4px;background:#f5f5f5;text-align:left">Réf. Facture</th>
                <th style="border:1px solid #ddd;padding:4px;background:#f5f5f5;text-align:right">Total TTC</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
        </div>`;

      // Create off-screen container (must be visible to html2canvas)
      const container = document.createElement('div');
      container.style.position = 'fixed';
      container.style.left = '-10000px';
      container.style.top = '0';
      container.style.width = '800px';
      container.style.background = 'white';
      container.innerHTML = html;
      document.body.appendChild(container);

      // Load html2canvas and jsPDF (UMD) from CDN if not already loaded
      // html2canvas global: html2canvas
      // jspdf UMD exposes window.jspdf with .jsPDF
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (!(window as any).html2canvas) {
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (!(window as any).jspdf) {
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const html2canvas = (window as any).html2canvas;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { jsPDF } = (window as any).jspdf;

      // Render container to canvas
      const canvas = await html2canvas(container, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');

      // Create PDF sized to A4 and split into pages if needed
      const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      const availableWidth = pdfWidth - margin * 2;
      const availableHeight = pdfHeight - margin * 2;

      const scale = availableWidth / canvas.width;
      const imgWidth = canvas.width * scale;
      const imgHeight = canvas.height * scale;

      if (imgHeight <= availableHeight) {
        // Single page
        pdf.addImage(imgData, 'PNG', margin, margin, imgWidth, imgHeight);
      } else {
        // Multi-page: draw slices of the canvas per page
        const srcPageHeight = Math.floor(availableHeight / scale);
        const totalPages = Math.ceil(canvas.height / srcPageHeight);
        for (let p = 0; p < totalPages; p++) {
          const sY = p * srcPageHeight;
          const sH = Math.min(srcPageHeight, canvas.height - sY);
          const pageCanvas = document.createElement('canvas') as HTMLCanvasElement;
          pageCanvas.width = canvas.width;
          pageCanvas.height = sH;
          const ctx = pageCanvas.getContext('2d') as CanvasRenderingContext2D;
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
          ctx.drawImage(canvas, 0, sY, canvas.width, sH, 0, 0, canvas.width, sH);
          const pageData = pageCanvas.toDataURL('image/png');
          const pageImgHeight = sH * scale;
          pdf.addImage(pageData, 'PNG', margin, margin, imgWidth, pageImgHeight);
          if (p < totalPages - 1) pdf.addPage();
        }
      }

      const fileName = `${company.name.replace(/\s+/g, '_')}_releve_${selectedClient.name.replace(/\s+/g, '_')}.pdf`;
      pdf.save(fileName);

      // Cleanup
      document.body.removeChild(container);

      // Open WhatsApp chat informing the client
      const message = encodeURIComponent(`Bonjour ${selectedClient.name},\\n\\nJe vous ai envoyé votre relevé de compte (${fileName}). Veuillez l'envoyer via ce chat.`);
      window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
    } catch (err) {
      console.error('Erreur partage WhatsApp:', err);
    }
  };

  const handleDelete = (invoiceId: string, paymentId: string) => {
    if (onDeletePayment) {
      onDeletePayment(invoiceId, paymentId);
    }
  };



  return (
    <div className="flex h-[calc(100vh-160px)] bg-white dark:bg-[#1b263b] border border-slate-200 dark:border-white/5 rounded-[15px] overflow-hidden shadow-sm transition-colors duration-300">
      <div className="w-80 border-r border-slate-200 dark:border-white/5 flex flex-col bg-slate-50/30 dark:bg-slate-900/20">
        <div className="p-4 border-b border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900/40 space-y-3">
          <div className="flex items-center justify-between">
            <button className="text-slate-800 dark:text-white font-bold text-sm flex items-center uppercase tracking-tight">
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
              className="w-full pl-8 pr-3 py-1.5 border border-slate-200 dark:border-white/10 dark:bg-slate-800 rounded-lg text-xs outline-none focus:ring-1 focus:ring-indigo-500 transition-all dark:text-white"
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
                  onClick={() => handleClientSelect(client.id)}
                  className={`p-4 border-b border-slate-100 dark:border-white/5 cursor-pointer transition-colors flex items-center space-x-3 ${selectedClientId === client.id ? 'bg-white dark:bg-white/5 shadow-sm ring-1 ring-inset ring-slate-200 dark:ring-white/10 z-10' : 'hover:bg-white dark:hover:bg-white/5'
                    }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-[10px] ${selectedClientId === client.id ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                    }`}>
                    {client.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-bold truncate uppercase tracking-tight ${selectedClientId === client.id ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-800 dark:text-slate-200'}`}>
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

      <div className="flex-1 flex flex-col bg-white dark:bg-[#1b263b] overflow-hidden">
        {selectedClient ? (
          <>
            <div className="p-6 border-b border-slate-200 dark:border-white/5">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight">{selectedClient.name}</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-500 font-medium italic mt-1">{selectedClient.address} • {selectedClient.city}</p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={handleShareWhatsApp}
                    className="w-10 h-10 bg-[#25D366] text-white rounded-xl flex items-center justify-center hover:bg-[#128C7E] transition-all shadow-sm"
                    title="Partager Relevé sur WhatsApp"
                  >
                    <i className="fab fa-whatsapp text-lg"></i>
                  </button>
                  <button
                    onClick={() => onExportStatement?.(selectedClientId)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 uppercase tracking-widest flex items-center space-x-2"
                  >
                    <i className="fas fa-file-pdf"></i>
                    <span>PDF</span>
                  </button>
                </div>
              </div>

              <div className="flex space-x-4 -mb-[25px]">
                <TabItem label="Vue d'ensemble" activeTab={activeTab} onClick={handleTabChange} />
                <TabItem label="Factures" activeTab={activeTab} onClick={handleTabChange} />
                <TabItem label="Paiements" activeTab={activeTab} onClick={handleTabChange} />
                <TabItem label="Relevé" activeTab={activeTab} onClick={handleTabChange} />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50 dark:bg-slate-900/20 custom-scrollbar">
              {activeTab === "Vue d'ensemble" && (
                <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white dark:bg-white/5 p-6 rounded-[15px] border border-slate-200 dark:border-white/5 shadow-sm">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Total Pièces</p>
                      <p className="text-xl font-black text-slate-800 dark:text-white">{totalPieces}</p>
                    </div>
                    <div className="bg-white dark:bg-white/5 p-6 rounded-[15px] border border-slate-200 dark:border-white/5 shadow-sm">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Total Facturé</p>
                      <p className="text-xl font-black text-slate-800 dark:text-white">{totalInvoiced.toLocaleString()}</p>
                    </div>
                    <div className="bg-white dark:bg-white/5 p-6 rounded-[15px] border border-slate-200 dark:border-white/5 shadow-sm">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Total Recouvré</p>
                      <p className="text-xl font-black text-emerald-500">{totalCollected.toLocaleString()}</p>
                    </div>
                    <div className="bg-white dark:bg-white/5 p-6 rounded-[15px] border border-rose-100 dark:border-rose-500/20 shadow-sm ring-1 ring-rose-50 dark:ring-rose-500/20">
                      <p className="text-[10px] font-bold text-rose-400 uppercase tracking-widest mb-2">Solde Restant</p>
                      <p className="text-xl font-black text-rose-500">{soldeDebiteur.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              )}

              {(activeTab === 'Factures' || activeTab === 'Paiements') && (
                <div className="max-w-5xl mx-auto space-y-6 animate-in slide-in-from-bottom-2 duration-300">
                  <div className="bg-white dark:bg-white/5 rounded-[15px] border border-slate-200 dark:border-white/5 overflow-hidden shadow-sm">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-white/5">
                        <tr>
                          {activeTab === 'Factures' ? (
                            <>
                              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-left">Date</th>
                              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-left">N° Facture</th>
                              <th className="px-6 py-4 text-center text-[10px] font-bold uppercase tracking-widest text-slate-400">Pièces</th>
                              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-right">TTC</th>
                              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-right">Reste</th>
                            </>
                          ) : (
                            <>
                              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-left">Date</th>
                              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-left">Réf.</th>
                              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-left">Mode</th>
                              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-right">Montant</th>
                              <th className="px-6 py-4 text-center text-[10px] font-bold uppercase tracking-widest text-slate-400">Actions</th>
                            </>
                          )}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                        {activeTab === 'Factures' ? (paginatedData as Invoice[]).map((inv) => {
                          const paid = (inv.payments || []).reduce((sum, p) => sum + p.amount, 0);
                          const pieces = inv.items.reduce((sum, item) => sum + item.quantity, 0);
                          return (
                            <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                              <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400 text-left">{new Date(inv.date).toLocaleDateString('fr-FR')}</td>
                              <td className="px-6 py-4 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase text-left">{inv.number}</td>
                              <td className="px-6 py-4 text-center text-xs font-bold text-slate-600 dark:text-slate-300">{pieces}</td>
                              <td className="px-6 py-4 text-right text-xs font-bold text-slate-800 dark:text-white">{inv.grandTotal.toLocaleString()}</td>
                              <td className={`px-6 py-4 text-right text-xs font-bold ${inv.grandTotal - paid > 0 ? 'text-rose-500' : 'text-slate-200 dark:text-slate-700'}`}>
                                {(inv.grandTotal - paid).toLocaleString()}
                              </td>
                            </tr>
                          );
                        }) : (paginatedData as typeof clientPayments).map((p) => (
                          <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                            <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400 text-left">{new Date(p.date).toLocaleDateString('fr-FR')}</td>
                            <td className="px-6 py-4 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase text-left">{p.invoiceNumber}</td>
                            <td className="px-6 py-4 text-xs font-medium text-slate-600 dark:text-slate-300 uppercase text-left">{p.method}</td>
                            <td className="px-6 py-4 text-right text-xs font-bold text-emerald-600">+{p.amount.toLocaleString()}</td>
                            <td className="px-6 py-4 text-center">
                              <button onClick={() => handleDelete(p.originalInvoiceId, p.id)} className="text-rose-400 hover:text-rose-600"><i className="fas fa-trash-alt"></i></button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination Footer */}
                  <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-white/5 rounded-[15px] flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0 shadow-sm">
                    <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-8">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">
                        Affichage de <span className="text-slate-800 dark:text-slate-200">
                          {currentData.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}
                        </span> à <span className="text-slate-800 dark:text-slate-200">
                          {Math.min(currentPage * itemsPerPage, currentData.length)}
                        </span> sur <span className="text-indigo-600 dark:text-indigo-400 font-black">{currentData.length}</span> documents
                      </div>

                      <div className="flex items-center space-x-2">
                        <label className="text-[9px] font-black uppercase text-slate-400 tracking-tighter whitespace-nowrap">Lignes par page:</label>
                        <select 
                          value={itemsPerPage}
                          onChange={handleItemsPerPageChange}
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
              )}

              {activeTab === 'Relevé' && (
                <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500">
                  <div className="bg-white dark:bg-white/5 shadow-xl border border-slate-200 dark:border-white/10 p-12 font-sans text-slate-900 dark:text-white mx-auto w-full max-w-4xl min-h-[600px] rounded-[15px]">
                    <div className="flex justify-between items-start mb-12 pb-8 border-b border-slate-100 dark:border-white/5">
                      <div>
                        <div className="mb-4">
                          <span className="text-3xl font-black text-orange-500 tracking-tighter italic">FACTURA<span className="text-indigo-500">PRO</span></span>
                        </div>
                        <p className="text-[10px] text-slate-800 dark:text-slate-400 font-bold uppercase">{company.name}</p>
                      </div>
                      <div className="text-right">
                        <h1 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-widest mb-1">Relevé de Compte</h1>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Client: {selectedClient.name}</p>
                      </div>
                    </div>

                    <table className="w-full mb-12 border-collapse">
                      <thead>
                        <tr className="bg-slate-900 dark:bg-slate-800 text-white">
                          <th className="py-3 px-4 text-left text-[9px] font-bold uppercase tracking-widest">Date</th>
                          <th className="py-3 px-4 text-left text-[9px] font-bold uppercase tracking-widest">Nature</th>
                          <th className="py-3 px-4 text-right text-[9px] font-bold uppercase tracking-widest">Débit</th>
                          <th className="py-3 px-4 text-right text-[9px] font-bold uppercase tracking-widest">Crédit</th>
                          <th className="py-3 px-4 text-right text-[9px] font-bold uppercase tracking-widest bg-slate-800 dark:bg-slate-700">Solde</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-white/5 border-b border-slate-200 dark:border-white/5">
                        {operationsWithBalance.map((op, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
                            <td className="py-3 px-4 text-[10px] text-slate-500 dark:text-slate-400 font-medium">{new Date(op.date).toLocaleDateString('fr-FR')}</td>
                            <td className="py-3 px-4 text-[10px] font-bold text-slate-700 dark:text-slate-200">{op.type} ({op.reference})</td>
                            <td className="py-3 px-4 text-right text-[10px] font-medium text-slate-800 dark:text-white">{op.debit > 0 ? op.debit.toLocaleString() : '-'}</td>
                            <td className="py-3 px-4 text-right text-[10px] font-medium text-emerald-600">{op.credit > 0 ? op.credit.toLocaleString() : '-'}</td>
                            <td className="py-3 px-4 text-right text-[10px] font-black text-slate-900 dark:text-white bg-slate-50/50 dark:bg-white/5">{op.balance.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-slate-50 dark:bg-white/5 font-black">
                          <td colSpan={2} className="py-4 px-4 text-[9px] uppercase tracking-widest">Totals</td>
                          <td className="py-4 px-4 text-right text-[11px]">{totalInvoiced.toLocaleString()}</td>
                          <td className="py-4 px-4 text-right text-[11px] text-emerald-600">{totalCollected.toLocaleString()}</td>
                          <td className="py-4 px-4 text-right text-[12px] text-rose-500 bg-rose-50 dark:bg-rose-500/10">{soldeDebiteur.toLocaleString()} MAD</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-300 dark:text-slate-700">
            <i className="fas fa-id-badge text-6xl mb-4 opacity-10"></i>
            <p className="text-xs font-bold uppercase tracking-widest">Sélectionnez un compte client</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default InvoiceList;
