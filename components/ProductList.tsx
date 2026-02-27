
import React from 'react';
import { Product } from '../types';

interface ProductListProps {
  products: Product[];
  onAddProduct: () => void;
  onEditProduct: (id: string) => void;
  onDeleteProduct: (id: string) => void;
}

const ProductList: React.FC<ProductListProps> = ({ products, onAddProduct, onEditProduct, onDeleteProduct }) => {
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

      <div className="bg-white dark:bg-[#27354c] rounded-[20px] shadow-xl border border-slate-200 dark:border-white/5 overflow-hidden flex flex-col h-[calc(100vh-250px)]">
        <div className="flex-1 overflow-auto custom-scrollbar relative">
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
              {products.map((product) => (
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
      </div>
    </div>
  );
};

export default ProductList;
