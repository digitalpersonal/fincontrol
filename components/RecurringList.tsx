
import React from 'react';
import { RecurringExpense } from '../types';
import { CalendarClock, Trash2, Tag, ArrowRight } from 'lucide-react';

interface RecurringListProps {
  recurringExpenses: RecurringExpense[];
  onDelete: (id: string) => void;
}

const RecurringList: React.FC<RecurringListProps> = ({ recurringExpenses, onDelete }) => {
  
  const formatDate = (dateString: string) => {
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('pt-BR');
  };

  const getFrequencyLabel = (freq: string) => {
    switch(freq) {
        case 'WEEKLY': return 'Semanal';
        case 'MONTHLY': return 'Mensal';
        case 'YEARLY': return 'Anual';
        default: return freq;
    }
  };

  if (recurringExpenses.length === 0) {
    return (
        <div className="text-center py-20 bg-white rounded-2xl shadow-sm animate-fade-in">
            <div className="flex justify-center mb-4 text-blue-200">
                <CalendarClock size={64} />
            </div>
            <p className="text-gray-400 text-lg">Nenhuma despesa recorrente ativa.</p>
            <p className="text-gray-300 text-sm mt-2">Adicione uma despesa e marque a opção "Repetir despesa".</p>
        </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-2xl font-bold text-gray-800">Despesas Recorrentes</h2>
      <p className="text-gray-600">
          Estas despesas são geradas automaticamente na data de vencimento.
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        {recurringExpenses.map((rec) => (
            <div key={rec.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between transition hover:shadow-md border-l-4 border-l-blue-500">
                <div>
                    <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-gray-800 text-lg">{rec.description}</h3>
                        <span className="font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded text-sm">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(rec.amount)}
                        </span>
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-500 mb-4 gap-2">
                        <span className="flex items-center bg-gray-100 px-2 py-0.5 rounded text-xs font-medium text-gray-600">
                            <Tag size={12} className="mr-1" /> {rec.category}
                        </span>
                        <span className="flex items-center bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-xs font-medium">
                            <CalendarClock size={12} className="mr-1" /> {getFrequencyLabel(rec.frequency)}
                        </span>
                    </div>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-gray-100 mt-2">
                    <div className="flex items-center text-sm text-gray-600">
                        <span className="text-xs text-gray-400 uppercase mr-2">Próxima:</span>
                        <span className="font-medium">{formatDate(rec.nextDueDate)}</span>
                    </div>
                    
                    <button
                        onClick={() => onDelete(rec.id)}
                        className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition flex items-center text-sm font-medium"
                    >
                        <Trash2 size={16} className="mr-1" /> Parar
                    </button>
                </div>
            </div>
        ))}
      </div>
    </div>
  );
};

export default RecurringList;
