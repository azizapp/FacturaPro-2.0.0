
import React, { useState, useRef } from 'react';
import { Company } from '../types';

interface SettingsProps {
  company: Company;
  onUpdate: (company: Company) => void;
}

const Settings: React.FC<SettingsProps> = ({ company, onUpdate }) => {
  const [formData, setFormData] = useState<Company>(company);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const signatureInputRef = useRef<HTMLInputElement>(null);
  const appIconInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(formData);
    alert('Paramètres enregistrés !');
  };

  const handleFileChange = (field: keyof Company) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFormData({ ...formData, [field]: reader.result as string });
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="max-w-5xl space-y-8 animate-in fade-in duration-500 pb-20">
      <h3 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight uppercase">Configuration</h3>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-8">
            <div className="bg-white dark:bg-[#1b263b] p-8 rounded-[15px] shadow-sm border border-slate-200 dark:border-white/5 space-y-8">
              <h4 className="text-[11px] font-black text-indigo-600 dark:text-indigo-400 uppercase border-b border-slate-100 dark:border-white/5 pb-2">Logo Entreprise</h4>
              <div onClick={() => logoInputRef.current?.click()} className="h-32 rounded-[12px] border-2 border-dashed border-slate-200 dark:border-white/10 flex items-center justify-center cursor-pointer bg-slate-50 dark:bg-slate-900/30 overflow-hidden">
                {formData.logo ? <img src={formData.logo} className="h-full object-contain" alt="Logo preview" /> : <span className="text-xs text-slate-400">Cliquez pour ajouter un logo</span>}
                <input type="file" ref={logoInputRef} className="hidden" onChange={handleFileChange('logo')} accept="image/*" />
              </div>
            </div>

            <div className="bg-white dark:bg-[#1b263b] p-8 rounded-[15px] shadow-sm border border-slate-200 dark:border-white/5 space-y-8">
              <h4 className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 uppercase border-b border-slate-100 dark:border-white/5 pb-2">Signature / Cachet</h4>
              <div onClick={() => signatureInputRef.current?.click()} className="h-32 rounded-[12px] border-2 border-dashed border-slate-200 dark:border-white/10 flex items-center justify-center cursor-pointer bg-slate-50 dark:bg-slate-900/30 overflow-hidden">
                {formData.signature ? <img src={formData.signature} className="h-full object-contain mix-blend-multiply" alt="Signature preview" /> : <span className="text-xs text-slate-400">Cliquez pour ajouter une signature</span>}
                <input type="file" ref={signatureInputRef} className="hidden" onChange={handleFileChange('signature')} accept="image/*" />
              </div>
              <p className="text-[9px] text-slate-400 font-medium italic text-center">Utilisez de préférence une image sur fond blanc (PNG/JPG).</p>
            </div>

            <div className="bg-white dark:bg-[#1b263b] p-8 rounded-[15px] shadow-sm border border-slate-200 dark:border-white/5 space-y-8">
              <h4 className="text-[11px] font-black text-blue-500 dark:text-blue-400 uppercase border-b border-slate-100 dark:border-white/5 pb-2">Icône de l'application</h4>
              <div onClick={() => appIconInputRef.current?.click()} className="h-32 rounded-[12px] border-2 border-dashed border-slate-200 dark:border-white/10 flex items-center justify-center cursor-pointer bg-slate-50 dark:bg-slate-900/30 overflow-hidden">
                {formData.app_icon ? <img src={formData.app_icon} className="h-full object-contain" alt="App Icon preview" /> : <span className="text-xs text-slate-400">Cliquez pour ajouter une icône</span>}
                <input type="file" ref={appIconInputRef} className="hidden" onChange={handleFileChange('app_icon')} accept="image/*" />
              </div>
              <p className="text-[9px] text-slate-400 font-medium italic text-center">Utilisez de préférence une image carrée (PNG/JPG).</p>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white dark:bg-[#1b263b] p-8 rounded-[15px] shadow-sm border border-slate-200 dark:border-white/5 space-y-8">
               <h4 className="text-[11px] font-black text-orange-500 dark:text-orange-400 uppercase border-b border-slate-100 dark:border-white/5 pb-2">Informations Générales</h4>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="md:col-span-2 space-y-2">
                   <label className="text-[10px] font-bold text-slate-400 uppercase">Raison Sociale</label>
                   <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-white/5 rounded-[8px] px-5 py-4 text-sm font-bold outline-none text-slate-800 dark:text-white" />
                 </div>
                 <div className="space-y-2">
                   <label className="text-[10px] font-bold text-slate-400 uppercase">ICE</label>
                   <input type="text" value={formData.siret} onChange={(e) => setFormData({...formData, siret: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-white/5 rounded-[8px] px-5 py-4 text-sm font-bold outline-none text-slate-800 dark:text-white" />
                 </div>
                 <div className="space-y-2">
                   <label className="text-[10px] font-bold text-slate-400 uppercase">E-mail Professionnel</label>
                   <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-white/5 rounded-[8px] px-5 py-4 text-sm font-bold outline-none text-slate-800 dark:text-white" />
                 </div>
                 <div className="space-y-2">
                   <label className="text-[10px] font-bold text-slate-400 uppercase">Téléphone</label>
                   <input type="text" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-white/5 rounded-[8px] px-5 py-4 text-sm font-bold outline-none text-slate-800 dark:text-white" />
                 </div>
                 <div className="space-y-2">
                   <label className="text-[10px] font-bold text-slate-400 uppercase">Ville</label>
                   <input type="text" value={formData.city || ''} onChange={(e) => setFormData({...formData, city: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-white/5 rounded-[8px] px-5 py-4 text-sm font-bold outline-none text-slate-800 dark:text-white" />
                 </div>
               </div>
            </div>

            <div className="bg-white dark:bg-[#1b263b] p-8 rounded-[15px] shadow-sm border border-slate-200 dark:border-white/5 space-y-6">
              <h4 className="text-[11px] font-black text-indigo-600 dark:text-indigo-400 uppercase border-b border-slate-100 dark:border-white/5 pb-2">Numérotation des Factures</h4>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Préfixe</label>
                  <input type="text" value={formData.invoice_prefix || ''} onChange={(e) => setFormData({...formData, invoice_prefix: e.target.value})} placeholder="Ex: FAC-" className="w-full bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-white/5 rounded-[8px] px-5 py-4 text-sm font-bold text-indigo-600 dark:text-indigo-400 outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Commencer au n°</label>
                  <input type="number" value={formData.invoice_start_number || 1} onChange={(e) => setFormData({...formData, invoice_start_number: parseInt(e.target.value) || 1})} className="w-full bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-white/5 rounded-[8px] px-5 py-4 text-sm font-bold outline-none text-slate-800 dark:text-white" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-[#1b263b] p-8 rounded-[15px] shadow-sm border border-slate-200 dark:border-white/5 space-y-6">
              <h4 className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 uppercase border-b border-slate-100 dark:border-white/5 pb-2">Personnalisation Document</h4>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Pied de page global</label>
                <textarea 
                  value={formData.footer || ''} 
                  onChange={(e) => setFormData({...formData, footer: e.target.value})}
                  placeholder="Texte qui s'affichera en bas de vos factures..."
                  className="w-full bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-white/5 rounded-[8px] px-5 py-4 text-sm font-bold outline-none min-h-[100px] resize-none text-slate-800 dark:text-slate-200"
                />
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-end pt-8">
          <button type="submit" className="bg-indigo-600 text-white px-12 py-4 rounded-[12px] text-[11px] font-black uppercase shadow-2xl hover:bg-indigo-700 transition-all hover:-translate-y-1">
            Enregistrer les modifications
          </button>
        </div>
      </form>
    </div>
  );
};

export default Settings;
