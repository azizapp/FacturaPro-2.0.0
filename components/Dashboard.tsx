
import React, { useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
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
    const totalHt = invoices.reduce((acc, inv) => acc + (inv.subtotal || 0), 0);
    const totalTtc = invoices.reduce((acc, inv) => acc + (inv.grandTotal || 0), 0);
    const totalPaid = invoices.reduce((acc, inv) => acc + (inv.payments?.reduce((sum, p) => sum + p.amount, 0) || 0), 0);
    const pending = totalTtc - totalPaid;
    return { totalHt, totalTtc, totalPaid, pending };
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

  const handleAiAnalysis = async () => {
    setAnalyzing(true);
    try {
      const result = await summarizeInvoices(invoices);
      setAiAnalysis(result);
    } catch (error) {
      console.error(error);
    } finally {
      setAnalyzing(false);
    }
  };

  const isDark = theme === 'dark';

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard title="Chiffre d'Affaires" value={stats.totalTtc} icon="fa-chart-line" color="indigo" theme={theme} />
        <MetricCard title="Total Encaissé" value={stats.totalPaid} icon="fa-wallet" color="emerald" theme={theme} />
        <MetricCard title="Reste à Recouvrer" value={stats.pending} icon="fa-clock-rotate-left" color="rose" theme={theme} />
        <MetricCard title="Nombre de Clients" value={clients.length} icon="fa-users" color="blue" isCurrency={false} theme={theme} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-200 dark:border-white/5 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-lg font-black uppercase tracking-tight dark:text-white flex items-center">
              <span className="w-2 h-8 bg-indigo-500 rounded-full mr-4"></span>
              Performance Annuelle
            </h3>
          </div>
          <div className="h-[340px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="colorAmt" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#1e293b' : '#f1f5f9'} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} tickFormatter={(v) => `${v/1000}k`} />
                <Tooltip 
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', backgroundColor: isDark ? '#0f172a' : '#fff'}}
                  itemStyle={{fontWeight: 'bold', color: '#6366f1'}}
                />
                <Area type="monotone" dataKey="amount" stroke="#6366f1" strokeWidth={4} fill="url(#colorAmt)" animationDuration={2000} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Sidebar */}
        <div className="bg-indigo-600 rounded-[32px] p-8 text-white shadow-2xl shadow-indigo-500/20 relative overflow-hidden flex flex-col">
          <div className="relative z-10 flex-1">
            <div className="flex items-center space-x-3 mb-8">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
                <i className="fas fa-sparkles text-xl"></i>
              </div>
              <h3 className="font-black text-xl tracking-tight">Analyste IA</h3>
            </div>

            {analyzing ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                <p className="text-xs font-bold uppercase tracking-widest opacity-60">Calcul des indicateurs...</p>
              </div>
            ) : aiAnalysis ? (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                <p className="text-sm font-medium leading-relaxed bg-white/10 p-4 rounded-2xl">{aiAnalysis.summary}</p>
                <ul className="space-y-3">
                  {aiAnalysis.insights.slice(0, 3).map((item: string, i: number) => (
                    <li key={i} className="flex items-start text-xs font-medium">
                      <i className="fas fa-check-circle mt-0.5 mr-3 text-indigo-300"></i>
                      <span className="opacity-90">{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="p-4 bg-amber-400/20 rounded-2xl border border-amber-400/30">
                  <p className="text-[10px] font-black uppercase mb-1 tracking-widest text-amber-200">Conseil Stratégique</p>
                  <p className="text-xs italic font-bold">"{aiAnalysis.recommendation}"</p>
                </div>
                <button onClick={handleAiAnalysis} className="w-full bg-white text-indigo-600 font-black py-4 rounded-2xl text-[11px] uppercase tracking-widest hover:bg-indigo-50 transition-colors">
                  Ré-analyser
                </button>
              </div>
            ) : (
              <div className="text-center py-12 flex flex-col items-center">
                <i className="fas fa-brain text-6xl opacity-20 mb-6"></i>
                <p className="text-sm font-medium mb-8 opacity-80">Obtenez une analyse complète de votre santé financière en un clic.</p>
                <button onClick={handleAiAnalysis} className="w-full bg-white text-indigo-600 font-black py-5 rounded-2xl text-[11px] uppercase tracking-[0.2em] shadow-xl hover:bg-indigo-50 transition-all">
                  Générer Insights
                </button>
              </div>
            )}
          </div>
          {/* Decorative Circle */}
          <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
        </div>
      </div>
    </div>
  );
};

const MetricCard: React.FC<{title: string, value: number, icon: string, color: string, isCurrency?: boolean, theme?: string}> = ({title, value, icon, color, isCurrency = true, theme}) => {
  const isDark = theme === 'dark';
  const colorMap: any = {
    indigo: 'bg-indigo-500/10 text-indigo-600',
    emerald: 'bg-emerald-500/10 text-emerald-600',
    rose: 'bg-rose-500/10 text-rose-600',
    blue: 'bg-blue-500/10 text-blue-600',
  };

  return (
    <div className="bg-white dark:bg-slate-900 p-7 rounded-[28px] border border-slate-200 dark:border-white/5 shadow-sm group hover:-translate-y-1 transition-all">
      <div className="flex items-center justify-between mb-6">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110 ${colorMap[color]}`}>
          <i className={`fas ${icon} text-lg`}></i>
        </div>
        <div className="w-2 h-2 rounded-full bg-slate-200 dark:bg-slate-800"></div>
      </div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">{title}</p>
        <h4 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          {isCurrency ? value.toLocaleString() : value}
          {isCurrency && <span className="text-xs ml-1 opacity-40">MAD</span>}
        </h4>
      </div>
    </div>
  );
};

export default Dashboard;
