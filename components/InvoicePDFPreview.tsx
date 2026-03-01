
import React, { useState } from 'react';
import { Invoice, Company, Client } from '../types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const html2pdf: any;

interface InvoicePDFPreviewProps {
  invoices: Invoice[];
  company: Company;
  onClose: () => void;
  clients: Client[];
}

/**
 * html2canvas has its own CSS parser that does NOT support oklch().
 * html2pdf does NOT forward the `onclone` option to html2canvas.
 * Solution: temporarily replace oklch() in every live <style> tag, restore after.
 */
const patchStylesForPdf = (): (() => void) => {
  const originals: { el: HTMLStyleElement; text: string }[] = [];
  document.querySelectorAll<HTMLStyleElement>('style').forEach((styleEl) => {
    if (styleEl.textContent && /\b(?:oklch|oklab|lch|lab)\(/.test(styleEl.textContent)) {
      originals.push({ el: styleEl, text: styleEl.textContent });
      // Strip all modern color functions unsupported by html2canvas's CSS parser
      styleEl.textContent = styleEl.textContent.replace(/\b(?:oklch|oklab|lch|lab|color)\([^)]*\)/g, 'transparent');
    }
  });
  // Returns a restore function
  return () => originals.forEach(({ el, text }) => { el.textContent = text; });
};

