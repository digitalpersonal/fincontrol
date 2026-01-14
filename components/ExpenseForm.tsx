
import React, { useState, useEffect } from 'react';
import { Expense, DEFAULT_CATEGORIES, RecurringExpense, Frequency } from '../types';
import { PlusCircle, Save, Settings, X, Plus, Trash2, Repeat, CalendarClock, Edit2, AlignLeft } from 'lucide-react';

interface ExpenseFormProps {
  categories: string[];
  initialData?: Expense | null;
  onAddExpense: (expense: Expense, recurring?: RecurringExpense) => void;
  onCancel: () => void;
  onAddCategory: (category: string) => void;
  onDeleteCategory: (category: string) => void;
}

const ExpenseForm: React.FC<ExpenseFormProps> = ({ 
  categories, 
  initialData,
  onAddExpense, 
  onCancel,
  onAddCategory,
  onDeleteCategory
}) => {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<string>(categories[0] || 'Outros');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [observations, setObservations] = useState('');
  
  // Recurring State
  const [isRecurring, setIsRecurring] = useState(false);
  const [frequency, setFrequency] = useState<Frequency>('MONTHLY');

  // Category Management Mode
  const [isManagingCategories, setIsManagingCategories] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // Load initial data if editing
  useEffect(() => {
    if (initialData) {
      setDescription(initialData.description);
      setAmount(initialData.amount.toString());
      setCategory(initialData.category);
      setDate(initialData.date);
      setObservations(initialData.observations || '');
      // We do not set isRecurring here because editing a past expense 
      // typically shouldn't trigger a new recurrence chain unless explicitly desired.
      // To keep it simple, we disable recurrence creation in Edit mode.
      setIsRecurring(false);
    }
  }, [initialData]);

  const calculateNextDate = (currentDate: string, freq: Frequency): string => {
    const [y, m, day] = currentDate.split('-').map(Number);
    const dateObj = new Date(y, m - 1, day);

    if (freq === 'WEEKLY') {
      dateObj.setDate(dateObj.getDate() + 7);
    } else if (freq === 'MONTHLY') {
      dateObj.setMonth(dateObj.getMonth() + 1);
    } else if (freq === 'YEARLY') {
      dateObj.setFullYear(dateObj.getFullYear() + 1);
    }
    
    return dateObj.toISOString().split('T')[0];
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount) return;

    // Use existing ID if editing, otherwise generate new
    const expenseId = initialData?.id || crypto.randomUUID();

    // Determine type based on category name
    const isWork = category.includes('Trabalho') || ['Combustível', 'Manutenção Veículo', 'Aluguel de Veículo'].includes(category);

    const newExpense: Expense = {
      id: expenseId,
      description,
      amount: parseFloat(amount),
      category,
      date,
      observations: observations.trim() || undefined,
      type: isWork ? 'WORK' : 'PERSONAL',
      isRecurringInstance: initialData?.isRecurringInstance
    };

    let newRecurring: RecurringExpense | undefined = undefined;

    // Only allow creating recurring expense if NOT editing
    if (isRecurring && !initialData) {
      newRecurring = {
        id: crypto.randomUUID(),
        description,
        amount: parseFloat(amount),
        category,
        frequency,
        nextDueDate: calculateNextDate(date, frequency)
      };
    }

    onAddExpense(newExpense, newRecurring);
  };

  const handleCreateCategory = () => {
    if (newCategoryName.trim()) {
        onAddCategory(newCategoryName.trim());
        setCategory(newCategoryName.trim()); // Select the new category
        setNewCategoryName('');
    }
  };

  if (isManagingCategories) {
    return (
        <div className="max-w-lg mx-auto bg-white p-8 rounded-2xl shadow-lg border border-gray-100 animate-fade-in">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800 flex items-center">
                    <Settings className="mr-2 text-indigo-600" size={24} />
                    Gerenciar Categorias
                </h2>
                <button onClick={() => setIsManagingCategories(false)} className="text-gray-500 hover:text-gray-700">
                    <X size={24} />
                </button>
            </div>

            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Adicionar Nova</label>
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
                {categories.map((cat) => {
                    const isDefault = DEFAULT_CATEGORIES.includes(cat);
                    return (
                        <div key={cat} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg group hover:bg-gray-100 transition">
                            <span className="text-gray-700 font-medium">{cat}</span>
                            {!isDefault && (
                                <button 
                                    onClick={() => onDeleteCategory(cat)}
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
                    Voltar para o Formulário
                </button>
            </div>
        </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto bg-white p-8 rounded-2xl shadow-lg border border-gray-100 animate-fade-in">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
        {initialData ? (
          <Edit2 className="mr-2 text-blue-600" />
        ) : (
          <PlusCircle className="mr-2 text-blue-600" />
        )}
        {initialData ? 'Editar Despesa' : 'Nova Despesa'}
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
          <input
            type="text"
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            placeholder="Ex: Gasolina, Conta de Luz"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Valor (R$)</label>
          <input
            type="number"
            required
            step="0.01"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-gray-700">Categoria</label>
                <button 
                    type="button" 
                    onClick={() => setIsManagingCategories(true)}
                    className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center font-medium"
                >
                    <Settings size={12} className="mr-1" />
                    Gerenciar
                </button>
            </div>
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
            <input
              type="date"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
            <AlignLeft size={16} className="mr-1 text-gray-400" />
            Observações (Opcional)
          </label>
          <textarea
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition min-h-[80px]"
            placeholder="Adicione notas extras sobre esta despesa..."
            value={observations}
            onChange={(e) => setObservations(e.target.value)}
          />
        </div>

        {/* Recurrence Section - Only show when NOT editing an existing expense */}
        {!initialData && (
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
              <div className="flex items-center justify-between">
                  <div className="flex items-center text-blue-800">
                      <Repeat size={18} className="mr-2" />
                      <span className="font-medium text-sm">Repetir despesa?</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={isRecurring}
                          onChange={(e) => setIsRecurring(e.target.checked)}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
              </div>
              
              {isRecurring && (
                  <div className="mt-3 animate-fade-in">
                      <label className="block text-xs font-semibold text-blue-700 uppercase tracking-wide mb-1 flex items-center">
                          <CalendarClock size={12} className="mr-1"/> Frequência
                      </label>
                      <select
                          value={frequency}
                          onChange={(e) => setFrequency(e.target.value as Frequency)}
                          className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                      >
                          <option value="WEEKLY">Semanalmente (a cada 7 dias)</option>
                          <option value="MONTHLY">Mensalmente (mesmo dia do mês)</option>
                          <option value="YEARLY">Anualmente (mesmo dia do ano)</option>
                      </select>
                      <p className="text-xs text-blue-500 mt-2">
                          Uma nova despesa será criada automaticamente no futuro com base nesta data.
                      </p>
                  </div>
              )}
          </div>
        )}

        <div className="pt-4 flex gap-3">
            <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition"
            >
            Cancelar
            </button>
            <button
            type="submit"
            className="flex-1 px-4 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 shadow-md transition flex justify-center items-center"
            >
            <Save size={20} className="mr-2" />
            {initialData ? 'Atualizar' : 'Salvar'}
            </button>
        </div>
      </form>
    </div>
  );
};

export default ExpenseForm;