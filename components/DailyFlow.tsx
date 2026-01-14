
import React, { useState, useMemo } from 'react';
import { Expense, Earning, DailyKm, EARNING_CATEGORIES, DEFAULT_CATEGORIES } from '../types';
import { Plus, ArrowUpCircle, ArrowDownCircle, Printer, Calendar, Gauge, Navigation } from 'lucide-react';

interface DailyFlowProps {
  onAddEarning: (earning: Earning) => void;
  onAddExpense: (expense: Expense) => void;
  onUpdateKm: (km: DailyKm) => void;
  expenses: Expense[];
  earnings: Earning[];
  kmEntries: DailyKm[];
}

const DailyFlow: React.FC<DailyFlowProps> = ({ onAddEarning, onAddExpense, onUpdateKm, expenses, earnings, kmEntries }) => {
  const [activeTab, setActiveTab] = useState<'EARNING' | 'EXPENSE'>('EARNING');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(activeTab === 'EARNING' ? EARNING_CATEGORIES[0] : DEFAULT_CATEGORIES[0]);
  
  const today = new Date().toISOString().split('T')[0];
  const currentKmEntry = kmEntries.find(k => k.date === today) || { id: '', date: today, startKm: 0, endKm: 0 };

  const dailyEarnings = useMemo(() => earnings.filter(e => e.date === today), [earnings, today]);
  const dailyExpenses = useMemo(() => expenses.filter(e => e.date === today), [expenses, today]);
  
  const totalDailyEarning = dailyEarnings.reduce((a, b) => a + b.amount, 0);
  const totalDailyExpense = dailyExpenses.reduce((a, b) => a + b.amount, 0);
  const kmRodados = currentKmEntry.endKm > 0 ? currentKmEntry.endKm - currentKmEntry.startKm : 0;
  
  const rendimentoPorKm = kmRodados > 0 ? (totalDailyEarning / kmRodados) : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) return;

    if (activeTab === 'EARNING') {
      onAddEarning({
        id: crypto.randomUUID(),
        description: description || `Ganho ${category}`,
        amount: parseFloat(amount),
        category,
        date: today
      });
    } else {
      const isWork = category.includes('Trabalho') || ['Combustível', 'Manutenção Veículo', 'Aluguel de Veículo'].includes(category);
      onAddExpense({
        id: crypto.randomUUID(),
        description: description || category,
        amount: parseFloat(amount),
        category,
        date: today,
        type: isWork ? 'WORK' : 'PERSONAL'
      });
    }

    setAmount('');
    setDescription('');
  };

  const handleKmUpdate = (field: 'startKm' | 'endKm', value: string) => {
    const numValue = parseInt(value) || 0;
    onUpdateKm({
      ...currentKmEntry,
      id: currentKmEntry.id || crypto.randomUUID(),
      [field]: numValue
    });
  };

  return (
    <div className="space-y-6 animate-fade-in pb-24">
      {/* KM Control Card */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl border border-slate-800">
        <h3 className="text-xs font-black text-blue-400 uppercase tracking-widest mb-4 flex items-center">
          <Gauge size={14} className="mr-2" /> Controle de Odômetro (KM)
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] text-slate-400 block mb-1">KM INICIAL</label>
            <input 
              type="number"
              value={currentKmEntry.startKm || ''}
              onChange={(e) => handleKmUpdate('startKm', e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 p-3 rounded-xl text-xl font-bold focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="0"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-400 block mb-1">KM FINAL</label>
            <input 
              type="number"
              value={currentKmEntry.endKm || ''}
              onChange={(e) => handleKmUpdate('endKm', e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 p-3 rounded-xl text-xl font-bold focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="0"
            />
          </div>
        </div>
        
        {kmRodados > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-800 flex justify-between items-center">
            <div>
              <p className="text-xs text-slate-400">Rodados hoje</p>
              <p className="text-lg font-black text-blue-400">{kmRodados} km</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400">Rendimento</p>
              <p className="text-lg font-black text-emerald-400">R$ {rendimentoPorKm.toFixed(2)}/km</p>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800 flex items-center">
            <Navigation size={20} className="mr-2 text-blue-600" /> Movimentação de Hoje
          </h2>
          <button onClick={() => window.print()} className="p-2 bg-gray-100 text-gray-600 rounded-lg"><Printer size={18} /></button>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
            <p className="text-[10px] font-bold text-emerald-600 uppercase">Ganhos</p>
            <p className="text-xl font-black text-emerald-800">R$ {totalDailyEarning.toFixed(2)}</p>
          </div>
          <div className="p-4 bg-rose-50 rounded-xl border border-rose-100">
            <p className="text-[10px] font-bold text-rose-600 uppercase">Gastos</p>
            <p className="text-xl font-black text-rose-800">R$ {totalDailyExpense.toFixed(2)}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex p-1 bg-gray-100 rounded-xl">
            <button 
              type="button"
              onClick={() => { setActiveTab('EARNING'); setCategory(EARNING_CATEGORIES[0]); }}
              className={`flex-1 py-3 rounded-lg font-bold text-sm transition ${activeTab === 'EARNING' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500'}`}
            >
              + Ganho
            </button>
            <button 
              type="button"
              onClick={() => { setActiveTab('EXPENSE'); setCategory(DEFAULT_CATEGORIES[0]); }}
              className={`flex-1 py-3 rounded-lg font-bold text-sm transition ${activeTab === 'EXPENSE' ? 'bg-white text-rose-600 shadow-sm' : 'text-gray-500'}`}
            >
              - Gasto
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <input 
              type="number" step="0.01" placeholder="R$ 0,00" value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full text-xl font-bold p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <select 
              value={category} onChange={(e) => setCategory(e.target.value)}
              className="w-full p-4 border border-gray-200 rounded-xl bg-white font-medium focus:ring-2 focus:ring-blue-500 outline-none"
            >
              {activeTab === 'EARNING' 
                ? EARNING_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)
                : DEFAULT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)
              }
            </select>
          </div>

          <button 
            type="submit"
            className={`w-full py-4 rounded-xl text-white font-black text-lg shadow-lg active:scale-95 transition ${activeTab === 'EARNING' ? 'bg-emerald-600 shadow-emerald-200' : 'bg-rose-600 shadow-rose-200'}`}
          >
            CONFIRMAR ENTRADA
          </button>
        </form>
      </div>

      <div className="space-y-2">
        <h3 className="font-bold text-gray-500 text-xs uppercase px-2 tracking-widest">Últimos Registros</h3>
        {[...dailyEarnings, ...dailyExpenses].sort((a,b) => b.id.localeCompare(a.id)).slice(0, 5).map(item => {
           const isEarning = 'category' in item && EARNING_CATEGORIES.includes(item.category);
           return (
            <div key={item.id} className="bg-white p-4 rounded-xl border border-gray-100 flex justify-between items-center">
              <div>
                <p className="font-bold text-gray-800 text-sm">{item.category}</p>
                <p className="text-xs text-gray-400">{item.description || '-'}</p>
              </div>
              <p className={`font-black ${isEarning ? 'text-emerald-600' : 'text-rose-600'}`}>
                {isEarning ? '+' : '-'} R$ {item.amount.toFixed(2)}
              </p>
            </div>
           )
        })}
      </div>
    </div>
  );
};

export default DailyFlow;
