
import React, { useState } from 'react';
import { CreditEntry } from '../types';
import { CreditCard, Plus, Trash2, Calendar, Banknote, AlertCircle, CheckCircle2, Wallet, X, Save } from 'lucide-react';

interface CreditHistoryProps {
  credits: CreditEntry[];
  onAddCredit: (entry: CreditEntry) => void;
  onDeleteCredit: (id: string) => void;
  onUpdateCredit: (entry: CreditEntry) => void;
}

const CreditHistory: React.FC<CreditHistoryProps> = ({ credits, onAddCredit, onDeleteCredit, onUpdateCredit }) => {
  const [showForm, setShowForm] = useState(false);
  const [description, setDescription] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [paidAmount, setPaidAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [category, setCategory] = useState<CreditEntry['category']>('Cartão');
  
  // State for recording a single payment
  const [payingEntryId, setPayingEntryId] = useState<string | null>(null);
  const [paymentInput, setPaymentInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !totalAmount || !dueDate) return;

    const total = parseFloat(totalAmount);
    const paid = parseFloat(paidAmount) || 0;

    const newEntry: CreditEntry = {
      id: crypto.randomUUID(),
      description,
      totalAmount: total,
      paidAmount: paid,
      remainingBalance: Math.max(0, total - paid),
      dueDate,
      category
    };

    onAddCredit(newEntry);
    resetForm();
  };

  const resetForm = () => {
    setDescription('');
    setTotalAmount('');
    setPaidAmount('');
    setDueDate('');
    setCategory('Cartão');
    setShowForm(false);
  };

  const handleRegisterPayment = (credit: CreditEntry) => {
    const payment = parseFloat(paymentInput) || 0;
    if (payment <= 0) return;

    const newPaidAmount = credit.paidAmount + payment;
    const newRemainingBalance = Math.max(0, credit.totalAmount - newPaidAmount);

    onUpdateCredit({
      ...credit,
      paidAmount: newPaidAmount,
      remainingBalance: newRemainingBalance
    });

    setPayingEntryId(null);
    setPaymentInput('');
  };

  const handlePayFull = (credit: CreditEntry) => {
    onUpdateCredit({
      ...credit,
      paidAmount: credit.totalAmount,
      remainingBalance: 0
    });
    setPayingEntryId(null);
    setPaymentInput('');
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const formatDate = (dateString: string) => {
    const [y, m, d] = dateString.split('-').map(Number);
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
          onClick={() => {
            setShowForm(!showForm);
            setPayingEntryId(null);
          }}
          className="bg-indigo-600 text-white p-3 rounded-xl shadow-lg hover:bg-indigo-700 transition active:scale-95"
        >
          {showForm ? <X size={24} /> : <Plus size={24} />}
        </button>
      </div>

      {/* Summary Stats */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Saldo Devedor Total</p>
          <p className="text-3xl font-black text-rose-600">{formatCurrency(totalDebt)}</p>
        </div>
        <div className="p-4 bg-rose-50 rounded-full text-rose-500">
          <Banknote size={32} />
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-xl border border-indigo-100 space-y-4 animate-fade-in">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-gray-800">Novo Registro de Crédito</h3>
            <button type="button" onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
              <X size={20} />
            </button>
          </div>
          
          <div className="space-y-3">
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Descrição</label>
              <input 
                type="text" value={description} onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex: Financiamento Moto, Cartão NuBank..."
                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Valor Total</label>
                <input 
                  type="number" step="0.01" value={totalAmount} onChange={(e) => setTotalAmount(e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="0,00"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Valor Já Pago</label>
                <input 
                  type="number" step="0.01" value={paidAmount} onChange={(e) => setPaidAmount(e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="0,00"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Vencimento</label>
                <input 
                  type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Tipo</label>
                <select 
                  value={category} onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full p-3 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="Empréstimo">Empréstimo</option>
                  <option value="Financiamento">Financiamento</option>
                  <option value="Cartão">Cartão</option>
                  <option value="Outros">Outros</option>
                </select>
              </div>
            </div>
          </div>

          <button 
            type="submit"
            className="w-full py-4 bg-indigo-600 text-white font-black rounded-xl shadow-lg hover:bg-indigo-700 transition active:scale-95"
          >
            SALVAR REGISTRO
          </button>
        </form>
      )}

      <div className="space-y-4">
        <h3 className="font-bold text-gray-700 px-2 flex items-center">
          <AlertCircle size={16} className="mr-1 text-amber-500" /> Seus Compromissos
        </h3>
        
        {credits.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
            <p className="text-gray-400">Nenhum registro de crédito encontrado.</p>
          </div>
        ) : (
          credits.sort((a,b) => a.dueDate.localeCompare(b.dueDate)).map(credit => {
            const progress = (credit.paidAmount / credit.totalAmount) * 100;
            const isFullyPaid = credit.remainingBalance <= 0;
            const isPayingThis = payingEntryId === credit.id;

            return (
              <div key={credit.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 transition hover:shadow-md">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest ${
                        credit.category === 'Financiamento' ? 'bg-blue-100 text-blue-600' :
                        credit.category === 'Empréstimo' ? 'bg-purple-100 text-purple-600' :
                        'bg-amber-100 text-amber-600'
                      }`}>
                        {credit.category}
                      </span>
                      {isFullyPaid && <CheckCircle2 size={16} className="text-emerald-500" />}
                    </div>
                    <h4 className="font-bold text-gray-800 text-lg mt-1">{credit.description}</h4>
                  </div>
                  <div className="flex gap-1">
                    {!isFullyPaid && !isPayingThis && (
                        <button 
                            onClick={() => setPayingEntryId(credit.id)}
                            className="p-2 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                            title="Registrar Pagamento"
                        >
                            <Wallet size={18} />
                        </button>
                    )}
                    <button 
                        onClick={() => onDeleteCredit(credit.id)}
                        className="p-2 text-gray-300 hover:text-red-500 transition"
                        title="Excluir"
                    >
                        <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase">Restante</p>
                    <p className={`font-black ${isFullyPaid ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {formatCurrency(credit.remainingBalance)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-gray-400 font-bold uppercase">Vencimento</p>
                    <p className="font-bold text-gray-700 flex items-center justify-end">
                      <Calendar size={14} className="mr-1" /> {formatDate(credit.dueDate)}
                    </p>
                  </div>
                </div>

                <div className="space-y-1 mb-4">
                  <div className="flex justify-between text-[10px] font-bold text-gray-400">
                    <span>PROGRESSO DE PAGAMENTO</span>
                    <span>{progress.toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-1000 ${isFullyPaid ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                      style={{ width: `${Math.min(100, progress)}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-[10px] font-bold text-gray-500 mt-1">
                    <span>{formatCurrency(credit.paidAmount)} pago</span>
                    <span>Total {formatCurrency(credit.totalAmount)}</span>
                  </div>
                </div>

                {isPayingThis && (
                    <div className="mt-4 p-4 bg-indigo-50 rounded-xl border border-indigo-100 animate-fade-in space-y-3">
                        <div className="flex justify-between items-center">
                            <h5 className="text-xs font-bold text-indigo-700 uppercase">Registrar Pagamento</h5>
                            <button onClick={() => setPayingEntryId(null)} className="text-indigo-400 hover:text-indigo-600">
                                <X size={16} />
                            </button>
                        </div>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400 text-sm font-bold">R$</span>
                                <input 
                                    type="number" step="0.01" value={paymentInput} onChange={(e) => setPaymentInput(e.target.value)}
                                    placeholder="0,00" autoFocus
                                    className="w-full pl-9 pr-3 py-2 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold text-indigo-900"
                                />
                            </div>
                            <button 
                                onClick={() => handleRegisterPayment(credit)}
                                className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-indigo-700 transition flex items-center gap-1"
                            >
                                <Save size={16} /> Pagar
                            </button>
                        </div>
                        <div className="flex gap-2">
                            <button 
                                onClick={() => handlePayFull(credit)}
                                className="text-[10px] font-bold text-indigo-600 hover:underline uppercase"
                            >
                                Quitar Saldo Total ({formatCurrency(credit.remainingBalance)})
                            </button>
                        </div>
                    </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default CreditHistory;
