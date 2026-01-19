
import React, { useState } from 'react';
import { CreditEntry } from '../types';
import { CreditCard, Plus, Trash2, Calendar, Banknote, AlertCircle, CheckCircle2, Wallet, X, Save, Pencil } from 'lucide-react';

interface CreditHistoryProps {
  credits: CreditEntry[];
  onAddCredit: (entry: CreditEntry) => void;
  onDeleteCredit: (id: string) => void;
  onUpdateCredit: (entry: CreditEntry) => void;
}

const CreditHistory: React.FC<CreditHistoryProps> = ({ credits, onAddCredit, onDeleteCredit, onUpdateCredit }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [description, setDescription] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [paidAmount, setPaidAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [category, setCategory] = useState<CreditEntry['category']>('Cartão');
  
  const [payingEntryId, setPayingEntryId] = useState<string | null>(null);
  const [paymentInput, setPaymentInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !totalAmount || !dueDate) return;

    const total = parseFloat(totalAmount);
    const paid = parseFloat(paidAmount) || 0;

    const entry: CreditEntry = {
      id: editingId || crypto.randomUUID(),
      description,
      totalAmount: total,
      paidAmount: paid,
      remainingBalance: Math.max(0, total - paid),
      dueDate,
      category
    };

    onAddCredit(entry);
    resetForm();
  };

  const resetForm = () => {
    setDescription('');
    setTotalAmount('');
    setPaidAmount('');
    setDueDate('');
    setCategory('Cartão');
    setShowForm(false);
    setEditingId(null);
  };

  const startEdit = (credit: CreditEntry) => {
    setEditingId(credit.id);
    setDescription(credit.description);
    setTotalAmount(credit.totalAmount.toString());
    setPaidAmount(credit.paidAmount.toString());
    setDueDate(credit.dueDate);
    setCategory(credit.category);
    setShowForm(true);
  };

  const handleRegisterPayment = (credit: CreditEntry) => {
    const payment = parseFloat(paymentInput) || 0;
    if (payment <= 0) return;
    const newPaidAmount = credit.paidAmount + payment;
    onUpdateCredit({ ...credit, paidAmount: newPaidAmount, remainingBalance: Math.max(0, credit.totalAmount - newPaidAmount) });
    setPayingEntryId(null);
    setPaymentInput('');
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  const formatDate = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('pt-BR');
  };

  const totalDebt = credits.reduce((acc, curr) => acc + curr.remainingBalance, 0);

  return (
    <div className="space-y-6 animate-fade-in pb-24">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-gray-800 flex items-center">
            <CreditCard className="mr-2 text-indigo-600" /> Crédito & Dívidas
          </h2>
          <p className="text-gray-500 text-sm">Controle seus financiamentos e parcelas</p>
        </div>
        <button 
          onClick={() => (showForm ? resetForm() : setShowForm(true))}
          className="bg-indigo-600 text-white p-3 rounded-xl shadow-lg hover:bg-indigo-700 transition"
        >
          {showForm ? <X size={24} /> : <Plus size={24} />}
        </button>
      </div>

      <div className="bg-white p-6 rounded-2xl border flex items-center justify-between shadow-sm">
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Saldo Devedor Total</p>
          <p className="text-3xl font-black text-rose-600">{formatCurrency(totalDebt)}</p>
        </div>
        <div className="p-4 bg-rose-50 rounded-full text-rose-500"><Banknote size={32} /></div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-xl border border-indigo-100 space-y-4 animate-fade-in">
          <h3 className="font-bold text-gray-800">{editingId ? 'Editar Registro' : 'Novo Registro de Crédito'}</h3>
          <div className="space-y-3">
            <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="Descrição" className="w-full p-3 border rounded-xl" />
            <div className="grid grid-cols-2 gap-3">
              <input type="number" step="0.01" value={totalAmount} onChange={e => setTotalAmount(e.target.value)} placeholder="Total" className="w-full p-3 border rounded-xl" />
              <input type="number" step="0.01" value={paidAmount} onChange={e => setPaidAmount(e.target.value)} placeholder="Já Pago" className="w-full p-3 border rounded-xl" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full p-3 border rounded-xl" />
              <select value={category} onChange={e => setCategory(e.target.value as any)} className="w-full p-3 border rounded-xl bg-white">
                <option value="Empréstimo">Empréstimo</option>
                <option value="Financiamento">Financiamento</option>
                <option value="Cartão">Cartão</option>
                <option value="Outros">Outros</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="flex-1 py-4 bg-indigo-600 text-white font-black rounded-xl">SALVAR</button>
            <button type="button" onClick={resetForm} className="px-6 py-4 bg-gray-100 text-gray-600 rounded-xl">CANCELAR</button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {credits.sort((a,b) => a.dueDate.localeCompare(b.dueDate)).map(credit => {
            const progress = (credit.paidAmount / credit.totalAmount) * 100;
            const isFullyPaid = credit.remainingBalance <= 0;
            const isPayingThis = payingEntryId === credit.id;

            return (
              <div key={credit.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 transition hover:shadow-md">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded uppercase bg-blue-100 text-blue-600">{credit.category}</span>
                    <h4 className="font-bold text-gray-800 text-lg mt-1">{credit.description}</h4>
                  </div>
                  <div className="flex gap-1">
                    {!isFullyPaid && <button onClick={() => setPayingEntryId(credit.id)} className="p-2 text-indigo-400"><Wallet size={18} /></button>}
                    <button onClick={() => startEdit(credit)} className="p-2 text-gray-400 hover:text-blue-600"><Pencil size={18} /></button>
                    <button onClick={() => onDeleteCredit(credit.id)} className="p-2 text-gray-400 hover:text-red-500"><Trash2 size={18} /></button>
                  </div>
                </div>

                <div className="flex justify-between mb-4">
                  <div><p className="text-[10px] text-gray-400 font-bold">RESTANTE</p><p className="font-black text-rose-600">{formatCurrency(credit.remainingBalance)}</p></div>
                  <div className="text-right"><p className="text-[10px] text-gray-400 font-bold">VENCIMENTO</p><p className="font-bold text-gray-700">{formatDate(credit.dueDate)}</p></div>
                </div>

                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden mb-1">
                    <div className={`h-full bg-indigo-500 transition-all`} style={{ width: `${Math.min(100, progress)}%` }}></div>
                </div>
                <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase">
                    <span>{formatCurrency(credit.paidAmount)} PAGO</span>
                    <span>TOTAL {formatCurrency(credit.totalAmount)}</span>
                </div>

                {isPayingThis && (
                    <div className="mt-4 p-4 bg-indigo-50 rounded-xl border border-indigo-100 flex gap-2">
                        <input type="number" step="0.01" value={paymentInput} onChange={e => setPaymentInput(e.target.value)} placeholder="Valor" className="flex-1 p-2 border rounded-lg text-sm" />
                        <button onClick={() => handleRegisterPayment(credit)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold">PAGAR</button>
                        <button onClick={() => setPayingEntryId(null)} className="p-2"><X size={18} /></button>
                    </div>
                )}
              </div>
            );
        })}
        {credits.length === 0 && <div className="text-center py-12 border-2 border-dashed rounded-2xl text-gray-400">Nenhum registro encontrado.</div>}
      </div>
    </div>
  );
};

export default CreditHistory;
