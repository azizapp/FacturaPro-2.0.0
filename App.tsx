
import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import InvoiceList from './components/InvoiceList';
import InvoiceForm from './components/InvoiceForm';
import ClientList from './components/ClientList';
import ClientForm from './components/ClientForm';
import ProductList from './components/ProductList';
import ProductForm from './components/ProductForm';
import Settings from './components/Settings';
import InvoiceTable from './components/InvoiceTable';
import PaymentPage from './components/PaymentPage';
import InvoiceDetailView from './components/InvoiceDetailView';
import PaymentModal from './components/PaymentModal';
import InvoicePDFPreview from './components/InvoicePDFPreview';
import ClientStatementPDFPreview from './components/ClientStatementPDFPreview';
import DeleteConfirmationModal from './components/DeleteConfirmationModal';
import Login from './components/Login';
import { useAppContext } from './context/AppContext';
import { InvoiceStatus } from './types';

const App: React.FC = () => {
  const {
    invoices, clients, products, company, isLoading, theme, user, toggleTheme, logout, refreshUserData,
    addInvoice, updateInvoice, deleteInvoice, addClient, updateClient, deleteClient,
    addProduct, updateProduct, deleteProduct, updateCompany, addPayment, deletePayment
  } = useAppContext();

  const [activeView, setActiveView] = useState<'dashboard' | 'invoices' | 'ledger' | 'clients' | 'products' | 'payments' | 'settings' | 'invoice-detail' | 'client-form' | 'invoice-form' | 'product-form'>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);

  const [showInvoicePdf, setShowInvoicePdf] = useState<string | string[] | null>(null);
  const [showClientStatementPdf, setShowClientStatementPdf] = useState<string | null>(null);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState<string | null>(null);

  const [itemToDelete, setItemToDelete] = useState<{ id: string, type: 'invoice' | 'client' | 'payment' | 'product', invoiceId?: string } | null>(null);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) setSidebarCollapsed(true);
      else setSidebarCollapsed(false);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleConfirmDelete = () => {
    if (!itemToDelete) return;
    const { id, type, invoiceId } = itemToDelete;

    if (type === 'invoice') {
      deleteInvoice(id);
      if (selectedInvoiceId === id && activeView === 'invoice-detail') setActiveView('invoices');
    } else if (type === 'client') {
      deleteClient(id);
    } else if (type === 'product') {
      deleteProduct(id);
    } else if (type === 'payment' && invoiceId) {
      deletePayment(invoiceId, id);
    }
    setItemToDelete(null);
  };

  const viewNames: Record<string, string> = {
    dashboard: 'Tableau de bord',
    invoices: 'Factures',
    ledger: 'Grand Livre',
    clients: 'Clients',
    products: 'Produits',
    payments: 'Paiements',
    settings: 'Paramètres',
    'invoice-detail': 'Détails Facture',
    'client-form': 'Formulaire Client',
    'invoice-form': 'Formulaire Facture',
    'product-form': 'Formulaire Produit'
  };

  const renderContent = () => {
    if (isLoading) return <div className="flex flex-col items-center justify-center h-full space-y-4">
      <div className="w-12 h-12 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin"></div>
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Chargement des données...</p>
    </div>;

    if (!company) return <div className="p-8 text-center text-slate-500">Configuration de l'entreprise non trouvée</div>;

    switch (activeView) {
      case 'dashboard': return <Dashboard invoices={invoices} clients={clients} />;
      case 'invoices':
        return (
          <div className="space-y-6">
            <div className="flex justify-end">
              <button onClick={() => { setSelectedInvoiceId(null); setActiveView('invoice-form'); }} className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-indigo-700 shadow-lg transition-all">
                <i className="fas fa-plus mr-2"></i> Nouvelle Facture
              </button>
            </div>
            <InvoiceTable invoices={invoices} clients={clients}
              onViewInvoice={(id) => { setSelectedInvoiceId(id); setActiveView('invoice-detail'); }}
              onAddPayment={(id) => setShowPaymentModal(id)}
              onDeleteInvoice={(id) => setItemToDelete({ id, type: 'invoice' })}
              onEditInvoice={(id) => { setSelectedInvoiceId(id); setActiveView('invoice-form'); }}
              onPdfInvoice={(idOrIds) => setShowInvoicePdf(idOrIds)}
            />
          </div>
        );
      case 'ledger':
        return <InvoiceList
          invoices={invoices}
          clients={clients}
          company={company}
          onExportStatement={(clientId) => setShowClientStatementPdf(clientId)}
          initialClientId={selectedClientId || undefined}
          onDeletePayment={(invId, payId) => setItemToDelete({ id: payId, type: 'payment', invoiceId: invId })}
        />;
      case 'clients': return <ClientList clients={clients} invoices={invoices} onAddClient={() => { setSelectedClientId(null); setActiveView('client-form'); }} onEditClient={(id) => { setSelectedClientId(id); setActiveView('client-form'); }} onDeleteClient={(id) => setItemToDelete({ id, type: 'client' })} onViewHistory={(id) => { setSelectedClientId(id); setActiveView('ledger'); }} />;
      case 'products': return <ProductList products={products} onAddProduct={() => { setSelectedProductId(null); setActiveView('product-form'); }} onEditProduct={(id) => { setSelectedProductId(id); setActiveView('product-form'); }} onDeleteProduct={(id) => setItemToDelete({ id, type: 'product' })} />;
      case 'payments': return <PaymentPage invoices={invoices} clients={clients} onPaymentAdded={addPayment} />;
      case 'settings': return <Settings company={company} onUpdate={updateCompany} />;
      case 'invoice-detail':
        const inv = invoices.find(i => i.id === selectedInvoiceId);
        const cli = clients.find(c => c.id === inv?.clientId);
        return inv && cli ? <InvoiceDetailView invoice={inv} client={cli} company={company} onBack={() => setActiveView('invoices')} onAddPayment={(id) => setShowPaymentModal(id)} onPdf={(id) => setShowInvoicePdf(id)} onDelete={(id) => setItemToDelete({ id, type: 'invoice' })} /> : <div className="p-8 text-center text-slate-500">Facture non trouvée</div>;
      case 'client-form': 
        return (
          <ClientForm 
            initialClient={clients.find(c => c.id === selectedClientId)} 
            onSubmit={(client) => {
              if (selectedClientId) updateClient(client);
              else addClient(client);
              setActiveView('clients');
            }} 
            onCancel={() => setActiveView('clients')} 
            companyEmail={company?.email} 
          />
        );
      case 'invoice-form': 
        return (
          <InvoiceForm 
            clients={clients} 
            products={products} 
            company={company} 
            invoices={invoices} 
            initialInvoice={invoices.find(i => i.id === selectedInvoiceId)} 
            onSubmit={(invoice) => {
              if (selectedInvoiceId) updateInvoice(invoice);
              else addInvoice(invoice);
              setActiveView('invoices');
            }} 
            onCancel={() => setActiveView('invoices')} 
          />
        );
      case 'product-form': 
        return (
          <ProductForm 
            initialProduct={products.find(p => p.id === selectedProductId)}
            onSubmit={(product) => {
              if (selectedProductId) updateProduct(product);
              else addProduct(product);
              setActiveView('products');
            }} 
            onCancel={() => setActiveView('products')} 
          />
        );
      default: return <Dashboard invoices={invoices} clients={clients} />;
    }
  };

  if (!user) {
    return <Login onLogin={refreshUserData} />;
  }

  return (
    <div className={`flex h-screen overflow-hidden font-sans text-[13px] ${theme === 'dark' ? 'bg-[#151723] text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      <div className={`${sidebarCollapsed ? 'w-20' : 'w-64'} ${theme === 'dark' ? 'bg-[#151723] border-r border-[#2a2d3d]' : 'bg-slate-900'} text-white flex flex-col shrink-0 transition-all duration-300 ease-in-out`}>
        <div className={`p-6 border-b ${theme === 'dark' ? 'border-[#2a2d3d]' : 'border-slate-800'} flex items-center space-x-3`}>
          {company?.app_icon ? (
            <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center bg-transparent shrink-0">
              <img src={company.app_icon} alt="App Icon" className="w-full h-full object-contain" />
            </div>
          ) : (
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shrink-0"><i className="fas fa-file-invoice text-xl"></i></div>
          )}
          {!sidebarCollapsed && <span className="text-xl font-black tracking-tighter italic">FACTURAPRO</span>}
        </div>
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
          <NavItem icon="fa-th-large" label="Tableau de bord" active={activeView === 'dashboard'} onClick={() => setActiveView('dashboard')} collapsed={sidebarCollapsed} />
          <NavItem icon="fa-file-invoice" label="Factures" active={activeView === 'invoices' || activeView === 'invoice-detail' || activeView === 'invoice-form'} onClick={() => setActiveView('invoices')} collapsed={sidebarCollapsed} />
          <NavItem icon="fa-book" label="Grand Livre" active={activeView === 'ledger'} onClick={() => setActiveView('ledger')} collapsed={sidebarCollapsed} />
          <NavItem icon="fa-users" label="Clients" active={activeView === 'clients' || activeView === 'client-form'} onClick={() => setActiveView('clients')} collapsed={sidebarCollapsed} />
          <NavItem icon="fa-boxes" label="Produits" active={activeView === 'products' || activeView === 'product-form'} onClick={() => setActiveView('products')} collapsed={sidebarCollapsed} />
          <NavItem icon="fa-money-bill-wave" label="Paiements" active={activeView === 'payments'} onClick={() => setActiveView('payments')} collapsed={sidebarCollapsed} />
        </nav>
        
        <div className={`p-4 border-t ${theme === 'dark' ? 'border-[#2a2d3d]' : 'border-slate-800'} space-y-2`}>
          <button onClick={() => setActiveView('settings')} className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'space-x-3 px-4'} py-3 rounded-[15px] text-sm font-medium transition-all ${activeView === 'settings' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : `text-slate-400 ${theme === 'dark' ? 'hover:bg-[#1c1f2e]' : 'hover:bg-slate-800'} hover:text-white`}`}>
            <i className="fas fa-cog w-5"></i>
            {!sidebarCollapsed && <span>Paramètres</span>}
          </button>
          <button onClick={toggleTheme} className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'space-x-3 px-4'} py-3 rounded-[15px] text-sm font-medium transition-all text-slate-400 ${theme === 'dark' ? 'hover:bg-[#1c1f2e]' : 'hover:bg-slate-800'} hover:text-white`}>
            <i className={`fas ${theme === 'dark' ? 'fa-sun text-amber-400' : 'fa-moon'} w-5`}></i>
            {!sidebarCollapsed && <span>{theme === 'dark' ? 'Mode Clair' : 'Mode Sombre'}</span>}
          </button>
          <button onClick={logout} className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'space-x-3 px-4'} py-3 rounded-[15px] text-sm font-medium transition-all text-rose-400 hover:bg-rose-500/10 hover:text-rose-500`} title="Déconnexion">
            <i className="fas fa-sign-out-alt w-5"></i>
            {!sidebarCollapsed && <span>Déconnexion</span>}
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className={`h-16 border-b flex items-center justify-between px-8 shrink-0 ${theme === 'dark' ? 'bg-[#151723] border-[#2a2d3d]' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center space-x-4">
            <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${theme === 'dark' ? 'bg-[#1c1f2e] text-slate-300 hover:bg-[#232738]' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}>
              <i className={`fas ${sidebarCollapsed ? 'fa-arrow-right' : 'fa-arrow-left'}`}></i>
            </button>
            <h2 className={`text-sm font-bold uppercase tracking-widest ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>{viewNames[activeView] || activeView}</h2>
          </div>
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setActiveView('settings')}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${activeView === 'settings' ? 'bg-indigo-600 text-white' : (theme === 'dark' ? 'bg-[#1c1f2e] text-slate-300 hover:bg-[#232738]' : 'bg-slate-100 text-slate-400 hover:bg-slate-200')}`}
              title="Paramètres"
            >
              <i className="fas fa-cog"></i>
            </button>
            <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-white shadow-lg">{company?.name.charAt(0) || 'P'}</div>
          </div>
        </header>

        <main className={`flex-1 overflow-y-auto p-8 custom-scrollbar ${theme === 'dark' ? 'bg-[#151723]' : 'bg-slate-50'}`}>{renderContent()}</main>
      </div>

      {showInvoicePdf && company && <InvoicePDFPreview invoices={invoices.filter(inv => Array.isArray(showInvoicePdf) ? showInvoicePdf.includes(inv.id) : inv.id === showInvoicePdf)} company={company} clients={clients} onClose={() => setShowInvoicePdf(null)} />}
      {showClientStatementPdf && company && <ClientStatementPDFPreview client={clients.find(c => c.id === showClientStatementPdf)!} invoices={invoices.filter(i => i.clientId === showClientStatementPdf)} company={company} onClose={() => setShowClientStatementPdf(null)} />}
      {showPaymentModal && <PaymentModal invoice={invoices.find(i => i.id === showPaymentModal)!} onClose={() => setShowPaymentModal(null)} onPaymentAdded={addPayment} />}
      <DeleteConfirmationModal
        isOpen={!!itemToDelete}
        title={itemToDelete?.type === 'payment' ? 'Supprimer le Règlement' : (itemToDelete?.type === 'invoice' ? 'Supprimer la Facture' : (itemToDelete?.type === 'product' ? 'Supprimer le Produit' : 'Supprimer le Client'))}
        message="Cette action est irréversible."
        onConfirm={handleConfirmDelete}
        onCancel={() => setItemToDelete(null)}
      />
    </div>
  );
};

const NavItem: React.FC<{ icon: string, label: string, active: boolean, onClick: () => void, collapsed: boolean }> = ({ icon, label, active, onClick, collapsed }) => (
  <button onClick={onClick} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-[15px] text-sm font-medium transition-all ${active ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-400 hover:bg-slate-800 dark:hover:bg-[#1c1f2e] hover:text-white'}`}>
    <i className={`fas ${icon} w-5`}></i>
    {!collapsed && <span>{label}</span>}
  </button>
);

export default App;
