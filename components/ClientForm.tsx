
import React, { useState, useEffect, useCallback } from 'react';
import { Client } from '../types';

interface ClientFormProps {
  initialClient?: Client;
  onSubmit: (client: Client) => void;
  onCancel: () => void;
  companyEmail?: string;
}

const InputWrapper: React.FC<{ label: string, children: React.ReactNode }> = ({ label, children }) => (
  <div className="space-y-2">
    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</label>
    {children}
  </div>
);

const ClientForm: React.FC<ClientFormProps> = ({ initialClient, onSubmit, onCancel, companyEmail }) => {
  // Direct initialization from initialClient if provided, otherwise defaults
  const [formData, setFormData] = useState<Client>(() => {
    if (initialClient) return { ...initialClient };

    return {
      id: crypto.randomUUID(),
      name: '',
      manager: '',
      location: '',
      city: '',
      region: '',
      address: '',
      gsm1: '',
      gsm2: '',
      phone: '',
      email: '',
      gamme: '',
      user_email: localStorage.getItem('user_email_preference') || companyEmail || '',
      is_blocked: false,
      balance: 0,
      ice: '',
      created_at: new Date().toISOString()
    };
  });

  // Keep state in sync if initialClient changes externally
  useEffect(() => {
    if (initialClient) {
      setFormData({ ...initialClient });
    }
  }, [initialClient]);

  const handleInputChange = useCallback((field: keyof Client, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    if (field === 'user_email') {
      localStorage.setItem('user_email_preference', value);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return alert('Le nom du client est requis.');

    // Ensure we are passing the full object
    onSubmit(formData);
  };

  const renderInput = (field: keyof Client, value: any, props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input
      {...props}
      value={value || ''}
      onChange={(e) => handleInputChange(field, e.target.value)}
      className={`w-full bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500/10 outline-none dark:text-slate-200 ${props.className || ''}`}
    />
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-500">
      <div className="flex items-center space-x-4 mb-4">
        <button
          onClick={onCancel}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white dark:bg-[#27354c] border border-slate-200 dark:border-white/10 text-slate-400 hover:text-indigo-600 hover:border-indigo-200 shadow-sm transition-all"
        >
          <i className="fas fa-arrow-left"></i>
        </button>
        <div>
          <h3 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">
            {initialClient ? 'Modifier le Client' : 'Nouveau Compte Client'}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium italic">
            {initialClient ? `Mise à jour des informations de : ${initialClient.name}` : 'Configuration complète conforme à la base de données centrale.'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white dark:bg-[#27354c] p-8 rounded-[15px] shadow-sm border border-slate-200 dark:border-white/5 space-y-6">
            <h4 className="text-xs font-black uppercase text-indigo-600 dark:text-indigo-400 border-b border-indigo-50 dark:border-white/5 pb-2 flex items-center">
              <i className="fas fa-id-card mr-2"></i> Identité & Responsables
            </h4>
            <div className="space-y-4">
              <InputWrapper label="Raison Sociale *">
                {renderInput('name', formData.name, {
                  type: "text",
                  placeholder: "Nom de l'entreprise",
                  required: true,
                  className: "font-bold text-slate-800 dark:text-white"
                })}
              </InputWrapper>
              <div className="grid grid-cols-2 gap-4">
                <InputWrapper label="Responsable (Manager)">
                  {renderInput('manager', formData.manager, {
                    type: "text",
                    placeholder: "Nom du responsable"
                  })}
                </InputWrapper>
                <InputWrapper label="Gamme / Type">
                  <select
                    value={formData.gamme}
                    onChange={(e) => handleInputChange('gamme', e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500/10 outline-none appearance-none dark:text-slate-200"
                  >
                    <option value="">Sélectionner...</option>
                    <option value="Haute Gamme">Haute Gamme</option>
                    <option value="Haute et Moyenne">Haute et Moyenne</option>
                    <option value="Moyenne gamme">Moyenne gamme</option>
                    <option value="Economie">Economie</option>
                  </select>
                </InputWrapper>
              </div>
              <InputWrapper label="E-mail Utilisateur (Interne)">
                {renderInput('user_email', formData.user_email, {
                  type: "email",
                  placeholder: "user@votreentreprise.com"
                })}
              </InputWrapper>
              <div className="flex items-center space-x-3 p-4 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-100 dark:border-white/5">
                <input
                  type="checkbox"
                  id="is_blocked"
                  checked={formData.is_blocked}
                  onChange={(e) => handleInputChange('is_blocked', e.target.checked)}
                  className="w-5 h-5 rounded border-slate-300 text-rose-500 focus:ring-rose-500"
                />
                <label htmlFor="is_blocked" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase cursor-pointer">Bloquer ce client</label>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#27354c] p-8 rounded-[15px] shadow-sm border border-slate-200 dark:border-white/5 space-y-6">
            <h4 className="text-xs font-black uppercase text-emerald-600 dark:text-emerald-400 border-b border-emerald-50 dark:border-white/5 pb-2 flex items-center">
              <i className="fas fa-phone-alt mr-2"></i> Coordonnées de Contact
            </h4>
            <div className="space-y-4">
              <InputWrapper label="E-mail Client">
                {renderInput('email', formData.email, {
                  type: "email",
                  placeholder: "contact@client.ma"
                })}
              </InputWrapper>
              <div className="grid grid-cols-2 gap-4">
                <InputWrapper label="Téléphone Fixe">
                  {renderInput('phone', formData.phone, {
                    type: "text",
                    placeholder: "05..."
                  })}
                </InputWrapper>
                <InputWrapper label="GSM 1 (Principal)">
                  {renderInput('gsm1', formData.gsm1, {
                    type: "text",
                    placeholder: "06..."
                  })}
                </InputWrapper>
              </div>
              <InputWrapper label="GSM 2 (Secondaire)">
                {renderInput('gsm2', formData.gsm2, {
                  type: "text",
                  placeholder: "07..."
                })}
              </InputWrapper>
              <InputWrapper label="ICE (Identifiant Commun de l'Entreprise)">
                {renderInput('ice', formData.ice, {
                  type: "text",
                  placeholder: "Ex: 000000000000000"
                })}
              </InputWrapper>
            </div>
          </div>

          <div className="bg-white dark:bg-[#27354c] p-8 rounded-[15px] shadow-sm border border-slate-200 dark:border-white/5 space-y-6 lg:col-span-2">
            <h4 className="text-xs font-black uppercase text-orange-500 dark:text-orange-400 border-b border-orange-50 dark:border-white/5 pb-2 flex items-center">
              <i className="fas fa-map-marked-alt mr-2"></i> Localisation Géographique
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1">
                <InputWrapper label="Adresse Complète">
                  {renderInput('address', formData.address, {
                    type: "text",
                    placeholder: "N°, Rue, Quartier..."
                  })}
                </InputWrapper>
              </div>
              <InputWrapper label="Ville">
                {renderInput('city', formData.city, {
                  type: "text",
                  placeholder: "Ex: Casablanca"
                })}
              </InputWrapper>
              <InputWrapper label="Région">
                {renderInput('region', formData.region, {
                  type: "text",
                  placeholder: "Ex: Grand Casablanca"
                })}
              </InputWrapper>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-8 py-4 text-[10px] font-bold uppercase text-slate-400"
          >
            Annuler
          </button>
          <button
            type="submit"
            className="px-12 py-4 bg-indigo-600 text-white rounded-[12px] text-[10px] font-black uppercase shadow-xl"
          >
            {initialClient ? 'Mettre à jour' : 'Enregistrer le Client'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ClientForm;
