
import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';

interface LoginProps {
    onLogin: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;
            onLogin();
        } catch (err: any) {
            setError(err.message || 'Erreur lors de la connexion');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-6">
            <div className="w-full max-w-md bg-white dark:bg-slate-800 p-10 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700">
                <div className="flex flex-col items-center mb-10">
                    <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg shadow-indigo-600/20">
                        <i className="fas fa-file-invoice text-3xl"></i>
                    </div>
                    <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tighter italic">FACTURAPRO</h1>
                    <p className="text-slate-400 dark:text-slate-500 mt-2 text-sm uppercase tracking-widest font-bold">Accès Professionnel</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    {error && (
                        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 p-4 rounded-xl text-xs font-bold animate-in fade-in slide-in-from-top-2">
                            <i className="fas fa-exclamation-circle mr-2"></i> {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 ml-1">Email</label>
                        <div className="relative">
                            <i className="fas fa-envelope absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white"
                                placeholder="nom@exemple.com"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 ml-1">Mot de passe</label>
                        <div className="relative">
                            <i className="fas fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center uppercase tracking-widest text-[11px] ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                        {loading ? <i className="fas fa-circle-notch animate-spin mr-2"></i> : null}
                        {loading ? 'Connexion en cours...' : 'Se Connecter'}
                    </button>
                </form>

                <p className="mt-10 text-center text-slate-400 text-[10px] uppercase tracking-tighter">
                    &copy; 2026 FACTURAPRO. Tous droits réservés.
                </p>
            </div>
        </div>
    );
};

export default Login;
