
import React, { useState, useMemo } from 'react';
import { Expense, Earning, DailyKm, EARNING_CATEGORIES, DEFAULT_CATEGORIES } from '../types';
import { Plus, ArrowUpCircle, ArrowDownCircle, Printer, Calendar, Gauge, Navigation, Settings, X, Trash2 } from 'lucide-react';

interface DailyFlowProps {
  onAddEarning: (earning: Earning) => void;
  onAddExpense: (expense: Expense) => void;
  onUpdateKm: (km: DailyKm) => void;
  expenses: Expense[];
  earnings: Earning[];
  kmEntries: DailyKm[];
  expenseCategories: string[];
  earningCategories: string[];
  onAddCategory: (type: 'EARNING' | 'EXPENSE', category: string) => void;
  onDeleteCategory: (type: 'EARNING' | 'EXPENSE', category: string) => void;
}

const DailyFlow: React.FC<DailyFlowProps> = ({ 
  onAddEarning, 
  onAddExpense, 
  onUpdateKm, 
  expenses, 
  earnings, 
  kmEntries,
  expenseCategories,
  earningCategories,
  onAddCategory,
  onDeleteCategory
}) => {
  const [activeTab, setActiveTab] = useState<'EARNING' | 'EXPENSE'>('EARNING');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  
  // Initialize with the first category of the active list
  const [category, setCategory] = useState(earningCategories[0] || 'Outros');

  // Category Management State
  const [isManagingCategories, setIsManagingCategories] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  
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

  const handleCreateCategory = () => {
    if (newCategoryName.trim()) {
        onAddCategory(activeTab, newCategoryName.trim());
        setCategory(newCategoryName.trim()); 
        setNewCategoryName('');
    }
  };

  const handleTabChange = (tab: 'EARNING' | 'EXPENSE') => {
      setActiveTab(tab);
      if (tab === 'EARNING') {
          setCategory(earningCategories[0] || 'Outros');
      } else {
          setCategory(expenseCategories[0] || 'Outros');
      }
  };

  const currentCategories = activeTab === 'EARNING' ? earningCategories : expenseCategories;
  const defaultCategories = activeTab === 'EARNING' ? EARNING_CATEGORIES : DEFAULT_CATEGORIES;

  if (isManagingCategories) {
    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 animate-fade-in">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800 flex items-center">
                    <Settings className="mr-2 text-indigo-600" size={24} />
                    Gerenciar: {activeTab === 'EARNING' ? 'Ganhos' : 'Despesas'}
                </h2>
                <button onClick={() => setIsManagingCategories(false)} className="text-gray-500 hover:text-gray-700">
                    <X size={24} />
                </button>
            </div>

            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Adicionar Nova Categoria</label>
                <div className="flex gap-2">
                    <input 
                        type="text" 
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        placeholder="Nome da categoria"
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <button 
                        onClick={handleCreateCategory}
                        disabled={!newCategoryName.trim()}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 transition flex items-center"
                    >
                        <Plus size={18} />
                    </button>
                </div>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Categorias Atuais</h3>
                {currentCategories.map((cat) => {
                    const isDefault = defaultCategories.includes(cat);
                    return (
                        <div key={cat} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg group hover:bg-gray-100 transition">
                            <span className="text-gray-700 font-medium">{cat}</span>
                            {!isDefault && (
                                <button 
                                    onClick={() => onDeleteCategory(activeTab, cat)}
                                    className="text-gray-400 hover:text-red-500 transition opacity-0 group-hover:opacity-100 p-1"
                                    title="Excluir categoria"
                                >
                                    <Trash2 size={16} />
                                </button>
                            )}
                            {isDefault && <span className="text-xs text-gray-400 italic">Padrão</span>}
                        </div>
                    );
                })}
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100">
                <button 
                    onClick={() => setIsManagingCategories(false)}
                    className="w-full py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition"
                >
                    Voltar para o Fluxo
                </button>
            </div>
        </div>
    );
  }

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
              onClick={() => handleTabChange('EARNING')}
              className={`flex-1 py-3 rounded-lg font-bold text-sm transition ${activeTab === 'EARNING' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500'}`}
            >
              + Ganho
            </button>
            <button 
              type="button"
              onClick={() => handleTabChange('EXPENSE')}
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
            <div className="flex flex-col gap-1">
                <div className="relative">
                    <select 
                    value={category} onChange={(e) => setCategory(e.target.value)}
                    className="w-full p-4 border border-gray-200 rounded-xl bg-white font-medium focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
                    >
                    {currentCategories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                       {/* Arrow icon could go here */}
                    </div>
                </div>
                <button 
                    type="button" 
                    onClick={() => setIsManagingCategories(true)}
                    className="text-[10px] font-bold text-indigo-500 hover:text-indigo-700 text-right flex items-center justify-end px-1"
                >
                    <Settings size={12} className="mr-1" /> Editar Categorias
                </button>
            </div>
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
           // We determine if it's an earning by checking if its category is in the Earning Categories list
           // or checking the object structure if we had a discriminator field. 
           // For safety, let's assume if it doesn't have a 'type' field and is in earning list, or we check against known lists.
           const isEarning = 'category' in item && earningCategories.includes(item.category) && !('type' in item);
           // Fallback check:
           const isExpense = 'type' in item;
           const displayEarning = !isExpense;

           return (
            <div key={item.id} className="bg-white p-4 rounded-xl border border-gray-100 flex justify-between items-center">
              <div>
                <p className="font-bold text-gray-800 text-sm">{item.category}</p>
                <p className="text-xs text-gray-400">{item.description || '-'}</p>
              </div>
              <p className={`font-black ${displayEarning ? 'text-emerald-600' : 'text-rose-600'}`}>
                {displayEarning ? '+' : '-'} R$ {item.amount.toFixed(2)}
              </p>
            </div>
           )
        })}
      </div>
    </div>
  );
};

export default DailyFlow;
