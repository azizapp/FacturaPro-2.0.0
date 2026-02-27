
import React, { useState, useMemo, useCallback } from 'react';
import { Invoice, Client, InvoiceStatus } from '../types';

interface InvoiceTableProps {
  invoices: Invoice[];
  clients: Client[];
  onViewInvoice: (id: string) => void;
  onAddPayment: (id: string) => void;
  onDeleteInvoice: (id: string) => void;
  onEditInvoice: (id: string) => void;
  onPdfInvoice: (id: string) => void;
}

type SortField = 'date' | 'number' | 'client' | 'status' | 'total';
type SortDirection = 'asc' | 'desc';

const InvoiceTable: React.FC<InvoiceTableProps> = ({ 
  invoices, 
  clients, 
  onViewInvoice, 
  onAddPayment, 
  onDeleteInvoice, 
  onEditInvoice, 
  onPdfInvoice 
}) => {
  const [sortField, setSortField] = useState<SortField>('number');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  
  // Pagination State - Updated default items per page to 20
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const pageSizeOptions = [10, 20, 30, 50, 100, 200];

  const getClientName = useCallback((clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    return client ? client.name : 'Client inconnu';
  }, [clients]);

  const getDateRange = (filter: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let start = new Date(today);
    let end = new Date(today);
    end.setHours(23, 59, 59, 999);

    switch (filter) {
      case 'today': break;
      case 'week':
        start.setDate(today.getDate() - today.getDay());
        end.setDate(today.getDate() + (6 - today.getDay()));
        break;
      case 'month':
        start.setDate(1);
        end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        break;
      case 'year':
        start = new Date(today.getFullYear(), 0, 1);
        end = new Date(today.getFullYear(), 11, 31);
        break;
      default: return null;
    }
    return { start, end };
  };

  const filteredAndSortedInvoices = useMemo(() => {
    let filtered = [...invoices];

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(inv => {
        const clientName = getClientName(inv.clientId).toLowerCase();
        const invoiceNumber = String(inv.number).toLowerCase();
        return clientName.includes(term) || invoiceNumber.includes(term);
      });
    }

    if (selectedStatus) {
      filtered = filtered.filter(inv => inv.status === selectedStatus);
    }

    if (dateFilter && dateFilter !== 'custom') {
      const range = getDateRange(dateFilter);
      if (range) {
        filtered = filtered.filter(inv => {
          const invDate = new Date(inv.date);
          return invDate >= range.start && invDate <= range.end;
        });
      }
    } else if (dateFilter === 'custom') {
      if (dateFrom) filtered = filtered.filter(inv => new Date(inv.date) >= new Date(dateFrom));
      if (dateTo) {
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999);
        filtered = filtered.filter(inv => new Date(inv.date) <= toDate);
      }
    }

    return filtered.sort((a, b) => {
      let aValue: string | number | number, bValue: string | number | number;
      switch (sortField) {
        case 'date': aValue = new Date(a.date).getTime(); bValue = new Date(b.date).getTime(); break;
        case 'number': aValue = a.number; bValue = b.number; break;
        case 'client': aValue = getClientName(a.clientId).toLowerCase(); bValue = getClientName(b.clientId).toLowerCase(); break;
        case 'status': aValue = a.status.toLowerCase(); bValue = b.status.toLowerCase(); break;
        case 'total': aValue = a.grandTotal; bValue = b.grandTotal; break;
        default: return 0;
      }
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [invoices, sortField, sortDirection, selectedStatus, searchTerm, dateFilter, dateFrom, dateTo, getClientName]);

  // Reset pagination when filters or page size change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedStatus(e.target.value);
    setCurrentPage(1);
  };

  const handleDateFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setDateFilter(e.target.value);
    setCurrentPage(1);
  };

  const handleDateFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDateFrom(e.target.value);
    setCurrentPage(1);
  };

  const handleDateToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDateTo(e.target.value);
    setCurrentPage(1);
  };

  const handleItemsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedStatus('');
    setDateFilter('');
    setCurrentPage(1);
  };

  // Paginated Data
  const totalPages = Math.ceil(filteredAndSortedInvoices.length / itemsPerPage);
  const paginatedInvoices = filteredAndSortedInvoices.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
    setCurrentPage(1);
  };

  const getStatusStyle = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes('brouillon')) return { color: '#F54927', backgroundColor: 'rgba(245, 73, 39, 0.1)', border: '1px solid rgba(245, 73, 39, 0.2)' };
    if (s.includes('partielle')) return { color: '#EAB308', backgroundColor: 'rgba(234, 179, 8, 0.1)', border: '1px solid rgba(234, 179, 8, 0.2)' };
    if (s.includes('payée')) return { color: '#10B981', backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)' };
    return { color: '#64748b', backgroundColor: 'rgba(100, 116, 139, 0.1)', border: '1px solid rgba(100, 116, 139, 0.2)' };
  };

  return (
    <div className="bg-white dark:bg-[#1b263b] rounded-[20px] shadow-xl overflow-hidden border border-slate-200 dark:border-white/5 flex flex-col">
      
      {/* Search & Filters Toolbar */}
      <div className="p-4 border-b border-slate-100 dark:border-white/5 bg-slate-50/30 dark:bg-slate-900/40 flex flex-wrap items-center justify-between gap-4 shrink-0">
        <div className="relative flex-1 min-w-[280px]">
          <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Rechercher une facture ou un client..."
            className="w-full pl-11 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all dark:text-white"
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2.5 rounded-xl text-sm font-bold flex items-center space-x-2 transition-all ${
              showFilters || selectedStatus || dateFilter 
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/10'
            }`}
          >
            <i className="fas fa-filter text-xs"></i>
            <span>Filtres</span>
          </button>
          
          {(searchTerm || selectedStatus || dateFilter) && (
            <button
              onClick={handleResetFilters}
              className="p-2.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-colors"
              title="Réinitialiser"
            >
              <i className="fas fa-times-circle"></i>
            </button>
          )}
        </div>
      </div>

      {/* Advanced Filters Overlay */}
      {showFilters && (
        <div className="p-4 bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-white/5 grid grid-cols-1 md:grid-cols-3 gap-4 animate-in slide-in-from-top-2 duration-200 shrink-0">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Statut</label>
            <select
              value={selectedStatus}
              onChange={handleStatusChange}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/5 rounded-lg text-xs font-bold outline-none dark:text-white"
            >
              <option value="">Tous les statuts</option>
              {Object.values(InvoiceStatus).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Période</label>
            <select
              value={dateFilter}
              onChange={handleDateFilterChange}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/5 rounded-lg text-xs font-bold outline-none dark:text-white"
            >
              <option value="">Toutes les dates</option>
              <option value="today">Aujourd'hui</option>
              <option value="week">Cette semaine</option>
              <option value="month">Ce mois</option>
              <option value="year">Cette année</option>
              <option value="custom">Personnalisé...</option>
            </select>
          </div>
          {dateFilter === 'custom' && (
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Du</label>
                <input type="date" value={dateFrom} onChange={handleDateFromChange} className="w-full px-2 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/5 rounded-lg text-[10px] font-bold dark:text-white" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Au</label>
                <input type="date" value={dateTo} onChange={handleDateToChange} className="w-full px-2 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/5 rounded-lg text-[10px] font-bold dark:text-white" />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Table Container with Internal Scroll */}
      <div className="flex-1 overflow-auto custom-scrollbar relative">
        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead className="sticky top-0 z-30 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-white/10 shadow-sm">
            <tr>
              <th className="w-[12%] px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest cursor-pointer group" onClick={() => handleSort('date')}>
                <div className="flex items-center space-x-2">
                  <span>Date</span>
                  <i className={`fas ${sortField === 'date' ? (sortDirection === 'asc' ? 'fa-sort-up' : 'fa-sort-down') : 'fa-sort opacity-0 group-hover:opacity-40'} transition-opacity`}></i>
                </div>
              </th>
              <th className="w-[14%] px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest cursor-pointer group" onClick={() => handleSort('number')}>
                <div className="flex items-center space-x-2">
                  <span>Numéro</span>
                  <i className={`fas ${sortField === 'number' ? (sortDirection === 'asc' ? 'fa-sort-up' : 'fa-sort-down') : 'fa-sort opacity-0 group-hover:opacity-40'} transition-opacity`}></i>
                </div>
              </th>
              <th className="w-[28%] px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest cursor-pointer group" onClick={() => handleSort('client')}>
                <div className="flex items-center space-x-2">
                  <span>Client</span>
                  <i className={`fas ${sortField === 'client' ? (sortDirection === 'asc' ? 'fa-sort-up' : 'fa-sort-down') : 'fa-sort opacity-0 group-hover:opacity-40'} transition-opacity`}></i>
                </div>
              </th>
              <th className="w-[12%] px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest cursor-pointer group" onClick={() => handleSort('status')}>
                <div className="flex items-center space-x-2">
                  <span>Statut</span>
                  <i className={`fas ${sortField === 'status' ? (sortDirection === 'asc' ? 'fa-sort-up' : 'fa-sort-down') : 'fa-sort opacity-0 group-hover:opacity-40'} transition-opacity`}></i>
                </div>
              </th>
              <th className="w-[14%] px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right cursor-pointer group" onClick={() => handleSort('total')}>
                <div className="flex items-center justify-end space-x-2">
                  <span>Total TTC</span>
                  <i className={`fas ${sortField === 'total' ? (sortDirection === 'asc' ? 'fa-sort-up' : 'fa-sort-down') : 'fa-sort opacity-0 group-hover:opacity-40'} transition-opacity`}></i>
                </div>
              </th>
              <th className="w-[20%] px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/5">
            {paginatedInvoices.length > 0 ? paginatedInvoices.map((invoice) => (
              <tr key={invoice.id} className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors group">
                <td className="px-6 py-4 text-xs font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">
                  {new Date(invoice.date).toLocaleDateString('fr-FR')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-[11px] font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2.5 py-1.5 rounded-lg border border-indigo-100 dark:border-indigo-500/10">
                    {invoice.number}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase truncate max-w-[250px]" title={getClientName(invoice.clientId)}>
                    {getClientName(invoice.clientId)}
                  </p>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span 
                    className="text-[9px] font-black uppercase px-2.5 py-1.5 rounded-full inline-block text-center min-w-[80px]"
                    style={getStatusStyle(invoice.status)}
                  >
                    {invoice.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right font-black text-slate-800 dark:text-white text-xs whitespace-nowrap">
                  {invoice.grandTotal.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} <span className="text-[9px] text-slate-400 font-bold ml-1 uppercase">MAD</span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-center space-x-1">
                    <button 
                      onClick={() => onViewInvoice(invoice.id)} 
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:text-indigo-600 transition-all"
                      title="Voir Détails"
                    >
                      <i className="far fa-eye text-xs"></i>
                    </button>
                    <button 
                      onClick={() => onEditInvoice(invoice.id)} 
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:text-blue-600 transition-all"
                      title="Modifier la Facture"
                    >
                      <i className="fas fa-edit text-xs"></i>
                    </button>
                    <button 
                      onClick={() => onAddPayment(invoice.id)} 
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 hover:text-emerald-600 transition-all"
                      title="Encaisser"
                    >
                      <i className="fas fa-money-bill-wave text-xs"></i>
                    </button>
                    <button 
                      onClick={() => onPdfInvoice(invoice.id)} 
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-amber-50 dark:hover:bg-amber-500/10 hover:text-amber-600 transition-all"
                      title="Exporter PDF"
                    >
                      <i className="fas fa-file-pdf text-xs"></i>
                    </button>
                    <button 
                      onClick={() => onDeleteInvoice(invoice.id)} 
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-600 transition-all"
                      title="Supprimer"
                    >
                      <i className="fas fa-trash-alt text-xs"></i>
                    </button>
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={6} className="py-24 text-center text-slate-400 italic text-sm">
                  <div className="flex flex-col items-center justify-center opacity-30">
                    <i className="fas fa-folder-open text-5xl mb-4"></i>
                    <p className="text-[10px] font-black uppercase tracking-widest">Aucune facture à afficher</p>
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
              {filteredAndSortedInvoices.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}
            </span> à <span className="text-slate-800 dark:text-slate-200">
              {Math.min(currentPage * itemsPerPage, filteredAndSortedInvoices.length)}
            </span> sur <span className="text-indigo-600 dark:text-indigo-400 font-black">{filteredAndSortedInvoices.length}</span> documents
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
  );
};

export default InvoiceTable;
