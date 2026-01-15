
import React, { useState } from 'react';
import { User } from '../types';
import { UserPlus, Users, ShieldCheck, Mail, Lock, User as UserIcon, Trash2, X, MessageCircle, Eye, EyeOff, CheckCircle, Ban, Unlock, RefreshCw } from 'lucide-react';

interface AdminPanelProps {
  users: User[];
  onAddUser: (user: User) => Promise<boolean>;
  onDeleteUser: (id: string) => void;
  onToggleStatus: (id: string, newStatus: 'ACTIVE' | 'BLOCKED') => void;
  onRefresh?: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ users, onAddUser, onDeleteUser, onToggleStatus, onRefresh }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [lastCreatedUserCredentials, setLastCreatedUserCredentials] = useState<{name: string, email: string, password: string} | null>(null);


  const APP_URL = window.location.origin;

  const handleSendWhatsApp = (userName: string, userEmail: string, userPassword?: string) => {
    // Determine the password text based on availability and value
    const passwordLine = userPassword && userPassword !== '***' 
        ? `🔑 *Senha:* ${userPassword}` 
        : `🔑 *Senha:* (Definida no cadastro. Se esqueceu, use "Esqueci a senha")`;

    const message = `Olá *${userName}*, aqui estão seus dados de acesso ao *FinControl AI*:\n\n🌐 *Endereço:* ${APP_URL}\n📧 *E-mail:* ${userEmail}\n${passwordLine}\n\nBons ganhos! 🚀`;
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
  };

  const handleSubmit = async (e: React.FormEvent) => { 
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) {
      alert("Por favor, preencha todos os campos.");
      return;
    }

    const currentPassword = password.trim(); 

    const success = await onAddUser({ 
      id: crypto.randomUUID(), 
      name: name.trim(),
      email: email.trim(),
      password: currentPassword, 
      role: 'USER',
      status: 'ACTIVE'
    });

    if (success) {
      setLastCreatedUserCredentials({ name: name.trim(), email: email.trim(), password: currentPassword });
      setName('');
      setEmail('');
      setPassword('');
      setShowAdd(false); 
    }
  };


  return (
    <div className="space-y-6 animate-fade-in pb-24">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-gray-800 flex items-center">
            <ShieldCheck className="mr-2 text-blue-600" /> Gestão de Usuários
          </h2>
          <p className="text-gray-500 text-sm font-medium">Administração central do sistema</p>
        </div>
        <div className="flex gap-2">
            {onRefresh && (
                <button 
                  onClick={onRefresh}
                  className="bg-white text-gray-500 p-3 rounded-2xl shadow-sm border border-gray-100 hover:text-blue-600 hover:border-blue-100 transition"
                  title="Atualizar Lista"
                >
                  <RefreshCw size={24} />
                </button>
            )}
            <button 
              onClick={() => { setShowAdd(!showAdd); setLastCreatedUserCredentials(null); }} 
              className="bg-blue-600 text-white p-3 rounded-2xl shadow-lg hover:bg-blue-700 transition active:scale-95"
            >
              {showAdd ? <X size={24} /> : <UserPlus size={24} />}
            </button>
        </div>
      </div>

      {lastCreatedUserCredentials && (
        <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100 space-y-4 animate-fade-in">
          <h3 className="font-bold text-emerald-800 flex items-center"><CheckCircle size={20} className="mr-2" /> Cliente Criado!</h3>
          <p className="text-sm text-emerald-700">Dados de acesso para <span className="font-semibold">{lastCreatedUserCredentials.name}</span>:</p>
          <div className="bg-white p-3 rounded-xl border border-emerald-100 font-mono text-xs overflow-x-auto break-words">
            <p className="mb-1">Email: <span className="font-semibold text-gray-800">{lastCreatedUserCredentials.email}</span></p>
            <p>Senha: <span className="font-semibold text-gray-800">{lastCreatedUserCredentials.password}</span></p>
          </div>
          <button 
            onClick={() => handleSendWhatsApp(lastCreatedUserCredentials.name, lastCreatedUserCredentials.email, lastCreatedUserCredentials.password)}
            className="w-full py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition flex items-center justify-center"
          >
            <MessageCircle size={18} className="mr-2" /> Enviar Acesso via WhatsApp
          </button>
          <button 
            onClick={() => setLastCreatedUserCredentials(null)}
            className="w-full py-2 text-gray-600 hover:text-gray-800 text-sm font-medium"
          >
            Fechar Mensagem
          </button>
        </div>
      )}

      {showAdd && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-3xl shadow-xl border border-blue-50 space-y-4 animate-fade-in">
          <h3 className="font-black text-gray-800 text-lg">Criar Novo Cliente</h3>
          
          <div className="space-y-3">
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase block mb-1">Nome do Cliente</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input 
                  type="text" value={name} onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Nome Completo do Cliente"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase block mb-1">E-mail (Login)</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="email@acesso.com"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase block mb-1">Senha Inicial</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input 
                    type={showPassword ? "text" : "password"}
                    value={password} onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="••••••••"
                    required
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 transition"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <button 
            type="submit"
            className="w-full py-4 bg-blue-600 text-white font-black rounded-xl shadow-lg hover:bg-blue-700 transition active:scale-95"
          >
            CONFIRMAR CRIAÇÃO
          </button>
        </form>
      )}

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 bg-gray-50 border-b flex items-center justify-between">
            <h3 className="font-black text-gray-500 text-xs uppercase tracking-widest flex items-center">
                <Users size={14} className="mr-2" /> Clientes Ativos ({users.length})
            </h3>
        </div>
        
        {users.length === 0 && (
            <div className="p-8 text-center">
                <p className="text-gray-400 text-sm mb-2">Nenhum cliente encontrado.</p>
                <p className="text-gray-300 text-xs">Verifique as permissões ou clique em Atualizar.</p>
            </div>
        )}

        <div className="divide-y divide-gray-100">
            {users.map(u => {
                const isBlocked = u.status === 'BLOCKED';
                return (
                    <div key={u.id} className={`p-4 flex justify-between items-center transition ${isBlocked ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-gray-50'}`}>
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-sm relative ${u.role === 'ADMIN' ? 'bg-indigo-600' : (isBlocked ? 'bg-red-400' : 'bg-blue-400')}`}>
                                {u.name.charAt(0).toUpperCase()}
                                {isBlocked && (
                                    <div className="absolute -bottom-1 -right-1 bg-red-600 rounded-full p-0.5 border border-white">
                                        <Ban size={10} className="text-white" />
                                    </div>
                                )}
                            </div>
                            <div>
                                <p className={`font-bold leading-tight ${isBlocked ? 'text-red-800' : 'text-gray-800'}`}>
                                    {u.name} {u.role === 'ADMIN' && '(Admin)'}
                                </p>
                                <p className={`text-xs ${isBlocked ? 'text-red-500' : 'text-gray-400'}`}>{u.email}</p>
                                <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded mt-1 inline-block ${
                                    isBlocked 
                                        ? 'bg-red-200 text-red-800' 
                                        : (u.role === 'ADMIN' ? 'bg-indigo-100 text-indigo-600' : 'bg-blue-100 text-blue-600')
                                }`}>
                                    {isBlocked ? 'BLOQUEADO' : u.role}
                                </span>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            {u.role !== 'ADMIN' && (
                                <>
                                    <button 
                                        onClick={() => onToggleStatus(u.id, isBlocked ? 'ACTIVE' : 'BLOCKED')}
                                        className={`p-2 rounded-lg transition ${
                                            isBlocked 
                                                ? 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200' 
                                                : 'bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-600'
                                        }`}
                                        title={isBlocked ? "Desbloquear Acesso" : "Bloquear Acesso (Inadimplência)"}
                                    >
                                        {isBlocked ? <Unlock size={18} /> : <Ban size={18} />}
                                    </button>

                                    <button 
                                        onClick={() => handleSendWhatsApp(u.name, u.email, u.password)}
                                        className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-lg transition"
                                        title="Enviar acesso via WhatsApp"
                                    >
                                        <MessageCircle size={18} />
                                    </button>
                                    
                                    <button 
                                        onClick={() => onDeleteUser(u.id)}
                                        className="p-2 text-gray-300 hover:text-red-500 rounded-lg transition"
                                        title="Excluir usuário"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
