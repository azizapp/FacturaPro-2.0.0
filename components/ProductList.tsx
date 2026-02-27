
import React, { useState } from 'react';
import { Product } from '../types';

interface ProductListProps {
  products: Product[];
  onAddProduct: () => void;
  onEditProduct: (id: string) => void;
  onDeleteProduct: (id: string) => void;
}
// هذا تعليق سطر واحد
const ProductList: React.FC<ProductListProps> = ({ products, onAddProduct, onEditProduct, onDeleteProduct }) => {
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const pageSizeOptions = [10, 20, 30, 50, 100, 200];

  // Reset pagination when itemsPerPage changes
  const handleItemsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  // Paginated Data
  const totalPages = Math.ceil(products.length / itemsPerPage);
  const paginatedProducts = products.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Catalogue Produits & Services</h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Gérez vos prestations et articles standardisés</p>
        </div>
        <button 
          onClick={onAddProduct}
          className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 transition-all flex items-center space-x-2"
        >
          <i className="fas fa-plus"></i>
          <span>Nouveau Produit</span>
        </button>
      </div>

      <div className="bg-white dark:bg-[#1b263b] rounded-[20px] shadow-xl border border-slate-200 dark:border-white/5 overflow-hidden flex flex-col">
        <div className="overflow-x-auto custom-scrollbar relative">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead className="sticky top-0 z-20 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-white/10 shadow-sm">
              <tr>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] w-[30%]">Produit / Service</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] w-[30%]">Description</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] text-center w-[10%]">Unité</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] text-right w-[15%]">Prix HT</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] text-center w-[15%]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {paginatedProducts.map((product) => (
                <tr key={product.id} className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/10">
                        <i className="fas fa-box text-[10px]"></i>
                      </div>
                      <span className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-tight truncate max-w-[180px]" title={product.name}>{product.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 italic truncate max-w-[200px]" title={product.description || 'Aucune description'}>
                      {product.description || 'Aucune description'}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[9px] font-black uppercase tracking-tighter">
                      {product.unit}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-xs font-black text-slate-800 dark:text-white whitespace-nowrap">
                      {product.price.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} <span className="text-[9px] text-slate-400 font-bold ml-0.5">MAD</span>
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center space-x-1">
                      <button onClick={() => onEditProduct(product.id)} className="w-8 h-8 rounded-lg text-slate-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:text-indigo-600 transition-all">
                        <i className="fas fa-edit text-xs"></i>
                      </button>
                      <button onClick={() => onDeleteProduct(product.id)} className="w-8 h-8 rounded-lg text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-600 transition-all">
                        <i className="fas fa-trash-alt text-xs"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-24 text-center text-slate-400 italic text-sm">
                    <div className="flex flex-col items-center justify-center opacity-30">
                      <i className="fas fa-boxes text-5xl mb-4"></i>
                      <p className="text-[10px] font-black uppercase tracking-widest">Aucun produit dans le catalogue</p>
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
                {products.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}
              </span> à <span className="text-slate-800 dark:text-slate-200">
                {Math.min(currentPage * itemsPerPage, products.length)}
              </span> sur <span className="text-indigo-600 dark:text-indigo-400 font-black">{products.length}</span> documents
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

export default ProductList;
