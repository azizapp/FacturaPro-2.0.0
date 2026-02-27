
import React, { useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Invoice, Client, InvoiceStatus } from '../types';
import { summarizeInvoices } from '../services/geminiService';
import { useAppContext } from '../context/AppContext';

interface DashboardProps {
  invoices: Invoice[];
  clients: Client[];
}

const Dashboard: React.FC<DashboardProps> = ({ invoices, clients }) => {
  const { theme } = useAppContext();
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const stats = useMemo(() => {
    const totalTtc = invoices.reduce((acc, inv) => acc + (inv.grandTotal || 0), 0);
    const totalPaid = invoices.reduce((acc, inv) => acc + (inv.payments?.reduce((sum, p) => sum + p.amount, 0) || 0), 0);
    const pending = totalTtc - totalPaid;
    return { totalTtc, totalPaid, pending };
  }, [invoices]);

  const monthlyData = useMemo(() => {
    const monthNames = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];
    const currentYear = new Date().getFullYear();
    return monthNames.map((name, i) => {
      const amount = invoices
        .filter(inv => {
          const d = new Date(inv.date);
          return d.getMonth() === i && d.getFullYear() === currentYear;
        })
        .reduce((sum, inv) => sum + inv.grandTotal, 0);
      return { name, amount };
    });
  }, [invoices]);

  const salesByProduct = useMemo(() => {
    const targetGammas = [
      "APOLLO™ CLIP EASE",
      "APOLLO™ EXCLUSIVE",
      "APOLLO™ MINISTARS",
      "APOLLO™ SUNGLASSES",
      "APOLLO™EYEWEAR",
      "LENZO BRAND"
    ];

    const map = new Map<string, number>();
    targetGammas.forEach(g => map.set(g, 0));

    invoices.forEach(inv => {
      inv.items.forEach(item => {
        const prodName = (item.productName || "").toUpperCase();
        const matchedGamma = targetGammas.find(gamma =>
          prodName.includes(gamma.toUpperCase())
        );

        if (matchedGamma) {
          map.set(matchedGamma, (map.get(matchedGamma) || 0) + item.quantity);
        }
      });
    });

    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [invoices]);

  const handleAiAnalysis = async () => {
    setAnalyzing(true);
    try {
      const result = await summarizeInvoices(invoices);
      setAiAnalysis(result);
    } catch (error) {
      console.error("Erreur analyse IA:", error);
    } finally {
      setAnalyzing(false);
    }
  };

  const isDark = theme === 'dark';
  const maxSales = salesByProduct.length > 0 ? Math.max(...salesByProduct.map(s => s.count), 1) : 1;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Chiffre d'Affaires" value={stats.totalTtc} icon="fa-chart-line" color="indigo" />
        <MetricCard title="Total Encaissé" value={stats.totalPaid} icon="fa-wallet" color="emerald" />
        <MetricCard title="Reste à Recouvrer" value={stats.pending} icon="fa-clock-rotate-left" color="rose" />
        <MetricCard title="Nombre de Clients" value={clients.length} icon="fa-users" color="blue" isCurrency={false} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart Container with Fixed Height to avoid ResponsiveContainer warning */}
        <div className="lg:col-span-2 bg-white dark:bg-[#1b263b] p-6 rounded-[15px] border border-slate-200 dark:border-white/10 shadow-sm flex flex-col h-[450px]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-black uppercase tracking-widest dark:text-white flex items-center">
              <span className="w-1 h-4 bg-indigo-500 rounded-full mr-2"></span>
              Performance Annuelle
            </h3>
          </div>
          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAmt" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#1e293b' : '#f1f5f9'} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ 
                    borderRadius: '15px', 
                    border: 'none', 
                    boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', 
                    backgroundColor: isDark ? '#0f172a' : '#fff',
                    padding: '12px'
                  }}
                  itemStyle={{ fontWeight: 'black', color: '#6366f1', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="amount" stroke="#6366f1" strokeWidth={3} fill="url(#colorAmt)" animationDuration={1500} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Sidebar */}
        <div className="bg-indigo-600 dark:bg-[#1b263b] rounded-[15px] p-6 text-white shadow-xl relative overflow-hidden flex flex-col border border-indigo-500/20 dark:border-white/10 transition-all duration-300 h-[450px]">
          <div className="relative z-10 flex flex-col h-full">
            <div className="flex items-center space-x-2 mb-6">
              <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/10">
                <i className="fas fa-sparkles text-indigo-400 text-lg"></i>
              </div>
              <h3 className="font-black text-lg tracking-tight uppercase italic">Analyste <span className="text-indigo-400">Pro</span></h3>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
              {analyzing ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <div className="w-10 h-10 border-3 border-white/20 border-t-indigo-500 rounded-full animate-spin"></div>
                  <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 italic">Analyse en cours...</p>
                </div>
              ) : aiAnalysis ? (
                <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2">
                  <p className="text-xs font-medium leading-relaxed bg-white/5 p-4 rounded-xl border border-white/5">{aiAnalysis.summary}</p>
                  <ul className="space-y-2">
                    {aiAnalysis.insights.slice(0, 3).map((item: string, i: number) => (
                      <li key={i} className="flex items-start text-[10px] font-medium">
                        <i className="fas fa-circle-check mt-1 mr-2 text-indigo-400 text-[8px]"></i>
                        <span className="opacity-80">{item}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="p-4 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
                    <p className="text-[8px] font-black uppercase mb-1 tracking-widest text-indigo-300">Recommandation</p>
                    <p className="text-[11px] italic font-bold text-slate-200">"{aiAnalysis.recommendation}"</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 flex flex-col items-center h-full justify-center">
                  <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                    <i className="fas fa-brain text-3xl opacity-20"></i>
                  </div>
                  <p className="text-[10px] font-medium mb-6 opacity-60 uppercase tracking-widest px-4">Lancez l'intelligence artificielle pour obtenir des conseils stratégiques</p>
                </div>
              )}
            </div>
            
            <div className="pt-4 shrink-0">
              <button onClick={handleAiAnalysis} className="w-full bg-white text-indigo-600 dark:bg-indigo-600 dark:text-white font-black py-4 rounded-xl text-[10px] uppercase tracking-widest shadow-lg hover:bg-slate-100 dark:hover:bg-indigo-500 transition-all active:scale-95">
                {aiAnalysis ? 'Actualiser Analyse' : 'Analyser les données'}
              </button>
            </div>
          </div>
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-indigo-500/5 rounded-full blur-3xl"></div>
        </div>
      </div>

      {/* Sales Performance Table */}
      <div className="bg-white dark:bg-[#1b263b] rounded-[15px] border border-slate-200 dark:border-white/10 shadow-sm p-8 overflow-hidden">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-base font-black text-slate-800 dark:text-white uppercase tracking-tight">Performance des Ventes</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Volume des produits vendus par gamme</p>
          </div>
        </div>

        <div className="space-y-8">
          {salesByProduct.length > 0 ? salesByProduct.map((product, idx) => (
            <div key={product.name} className="flex items-center space-x-6">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-xs shrink-0 shadow-sm border-2 ${idx % 2 === 0 ? 'bg-indigo-50 text-indigo-600 border-indigo-100 dark:bg-indigo-500/10 dark:border-indigo-500/20' : 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:border-emerald-500/20'}`}>
                {product.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-black text-slate-700 dark:text-slate-200 truncate pr-4">{product.name}</span>
                  <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{product.count} VENTES</span>
                </div>
                <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-1000 ${idx % 2 === 0 ? 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'}`}
                    style={{ width: `${(product.count / maxSales) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          )) : (
            <div className="text-center py-8 text-slate-400 italic text-xs">
              Aucune donnée de vente disponible pour le moment.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const MetricCard: React.FC<{ title: string, value: number, icon: string, color: string, isCurrency?: boolean }> = ({ title, value, icon, color, isCurrency = true }) => {
  const colorMap: Record<string, string> = {
    indigo: 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/10',
    emerald: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10',
    rose: 'text-rose-600 dark:text-rose-400 bg-rose-500/10',
    blue: 'text-blue-600 dark:text-blue-400 bg-blue-500/10',
  };

  return (
    <div className="bg-white dark:bg-[#1b263b] p-6 rounded-[15px] border border-slate-200 dark:border-white/10 shadow-sm group hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300">
      <div className="flex justify-between items-start mb-4">
        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em]">
          {title}
        </p>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 ${colorMap[color] || 'bg-slate-500/10 text-slate-600'}`}>
          <i className={`fas ${icon} text-xs`}></i>
        </div>
      </div>
      <div className="flex items-baseline space-x-1">
        <h4 className="text-2xl font-black text-slate-800 dark:text-white tracking-tighter">
          {isCurrency ? value.toLocaleString() : value}
        </h4>
        {isCurrency && (
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">MAD</span>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
