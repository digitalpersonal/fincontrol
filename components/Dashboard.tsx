
import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Expense, Earning } from '../types';
import { Wallet, TrendingUp, ArrowUpCircle, ArrowDownCircle, Banknote, Gauge } from 'lucide-react';

interface DashboardProps {
  expenses: Expense[];
  earnings: Earning[];
}

const BASE_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const Dashboard: React.FC<DashboardProps> = ({ expenses, earnings }) => {
  
  const totalExpenses = useMemo(() => expenses.reduce((acc, curr) => acc + curr.amount, 0), [expenses]);
  const totalEarnings = useMemo(() => earnings.reduce((acc, curr) => acc + curr.amount, 0), [earnings]);
  const balance = totalEarnings - totalExpenses;

  const fuelExpenses = useMemo(() => {
    return expenses
      .filter(e => e.category === 'Combustível')
      .reduce((acc, curr) => acc + curr.amount, 0);
  }, [expenses]);

  const chartData = useMemo(() => {
    const data: { [key: string]: number } = {};
    expenses.forEach(e => {
      data[e.category] = (data[e.category] || 0) + e.amount;
    });
    return Object.keys(data).map(key => ({
      name: key,
      value: data[key]
    }));
  }, [expenses]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Seu Balanço</h2>
          <p className="text-gray-500 text-sm">Resumo total acumulado</p>
        </div>
        <div className="text-right">
          <p className="text-xs font-semibold text-gray-400 uppercase">Lucro Líquido</p>
          <p className={`text-3xl font-black ${balance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {formatCurrency(balance)}
          </p>
        </div>
      </div>

      {/* Primary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100 flex items-center justify-between">
          <div>
            <p className="text-emerald-700 text-sm font-medium flex items-center">
              <ArrowUpCircle size={16} className="mr-1" /> Total Ganhos
            </p>
            <p className="text-2xl font-bold text-emerald-900">{formatCurrency(totalEarnings)}</p>
          </div>
          <div className="p-3 bg-white rounded-full text-emerald-500 shadow-sm">
            <Banknote size={28} />
          </div>
        </div>

        <div className="bg-rose-50 p-6 rounded-2xl border border-rose-100 flex items-center justify-between">
          <div>
            <p className="text-rose-700 text-sm font-medium flex items-center">
              <ArrowDownCircle size={16} className="mr-1" /> Total Gastos
            </p>
            <p className="text-2xl font-bold text-rose-900">{formatCurrency(totalExpenses)}</p>
          </div>
          <div className="p-3 bg-white rounded-full text-rose-500 shadow-sm">
            <TrendingUp size={28} />
          </div>
        </div>
      </div>

      {/* Driver Specific Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <p className="text-xs text-gray-400 font-bold uppercase mb-1">Combustível</p>
          <p className="text-lg font-bold text-gray-800">{formatCurrency(fuelExpenses)}</p>
          <div className="w-full bg-gray-100 h-1.5 rounded-full mt-2">
            <div 
              className="bg-orange-400 h-1.5 rounded-full" 
              style={{ width: `${Math.min(100, (fuelExpenses / (totalEarnings || 1)) * 100)}%` }}
            ></div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <p className="text-xs text-gray-400 font-bold uppercase mb-1">Margem</p>
          <p className="text-lg font-bold text-gray-800">
            {totalEarnings > 0 ? ((balance / totalEarnings) * 100).toFixed(1) : 0}%
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
           <p className="text-xs text-gray-400 font-bold uppercase mb-1">Manutenção</p>
           <p className="text-lg font-bold text-gray-800">
              {formatCurrency(expenses.filter(e => e.category === 'Manutenção').reduce((a, b) => a + b.amount, 0))}
           </p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
           <p className="text-xs text-gray-400 font-bold uppercase mb-1">Refeições</p>
           <p className="text-lg font-bold text-gray-800">
              {formatCurrency(expenses.filter(e => e.category === 'Alimentação').reduce((a, b) => a + b.amount, 0))}
           </p>
        </div>
      </div>

      {/* Distribution Chart */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <TrendingUp className="mr-2" size={20} /> Gastos por Categoria
        </h3>
        <div className="h-64 w-full">
          {expenses.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={BASE_COLORS[index % BASE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400 border-2 border-dashed border-gray-100 rounded-xl">
              Nenhuma despesa para exibir.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
