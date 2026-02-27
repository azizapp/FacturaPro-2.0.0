
import React, { useState } from 'react';
import { Product } from '../types';

interface ProductFormProps {
  initialProduct?: Product;
  onSubmit: (product: Product) => void;
  onCancel: () => void;
}

const ProductForm: React.FC<ProductFormProps> = ({ initialProduct, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: initialProduct?.name || '',
    reference: '',
    category: 'Montures',
    description: initialProduct?.description || '',
    price: initialProduct?.price || 0,
    unit: initialProduct?.unit || 'Unité',
    tvaRate: 20
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return alert('Le nom du produit est requis.');

    const newProduct: Product = {
      id: initialProduct?.id || crypto.randomUUID(),
      name: formData.name,
      description: formData.description,
      price: formData.price,
      unit: formData.unit,
    };

    onSubmit(newProduct);
  };

  const categories = ['Montures', 'Verres', 'Lentilles', 'Accessoires', 'Services', 'Solaire'];
  const units = ['Unité', 'Paire', 'Boîte', 'Heure', 'Forfait'];

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-500">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <button 
            onClick={onCancel} 
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white dark:bg-[#1b263b] border border-slate-200 dark:border-white/10 text-slate-400 hover:text-indigo-600 hover:border-indigo-200 shadow-sm transition-all"
          >
            <i className="fas fa-arrow-left"></i>
          </button>
          <div>
            <h3 className="text-xl font-black text-slate-800 dark:text-white tracking-tight uppercase">Nouveau Produit / Service</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Ajoutez un article à votre catalogue pour facturer plus rapidement.</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-12">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white dark:bg-[#1b263b] p-10 rounded-[20px] shadow-xl border border-slate-200 dark:border-white/5 space-y-8">
            <div className="space-y-6">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400 border-b border-indigo-50 dark:border-white/5 pb-2">Informations Générales</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Nom de l'article *</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Ray-Ban Aviator Classic"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-white/10 rounded-xl px-5 py-3.5 text-xs font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all dark:text-white uppercase tracking-tight"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Référence / SKU</label>
                  <input 
                    type="text" 
                    placeholder="RB-3025"
                    value={formData.reference}
                    onChange={(e) => setFormData({...formData, reference: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-white/10 rounded-xl px-5 py-3.5 text-xs font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all dark:text-slate-200"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Catégorie</label>
                  <select 
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-white/10 rounded-xl px-5 py-3.5 text-xs font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all appearance-none dark:text-slate-200"
                  >
                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Description détaillée</label>
                  <textarea 
                    rows={4}
                    placeholder="Spécificités techniques, coloris, options..."
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-white/10 rounded-xl px-5 py-4 text-xs font-medium focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all resize-none dark:text-slate-200 leading-relaxed"
                  ></textarea>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-white dark:bg-[#1b263b] p-10 rounded-[20px] shadow-xl border border-slate-200 dark:border-white/5 space-y-8">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-500 dark:text-orange-400 border-b border-orange-50 dark:border-white/5 pb-2">Tarification</h4>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Prix de vente HT</label>
                <div className="relative">
                  <input 
                    type="number" 
                    placeholder="0.00"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value) || 0})}
                    className="w-full bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-white/10 rounded-xl px-5 py-5 text-2xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all font-black text-slate-800 dark:text-white"
                  />
                  <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 uppercase tracking-widest">MAD</span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Unité</label>
                <select 
                  value={formData.unit}
                  onChange={(e) => setFormData({...formData, unit: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-white/10 rounded-xl px-5 py-3.5 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 dark:text-slate-200"
                >
                  {units.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <button 
              type="submit" 
              className="w-full bg-indigo-600 text-white py-4 rounded-xl text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all flex items-center justify-center space-x-3 active:scale-95"
            >
              <i className="fas fa-save text-sm"></i>
              <span>Enregistrer</span>
            </button>
            <button 
              type="button"
              onClick={onCancel}
              className="w-full py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-slate-600 transition-colors"
            >
              Annuler
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ProductForm;
