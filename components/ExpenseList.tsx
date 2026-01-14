
import React, { useState, useMemo } from 'react';
import { Expense } from '../types';
import { Trash2, Calendar, Tag, Filter, X, Pencil, AlignLeft } from 'lucide-react';

interface ExpenseListProps {
  expenses: Expense[];
  onDelete: (id: string) => void;
  onEdit: (expense: Expense) => void;
}

const ExpenseList: React.FC<ExpenseListProps> = ({ expenses, onDelete, onEdit }) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Filter and Sort Expenses
  const filteredExpenses = useMemo(() => {
    let result = expenses;

    if (startDate) {
      result = result.filter(e => e.date >= startDate);
    }

    if (endDate) {
      result = result.filter(e => e.date <= endDate);
    }

    return result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [expenses, startDate, endDate]);

  const totalFiltered = useMemo(() => {
    return filteredExpenses.reduce((acc, curr) => acc + curr.amount, 0);
  }, [filteredExpenses]);

  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
  };

  const formatDate = (dateString: string) => {
    // Manually parse YYYY-MM-DD to avoid timezone shifts
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('pt-BR');
  };

  if (expenses.length === 0) {
    return (
        <div className="text-center py-20 bg-white rounded-2xl shadow-sm animate-fade-in">
            <p className="text-gray-400 text-lg">Nenhuma despesa registrada.</p>
            <p className="text-gray-300 text-sm mt-2">Comece adicionando seus gastos!</p>
        </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Histórico</h2>
        
        {/* Date Filters */}
        <div className="flex flex-col sm:flex-row gap-2 bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center text-gray-500 mb-2 sm:mb-0">
                <Filter size={16} className="mr-2" />
                <span className="text-sm font-medium mr-2">Período:</span>
            </div>
            
            <div className="flex items-center gap-2">
                <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="px-2 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-600 bg-white"
                />
                <span className="text-gray-400">até</span>
                <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="px-2 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-600 bg-white"
                />
                
                {(startDate || endDate) && (
                    <button
                        onClick={clearFilters}
                        className="ml-2 p-1.5 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-full transition"
                        title="Limpar filtros"
                    >
                        <X size={16} />
                    </button>
                )}
            </div>
        </div>
      </div>

      {/* Filter Summary */}
      {(startDate || endDate) && (
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex justify-between items-center text-blue-900 animate-fade-in">
              <span className="text-sm">
                  {filteredExpenses.length} {filteredExpenses.length === 1 ? 'registro encontrado' : 'registros encontrados'}
              </span>
              <div className="text-right">
                  <span className="text-xs text-blue-600 uppercase font-semibold tracking-wide">Total no Período</span>
                  <p className="text-xl font-bold">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalFiltered)}
                  </p>
              </div>
          </div>
      )}

      <div className="grid gap-4">
        {filteredExpenses.length > 0 ? (
          filteredExpenses.map((expense) => (
            <div 
                key={expense.id} 
                className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col transition hover:shadow-md group cursor-pointer"
                onClick={() => onEdit(expense)}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                      <h3 className="font-semibold text-gray-900 text-lg group-hover:text-blue-600 transition-colors">{expense.description}</h3>
                      <span className="font-bold text-gray-900 ml-4">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(expense.amount)}
                      </span>
                  </div>
                  <div className="flex items-center text-sm text-gray-500 mt-1 gap-3 flex-wrap">
                    <span className="flex items-center bg-gray-100 px-2 py-0.5 rounded text-xs font-medium text-gray-600">
                        <Tag size={12} className="mr-1" /> {expense.category}
                    </span>
                    <span className="flex items-center">
                        <Calendar size={12} className="mr-1" />
                        {formatDate(expense.date)}
                    </span>
                  </div>
                  
                  {expense.observations && (
                    <div className="mt-2 text-xs text-gray-500 flex items-start bg-gray-50 p-2 rounded-lg italic">
                      <AlignLeft size={12} className="mr-1 mt-0.5 flex-shrink-0" />
                      {expense.observations}
                    </div>
                  )}
                </div>
                
                <div className="flex gap-1 ml-4 self-start">
                    <button
                      onClick={(e) => {
                          e.stopPropagation();
                          onEdit(expense);
                      }}
                      className="p-2 text-gray-400 hover:bg-blue-50 hover:text-blue-600 rounded-full transition"
                      title="Editar"
                    >
                      <Pencil size={18} />
                    </button>
                    <button
                      onClick={(e) => {
                          e.stopPropagation();
                          onDelete(expense.id);
                      }}
                      className="p-2 text-gray-400 hover:bg-red-50 hover:text-red-600 rounded-full transition"
                      title="Excluir"
                    >
                      <Trash2 size={18} />
                    </button>
                </div>
              </div>
            </div>
          ))
        ) : (
            <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-200">
                <p className="text-gray-400">Nenhum gasto encontrado neste período.</p>
                <button onClick={clearFilters} className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium">
                    Limpar filtros
                </button>
            </div>
        )}
      </div>
    </div>
  );
};

export default ExpenseList;