
import React, { useState, useMemo } from 'react';
import { Earning } from '../types';
import { Trash2, Calendar, Tag, Filter, X, Pencil } from 'lucide-react';

interface EarningListProps {
  earnings: Earning[];
  onDelete: (id: string) => void;
  onEdit: (earning: Earning) => void;
}

const EarningList: React.FC<EarningListProps> = ({ earnings, onDelete, onEdit }) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const filtered = useMemo(() => {
    let res = [...earnings];
    if (startDate) res = res.filter(e => e.date >= startDate);
    if (endDate) res = res.filter(e => e.date <= endDate);
    return res.sort((a, b) => b.date.localeCompare(a.date));
  }, [earnings, startDate, endDate]);

  const total = filtered.reduce((acc, curr) => acc + curr.amount, 0);

  const formatDate = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('pt-BR');
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Histórico de Ganhos</h2>
        <div className="flex gap-2 bg-white p-2 rounded-xl border items-center">
            <Filter size={16} className="text-gray-400" />
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="text-xs border-none outline-none" />
            <span className="text-gray-300">|</span>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="text-xs border-none outline-none" />
            {(startDate || endDate) && <button onClick={() => { setStartDate(''); setEndDate(''); }} className="text-gray-400"><X size={14} /></button>}
        </div>
      </div>

      <div className="bg-emerald-600 p-4 rounded-2xl text-white shadow-lg">
        <p className="text-xs font-bold uppercase opacity-80">Total de Ganhos</p>
        <p className="text-2xl font-black">R$ {total.toFixed(2)}</p>
      </div>

      <div className="grid gap-3">
        {filtered.map(earning => (
          <div key={earning.id} className="bg-white p-4 rounded-xl border flex justify-between items-center group">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded uppercase tracking-tighter">
                  {earning.category}
                </span>
                <span className="text-[10px] text-gray-400 flex items-center"><Calendar size={10} className="mr-1" /> {formatDate(earning.date)}</span>
              </div>
              <h3 className="font-bold text-gray-800">{earning.description}</h3>
            </div>
            <div className="flex items-center gap-4">
              <p className="font-black text-emerald-600 text-lg">R$ {earning.amount.toFixed(2)}</p>
              <div className="flex gap-1">
                <button onClick={() => onEdit(earning)} className="p-2 text-gray-400 hover:text-blue-600 transition"><Pencil size={18} /></button>
                <button onClick={() => onDelete(earning.id)} className="p-2 text-gray-400 hover:text-red-600 transition"><Trash2 size={18} /></button>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-center py-10 text-gray-400">Nenhum ganho registrado.</p>}
      </div>
    </div>
  );
};

export default EarningList;
