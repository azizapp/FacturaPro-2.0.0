
import React, { useState } from 'react';
import { Client, Invoice } from '../types';

interface ClientListProps {
  clients: Client[];
  invoices: Invoice[];
  onEditClient: (id: string) => void;
  onDeleteClient: (id: string) => void;
  onViewHistory: (id: string) => void;
  onAddClient: () => void;
}
// هذا تعليق سطر واحد
const ClientList: React.FC<ClientListProps> = ({ clients, invoices, onEditClient, onDeleteClient, onViewHistory, onAddClient }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const getClientStats = (clientId: string) => {
    const clientInvoices = invoices.filter(inv => inv.clientId === clientId);
    const totalTransactions = clientInvoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
    const totalPaid = clientInvoices.reduce((sum, inv) => {
      const paymentsSum = (inv.payments || []).reduce((pSum, p) => pSum + p.amount, 0);
      return sum + paymentsSum;
    }, 0);
    return {
      totalTransactions,
      remaining: totalTransactions - totalPaid,
      invoiceCount: clientInvoices.length
    };
  };

  const filteredClients = clients.filter(client => {
    const stats = getClientStats(client.id);
    const hasActivity = stats.invoiceCount > 0;
    if (!hasActivity && !searchTerm) return false;
    return client.name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const pageSizeOptions = [10, 20, 30, 50, 100, 200];

  // Reset pagination when search changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleItemsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  // Paginated Data
  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);
  const paginatedClients = filteredClients.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-white uppercase tracking-tight">Clients Actifs</h3>
        </div>
        <button 
          onClick={onAddClient}
          className="bg-indigo-600 text-white px-5 py-2.5 rounded-[10px] text-[11px] font-bold uppercase hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20"
        >
          Nouveau Client
        </button>
      </div>

      <div className="relative max-w-md">
        <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 text-xs"></i>
        <input 
          type="text" 
          placeholder="Rechercher..." 
          value={searchTerm}
          onChange={handleSearchChange}
          className="w-full pl-10 pr-4 py-3 bg-white dark:bg-[#1b263b] border border-slate-200 dark:border-white/5 rounded-[10px] text-xs outline-none text-slate-700 dark:text-slate-200"
        />
      </div>

      <div className="bg-white dark:bg-[#1b263b] rounded-[15px] shadow-sm border border-slate-200 dark:border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-900/40 border-b border-slate-100 dark:border-white/5">
              <tr>
                <th className="px-6 py-5 text-[10px] font-bold uppercase text-slate-400">Raison Sociale</th>
                <th className="px-6 py-5 text-[10px] font-bold uppercase text-slate-400 text-right">CA Total</th>
                <th className="px-6 py-5 text-[10px] font-bold uppercase text-slate-400 text-right">Reste</th>
                <th className="px-6 py-5 text-[10px] font-bold uppercase text-slate-400 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-white/5">
              {paginatedClients.map((client) => {
                const stats = getClientStats(client.id);
                return (
                  <tr key={client.id} className="hover:bg-slate-50/30 dark:hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-[8px] flex items-center justify-center font-bold text-xs bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20">
                          {client.name.charAt(0)}
                        </div>
                        <span className="font-bold text-slate-700 dark:text-slate-200 uppercase text-[11px]">{client.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-bold text-xs text-slate-800 dark:text-white">{stats.totalTransactions.toLocaleString()} MAD</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`font-bold text-xs ${stats.remaining > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                        {stats.remaining.toLocaleString()} MAD
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center space-x-1">
                        <button onClick={() => onViewHistory(client.id)} className="w-8 h-8 rounded-[6px] text-slate-400 hover:bg-orange-50 dark:hover:bg-orange-500/10 hover:text-orange-600 transition-all"><i className="fas fa-history text-xs"></i></button>
                        <button onClick={() => onEditClient(client.id)} className="w-8 h-8 rounded-[6px] text-slate-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:text-indigo-600 transition-all"><i className="fas fa-edit text-xs"></i></button>
                        <button onClick={() => onDeleteClient(client.id)} className="w-8 h-8 rounded-[6px] text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-600 transition-all"><i className="fas fa-trash-alt text-xs"></i></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-100 dark:border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-8">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">
              Affichage de <span className="text-slate-800 dark:text-slate-200">
                {filteredClients.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}
              </span> à <span className="text-slate-800 dark:text-slate-200">
                {Math.min(currentPage * itemsPerPage, filteredClients.length)}
              </span> sur <span className="text-indigo-600 dark:text-indigo-400 font-black">{filteredClients.length}</span> documents
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
    </div>
  );
};

export default ClientList;
