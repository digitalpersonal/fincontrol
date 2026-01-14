
import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Lock, Mail, LogIn, ShieldAlert, MessageCircle, Loader2, Eye, EyeOff, UserPlus } from 'lucide-react';

const ADMIN_EMAIL = 'digitalpersonal@gmail.com'; // Definido como o e-mail do administrador master

const Login: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      if (isSignUp) {
        // Apenas o e-mail do administrador master pode se cadastrar
        if (email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
          setError("O cadastro de novos usuários é feito exclusivamente pelo administrador do sistema. Fale com ele para criar sua conta.");
          return; // Impede o signup
        }

        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });

        if (signUpError) {
          if (signUpError.message.includes('User already registered')) {
            setError('Conta de administrador já existe. Por favor, faça login.');
          } else {
            setError(signUpError.message);
          }
        } else {
          setSuccess('Conta de administrador criada com sucesso! Você já pode fazer login.');
          setIsSignUp(false); // Redireciona para o login após o cadastro bem-sucedido
        }
      } else {
        const { error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (authError) {
          if (authError.message === 'Invalid login credentials') {
            setError('E-mail ou senha incorretos. Verifique seus dados ou fale com o administrador.');
          } else {
            setError(authError.message);
          }
        }
      }
    } catch (err: any) {
      setError('Ocorreu um erro inesperado. Tente novamente.');
      console.error(err);
    } finally {
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
            {isSignUp ? <UserPlus size={32} /> : <LogIn size={32} />}
          </div>
          <h1 className="text-3xl font-black text-gray-800">FinControl<span className="text-blue-600">AI</span></h1>
          <p className="text-gray-500 mt-2 font-medium">
            {isSignUp ? 'Cadastro do Administrador Geral' : 'Acesse seu painel financeiro'}
          </p>
        </div>

        <div className="flex p-1 bg-gray-100 rounded-2xl mb-6">
          <button 
            onClick={() => { setIsSignUp(false); setError(null); setSuccess(null); }}
            className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition ${!isSignUp ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400'}`}
          >
            Entrar
          </button>
          {/* A aba Cadastrar permanece visível para que o ADMIN_EMAIL possa se cadastrar inicialmente */}
          <button 
            onClick={() => { setIsSignUp(true); setError(null); setSuccess(null); }}
            className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition ${isSignUp ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400'}`}
          >
            Cadastrar
          </button>
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
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-12 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                placeholder="••••••••"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 transition"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-bold border border-red-100 animate-fade-in">
              <ShieldAlert size={18} className="flex-shrink-0" />
              <span className="break-words">{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 p-4 bg-emerald-50 text-emerald-600 rounded-2xl text-sm font-bold border border-emerald-100 animate-fade-in">
              <LogIn size={18} className="flex-shrink-0" />
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-blue-600 text-white font-black rounded-2xl shadow-xl hover:bg-blue-700 active:scale-95 transition-all text-lg flex justify-center items-center"
          >
            {loading ? <Loader2 className="animate-spin mr-2" /> : (isSignUp ? 'CRIAR MINHA CONTA' : 'ENTRAR NO SISTEMA')}
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
              Conexão Segura • Acesso Restrito
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
