
import React from 'react';
import { Product } from '../types';

interface ProductListProps {
  products: Product[];
  onAddProduct: () => void;
}

const ProductList: React.FC<ProductListProps> = ({ products, onAddProduct }) => {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-bold text-slate-800 dark:text-white">Catalogue Produits & Services</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">Gérez vos prestations et articles standardisés</p>
        </div>
        <button 
          onClick={onAddProduct}
          className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 transition-all flex items-center space-x-2"
        >
          <i className="fas fa-plus"></i>
          <span>Nouveau Produit</span>
        </button>
      </div>

      <div className="bg-white dark:bg-[#27354c] rounded-2xl shadow-sm border border-slate-200 dark:border-white/5 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 dark:bg-slate-900/40 border-b border-slate-200 dark:border-white/5">
            <tr>
              <th className="px-8 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Produit / Service</th>
              <th className="px-8 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Description</th>
              <th className="px-8 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Unité</th>
              <th className="px-8 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Prix HT (MAD)</th>
              <th className="px-8 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/5">
            {products.map((product) => (
              <tr key={product.id} className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
                <td className="px-8 py-5">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400">
                      <i className="fas fa-box text-sm"></i>
                    </div>
                    <span className="font-bold text-slate-800 dark:text-white">{product.name}</span>
                  </div>
                </td>
                <td className="px-8 py-5 text-sm text-slate-500 dark:text-slate-400 italic truncate max-w-xs">{product.description || 'Aucune description'}</td>
                <td className="px-8 py-5">
                  <span className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-bold uppercase">{product.unit}</span>
                </td>
                <td className="px-8 py-5 font-bold text-slate-700 dark:text-slate-200 text-right">{product.price.toLocaleString()} MAD</td>
                <td className="px-8 py-5 text-right">
                  <button className="text-slate-400 hover:text-indigo-600 transition-colors mr-3">
                    <i className="fas fa-edit"></i>
                  </button>
                  <button className="text-slate-400 hover:text-rose-600 transition-colors">
                    <i className="fas fa-trash-alt"></i>
                  </button>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan={5} className="py-20 text-center text-slate-400 italic">
                  Aucun produit dans le catalogue. Commencez par en ajouter un.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProductList;
