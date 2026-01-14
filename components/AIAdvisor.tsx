import React, { useState } from 'react';
import { Expense } from '../types';
import { getFinancialAdvice } from '../services/geminiService';
import { Sparkles, RefreshCw, AlertCircle } from 'lucide-react';

interface AIAdvisorProps {
  expenses: Expense[];
}

const AIAdvisor: React.FC<AIAdvisorProps> = ({ expenses }) => {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    setLoading(true);
    const result = await getFinancialAdvice(expenses);
    setAnalysis(result);
    setLoading(false);
  };

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-6 rounded-2xl border border-blue-100">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          <Sparkles className="text-indigo-600 mr-2" />
          Consultor Inteligente
        </h2>
        {!analysis && (
             <button
             onClick={handleAnalyze}
             disabled={loading}
             className={`px-6 py-2 rounded-xl text-white font-medium shadow-md transition flex items-center ${
               loading ? 'bg-indigo-300 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
             }`}
           >
             {loading ? <RefreshCw className="animate-spin mr-2" size={18} /> : null}
             {loading ? 'Analisando...' : 'Gerar Análise'}
           </button>
        )}
      </div>

      {!analysis && !loading && (
        <div className="text-center py-10">
          <p className="text-gray-600 mb-4">
            Utilize a inteligência artificial do Gemini para encontrar oportunidades de economia nos seus gastos com carro e utilidades.
          </p>
          <div className="flex justify-center text-indigo-200">
            <Sparkles size={64} opacity={0.5} />
          </div>
        </div>
      )}

      {loading && (
        <div className="text-center py-12">
             <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-2"></div>
             <p className="text-gray-600 animate-pulse">Lendo seus gastos e calculando métricas...</p>
        </div>
      )}

      {analysis && (
        <div className="animate-fade-in bg-white p-6 rounded-xl shadow-sm border border-indigo-100">
          <div className="prose prose-blue max-w-none text-gray-700 whitespace-pre-wrap leading-relaxed">
            {analysis}
          </div>
          <div className="mt-6 flex justify-end">
            <button 
                onClick={handleAnalyze}
                className="text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center"
            >
                <RefreshCw size={14} className="mr-1" /> Atualizar Análise
            </button>
          </div>
        </div>
      )}
      
      {expenses.length === 0 && !loading && (
          <div className="mt-4 flex items-center p-4 bg-yellow-50 text-yellow-700 rounded-lg text-sm">
            <AlertCircle size={16} className="mr-2" />
            Adicione despesas para obter uma análise precisa.
          </div>
      )}
    </div>
  );
};

export default AIAdvisor;
