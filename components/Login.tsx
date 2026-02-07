
import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured, updateSupabaseConfig } from '../services/supabaseClient';

interface LoginProps {
    onLogin: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showManualConfig, setShowManualConfig] = useState(false);
    
    // Manual config states
    const [manualUrl, setManualUrl] = useState('');
    const [manualKey, setManualKey] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!isSupabaseConfigured()) {
            setError("Configuration manquante. Cliquez ici pour configurer manuellement.");
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
            if (loginError) throw loginError;
            onLogin();
        } catch (err: any) {
            console.error("Login Error Details:", err);
            setError(err.message === "Failed to fetch" 
                ? "Impossible de contacter le serveur Supabase. Vérifiez l'URL et votre connexion." 
                : err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveConfig = () => {
        if (updateSupabaseConfig(manualUrl, manualKey)) {
            setError(null);
            setShowManualConfig(false);
            alert("Configuration mise à jour avec succès !");
        } else {
            alert("Données invalides. L'URL doit commencer par http.");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6 font-sans relative overflow-hidden">
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/10 blur-[120px] rounded-full"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[120px] rounded-full"></div>

            <div className="w-full max-w-[460px] relative z-10">
                <div className="bg-slate-900/60 backdrop-blur-3xl p-10 rounded-[40px] shadow-2xl border border-white/10">
                    <div className="flex flex-col items-center mb-10">
                        <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-2xl flex items-center justify-center text-white mb-6 shadow-xl shadow-indigo-500/20">
                            <i className="fas fa-shield-alt text-2xl"></i>
                        </div>
                        <h1 className="text-3xl font-black text-white tracking-tighter uppercase italic">Factura<span className="text-indigo-500">Pro</span></h1>
                        <p className="text-slate-500 mt-2 text-[10px] font-bold uppercase tracking-[0.2em]">Authentification Sécurisée</p>
                    </div>

                    {!showManualConfig ? (
                        <form onSubmit={handleLogin} className="space-y-6">
                            {error && (
                                <div 
                                    onClick={() => error.includes("configurer manuellement") && setShowManualConfig(true)}
                                    className={`p-4 rounded-2xl text-[11px] font-bold animate-in fade-in transition-all ${error.includes("manuellement") ? "bg-amber-500/10 border border-amber-500/30 text-amber-400 cursor-pointer hover:bg-amber-500/20" : "bg-rose-500/10 border border-rose-500/20 text-rose-400"}`}
                                >
                                    <i className={`fas ${error.includes("manuellement") ? "fa-tools" : "fa-exclamation-triangle"} mr-2`}></i>
                                    {error}
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Email</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-5 py-4 bg-slate-800/50 border border-white/5 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-white font-medium"
                                    placeholder="admin@entreprise.com"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Mot de passe</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-5 py-4 bg-slate-800/50 border border-white/5 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-white font-medium"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 rounded-2xl shadow-xl shadow-indigo-600/20 transition-all flex items-center justify-center uppercase tracking-widest text-[11px] ${loading ? 'opacity-70' : ''}`}
                            >
                                {loading ? <i className="fas fa-circle-notch animate-spin mr-3"></i> : <i className="fas fa-sign-in-alt mr-3"></i>}
                                {loading ? 'Vérification...' : 'Se Connecter'}
                            </button>

                            <div className="pt-6 border-t border-white/5 flex justify-center">
                                <button type="button" onClick={() => onLogin()} className="text-slate-500 hover:text-indigo-400 text-[10px] font-bold uppercase tracking-widest transition-colors">
                                    <i className="fas fa-eye mr-2"></i> Tester sans base de données
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="space-y-6 animate-in zoom-in-95 duration-200">
                            <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl mb-4">
                                <p className="text-[10px] text-indigo-300 font-medium leading-relaxed">
                                    Si vos variables d'environnement ne sont pas détectées, entrez-les ici. Elles seront stockées localement dans votre navigateur.
                                </p>
                            </div>
                            
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Supabase URL</label>
                                <input
                                    type="text"
                                    value={manualUrl}
                                    onChange={(e) => setManualUrl(e.target.value)}
                                    className="w-full px-5 py-3 bg-slate-800/50 border border-white/5 rounded-xl outline-none text-xs text-white"
                                    placeholder="https://abc...supabase.co"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Anon Key</label>
                                <textarea
                                    value={manualKey}
                                    onChange={(e) => setManualKey(e.target.value)}
                                    rows={3}
                                    className="w-full px-5 py-3 bg-slate-800/50 border border-white/5 rounded-xl outline-none text-[10px] text-white font-mono"
                                    placeholder="eyJhbG..."
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button 
                                    onClick={() => setShowManualConfig(false)}
                                    className="flex-1 py-3 text-[10px] font-black uppercase text-slate-500 hover:text-white transition-colors"
                                >
                                    Retour
                                </button>
                                <button 
                                    onClick={handleSaveConfig}
                                    className="flex-2 bg-indigo-600 hover:bg-indigo-500 text-white font-black py-3 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                                >
                                    Sauvegarder & Recharger
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Login;