const InvoicePDFPreview: React.FC<InvoicePDFPreviewProps> = ({ invoices, company, onClose, clients }) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsApp = async () => {
    if (invoices.length === 0) return;
    const element = document.querySelector('.printable-container') as HTMLElement;
    if (!element) return;
    setIsSharing(true);
    const firstInvoice = invoices[0];
    const firstClient = clients.find(c => c.id === firstInvoice.clientId);
    const phone = (firstClient?.gsm1 || firstClient?.phone || "").replace(/\s+/g, '');
    const filename = invoices.length === 1 ? `Facture_${invoices[0].number}.pdf` : `Export_Factures_${new Date().getTime()}.pdf`;

    const opt = {
      margin: 0,
      filename: filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: true, logging: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    const restoreStyles = patchStylesForPdf();
    try {
      const pdfBlob = await html2pdf().from(element).set(opt).output('blob');
      if (navigator.canShare && navigator.canShare({ files: [new File([pdfBlob], filename, { type: 'application/pdf' })] })) {
        const file = new File([pdfBlob], filename, { type: 'application/pdf' });
        await navigator.share({
          files: [file],
          title: 'Facture ' + (invoices.length === 1 ? invoices[0].number : ''),
          text: `Bonjour, veuillez trouver ci-joint votre facture de la part de ${company.name}.`,
        });
      } else {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(pdfBlob);
        link.download = filename;
        link.click();
        const message = encodeURIComponent(`Bonjour, voici votre facture "${filename}" en pièce jointe.`);
        window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
      }
    } catch (error) {
      console.error("Erreur partage WhatsApp:", error);
    } finally {
      restoreStyles();
      setIsSharing(false);
    }
  };

  const handleDownload = async () => {
    const element = document.querySelector('.printable-container') as HTMLElement;
    if (!element) return;
    setIsDownloading(true);
    const filename = invoices.length === 1 ? `Facture_${invoices[0].number}.pdf` : `Export_Factures_${new Date().getTime()}.pdf`;

    const opt = {
      margin: 0,
      filename: filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: true, logging: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    const restoreStyles = patchStylesForPdf();
    try {
      await html2pdf().from(element).set(opt).save();
    } catch (error) {
      console.error("Erreur PDF:", error);
    } finally {
      restoreStyles();
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md overflow-hidden print:overflow-visible font-sans text-slate-900 dark:text-white invoice-modal-wrapper">
      <div className="bg-white dark:bg-slate-900 w-full max-w-6xl h-[95vh] rounded-[15px] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 print:h-auto print:w-full print:shadow-none print:rounded-none print:static print:block relative border border-transparent dark:border-white/10">

        {/* Barre d'outils */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-white/10 flex items-center justify-between bg-white dark:bg-slate-800 shrink-0 print:hidden relative z-20">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-md">
              <i className="fas fa-file-pdf text-lg"></i>
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">Exportation PDF</h4>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{invoices.length} document(s)</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button type="button" onClick={handleWhatsApp} disabled={isSharing} className="px-4 py-2 bg-[#25D366] hover:bg-[#1ebd59] text-white rounded-lg font-black text-[10px] uppercase tracking-widest transition-all flex items-center disabled:opacity-50">
              <i className="fab fa-whatsapp mr-2"></i>
              Partager
            </button>
            <button type="button" onClick={handlePrint} className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-black text-[10px] uppercase tracking-widest transition-all flex items-center shadow-lg active:scale-95">
              <i className="fas fa-print mr-2"></i>
              Imprimer
            </button>
            <button type="button" onClick={handleDownload} disabled={isDownloading} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-black text-[10px] uppercase tracking-widest transition-all flex items-center disabled:opacity-50">
              <i className="fas fa-download mr-2"></i>
              Tél.
            </button>
            <button onClick={onClose} className="px-4 py-2 bg-slate-100 dark:bg-slate-700 rounded-lg font-bold text-[10px] uppercase tracking-widest text-slate-400 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
              Fermer
            </button>
          </div>
        </div>

        {/* Zone de prévisualisation */}
        <div className="flex-1 overflow-y-auto bg-slate-100 dark:bg-slate-950 p-6 custom-scrollbar print:p-0 print:bg-white print:overflow-visible">
          <div className="printable-container mx-auto print:w-full">
            {invoices.map((invoice, index) => {
              const client = clients.find(c => c.id === invoice.clientId);
              const totalQty = invoice.items.reduce((sum, item) => sum + item.quantity, 0);

              return (
                <div
                  key={invoice.id}
                  className={`printable-sheet mx-auto bg-white p-[10mm] shadow-xl print:shadow-none print:p-[10mm] print:m-0 w-[210mm] h-[297mm] flex flex-col relative overflow-hidden ${index < invoices.length - 1 ? 'mb-8' : ''}`}
                  style={{ pageBreakAfter: 'always', boxSizing: 'border-box' }}
                >

                  {/* Filigrane discret */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-[0.02] pointer-events-none z-0">
                    {company.logo ? (
                      <img src={company.logo} className="w-[80mm] h-[80mm] object-contain" alt="Watermark" />
                    ) : (
                      <div className="text-[60mm] font-black italic select-none">AP</div>
                    )}
                  </div>

                  <div className="relative z-10 flex flex-col h-full">

                    {/* Header: Logo & Client Box */}
                    <div className="flex justify-between items-start mb-6">
                      <div className="w-[220px]">
                        {company.logo ? (
                          <img src={company.logo} className="w-full object-contain" alt="Logo" />
                        ) : (
                          <div className="text-2xl font-black text-[#1a2b5e] italic leading-tight">APOLLO<br /><span className="text-[10px] tracking-[0.4em] font-normal not-italic opacity-60 uppercase">Eyewear</span></div>
                        )}
                      </div>

                      <div className="w-[320px] border border-slate-200 rounded-[10px] p-4 text-[#1a2b5e] bg-slate-50/40">
                        <h2 className="text-sm font-black mb-1.5 uppercase tracking-wide">Client: {client?.name}</h2>
                        <div className="text-[12px] space-y-1 font-medium opacity-95 leading-tight">
                          <p className="truncate">{client?.address || "Adresse non spécifiée"}</p>
                          <p>{client?.city && `${client.city}`}</p>
                          <p className="font-bold text-indigo-700">ICE: {client?.ice || "S/O"}</p>
                        </div>
                      </div>
                    </div>

                    {/* Titre Facture */}
                    <div className="mb-5 bg-[#f4f7fe]/60 p-3 rounded-lg border-l-[6px] border-indigo-600">
                      <h1 className="text-base font-black text-[#1a2b5e]">Facture N° : {invoice.number}</h1>
                      <div className="flex gap-x-6 text-[11px] font-bold text-[#1a2b5e]/80 mt-1">
                        <p>Ville: <span className="capitalize">{client?.city || company.city || "Oujda"}</span></p>
                        <p>Date: {new Date(invoice.date).toLocaleDateString('fr-FR')}</p>
                      </div>
                    </div>

                    {/* Tableau des produits */}
                    <div className="mb-6">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-[#f4f7fe] border-b-2 border-slate-200">
                            <th className="py-2.5 px-4 text-left text-[13px] font-black text-[#1a2b5e] uppercase tracking-wider">Description</th>
                            <th className="py-2.5 px-4 text-center text-[13px] font-black text-[#1a2b5e] w-28">P. Unit.</th>
                            <th className="py-2.5 px-4 text-center text-[13px] font-black text-[#1a2b5e] w-20">Qté</th>
                            <th className="py-2.5 px-4 text-right text-[13px] font-black text-[#1a2b5e] w-32">Total TTC</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {invoice.items.map((item, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/50">
                              <td className="py-2.5 px-4 text-[13px] font-semibold text-[#1a2b5e] uppercase">{item.productName}</td>
                              <td className="py-2.5 px-4 text-[13px] font-medium text-[#1a2b5e] text-center">{item.price.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</td>
                              <td className="py-2.5 px-4 text-[13px] font-bold text-[#1a2b5e] text-center">{item.quantity}</td>
                              <td className="py-2.5 px-4 text-[13px] font-black text-[#1a2b5e] text-right">{((item.price * item.quantity) * (1 - item.discount / 100)).toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Section Totaux */}
                    <div className="flex justify-between items-start pt-4 border-t-2 border-slate-100">
                      <div className="space-y-4 max-w-sm">
                        <div className="flex gap-6">
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Qté Totale</p>
                            <p className="text-sm font-black text-[#1a2b5e]">{totalQty}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Règlement</p>
                            <p className="text-sm font-black text-[#1a2b5e]">{invoice.paymentMethod || "Virement"}</p>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Remarques:</p>
                          <p className="text-[11px] text-slate-600 font-medium italic leading-relaxed">{invoice.notes || "Sans remarques particulières."}</p>
                        </div>

                        <div className="mt-4">
                          {company.signature ? (
                            <img src={company.signature} className="h-48 object-contain ml-4 mix-blend-multiply opacity-95" alt="Signature" />
                          ) : (
                            <div className="w-44 h-24 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-[10px] text-slate-300 uppercase font-black">Cachet & Signature</div>
                          )}
                        </div>
                      </div>

                      <div className="w-[300px]">
                        <table className="w-full border-collapse">
                          <tbody>
                            <tr>
                              <td className="py-2 px-4 text-[12px] font-bold text-[#1a2b5e] bg-slate-50 border-b border-white">Montant HT</td>
                              <td className="py-2 px-4 text-[12px] font-bold text-[#1a2b5e] bg-slate-50 border-b border-white text-right">{invoice.subtotal.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</td>
                            </tr>
                            {invoice.discountAmount > 0 && (
                              <tr>
                                <td className="py-2 px-4 text-[12px] font-bold text-rose-600 bg-rose-50/40 border-b border-white">Remise</td>
                                <td className="py-2 px-4 text-[12px] font-bold text-rose-600 bg-rose-50/40 border-b border-white text-right">-{invoice.discountAmount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</td>
                              </tr>
                            )}
                            <tr>
                              <td className="py-2 px-4 text-[12px] font-bold text-[#1a2b5e] bg-slate-50 border-b border-white">TVA (20%)</td>
                              <td className="py-2 px-4 text-[12px] font-bold text-[#1a2b5e] bg-slate-50 border-b border-white text-right">{invoice.tvaTotal.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</td>
                            </tr>
                            <tr>
                              <td className="py-4 px-4 text-base font-black text-white bg-[#1a2b5e] rounded-bl-xl uppercase tracking-tighter">Total TTC</td>
                              <td className="py-4 px-4 text-lg font-black text-white bg-[#1a2b5e] text-right text-nowrap rounded-br-xl">{invoice.grandTotal.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MAD</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="flex-1"></div>

                    {/* Footer */}
                    <div className="mt-auto pt-4 border-t-2 border-slate-200 text-center space-y-2 bg-white pb-4">
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">
                        {company.footer || "Propulsé par FacturaPro - www.facturapro.ma"}
                      </div>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        @media print {
          @page { 
            size: A4 portrait; 
            margin: 0; 
          }
          
          /* Forcer l'affichage des couleurs et fonds */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }

          /* Réinitialisation critique pour éviter les pages blanches */
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            height: auto !important;
            overflow: visible !important;
            background: white !important;
          }

          /* Cache tout SAUF ce qu'on veut imprimer */
          /* On utilise visibility au lieu de display:none sur le root car display:none sur parent tue l'impression des enfants */
          body > * {
            visibility: hidden !important;
          }

          .invoice-modal-wrapper, 
          .invoice-modal-wrapper * {
            visibility: visible !important;
          }

          .invoice-modal-wrapper {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            display: block !important;
            background: white !important;
            z-index: 999999 !important;
          }

          /* Masquer la barre d'outils et le fond assombri */
          .print\\:hidden, .bg-slate-900\\/80, .backdrop-blur-md {
            display: none !important;
            visibility: hidden !important;
          }

          .printable-container {
            width: 210mm !important;
            margin: 0 !important;
            padding: 0 !important;
            display: block !important;
          }

          .printable-sheet {
            width: 210mm !important;
            height: 297mm !important;
            min-height: 297mm !important;
            margin: 0 !important;
            padding: 10mm !important;
            box-sizing: border-box !important;
            page-break-after: always !important;
            display: flex !important;
            flex-direction: column !important;
            background: white !important;
            box-shadow: none !important;
            border: none !important;
            position: relative !important;
          }

          /* Fixer les images (logo/signature) */
          img {
            max-width: 100% !important;
            display: block !important;
            opacity: 1 !important;
          }
        }
      `}} />
    </div>
  );
};

export default InvoicePDFPreview;
