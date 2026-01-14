
import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Lock, Mail, LogIn, ShieldAlert, MessageCircle, Loader2 } from 'lucide-react';

interface LoginProps {
  onLogin: (email: string, pass: string) => boolean;
}

const Login: React.FC<LoginProps> = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message === 'Invalid login credentials' ? 'E-mail ou senha incorretos.' : authError.message);
      setLoading(false);
    }
  };

  const handleSupport = () => {
    const message = encodeURIComponent("Olá! Estou com problemas para acessar o FinControl AI. Poderia me ajudar?");
    window.open(`https://wa.me/5535991048020?text=${message}`, '_blank');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 border border-gray-100 animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl text-white mb-4 shadow-lg">
            <LogIn size={32} />
          </div>
          <h1 className="text-3xl font-black text-gray-800">FinControl<span className="text-blue-600">AI</span></h1>
          <p className="text-gray-500 mt-2 font-medium">Acesse seu painel financeiro</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">E-mail</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                placeholder="seu@email.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Senha</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                placeholder="••••••••"
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-bold border border-red-100 animate-fade-in">
              <ShieldAlert size={18} />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-blue-600 text-white font-black rounded-2xl shadow-xl hover:bg-blue-700 active:scale-95 transition-all text-lg flex justify-center items-center"
          >
            {loading ? <Loader2 className="animate-spin mr-2" /> : 'ENTRAR NO SISTEMA'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-50 flex flex-col items-center gap-3 text-center">
          <button 
            onClick={handleSupport}
            className="text-xs font-bold text-gray-400 hover:text-emerald-600 flex items-center gap-1.5 transition-colors uppercase tracking-wider"
          >
            <MessageCircle size={14} /> Problemas com acesso? Fale com o suporte
          </button>
          
          <div className="space-y-4">
            <p className="text-[9px] text-gray-300 font-medium italic uppercase tracking-widest">
              Conexão Segura via Supabase • Acesso Restrito
            </p>
            
            <div className="pt-2 space-y-1">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-tight">
                Desenvolvido por Multiplus - Sistemas Inteligentes
              </p>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-tight">
                Silvio T. de Sá Filho
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
