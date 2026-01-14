
import React, { useState } from 'react';
import { User } from '../types';
import { UserPlus, Users, ShieldCheck, Mail, Lock, User as UserIcon, Trash2, X, MessageCircle, Eye, EyeOff } from 'lucide-react';

interface AdminPanelProps {
  users: User[];
  onAddUser: (user: User) => void;
  onDeleteUser: (id: string) => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ users, onAddUser, onDeleteUser }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const APP_URL = window.location.origin;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) return;

    onAddUser({
      id: crypto.randomUUID(),
      name,
      email,
      password,
      role: 'USER'
    });

    setName('');
    setEmail('');
    setPassword('');
    setShowAdd(false);
  };

  const handleSendWhatsApp = (user: User) => {
    const message = `Olá *${user.name}*, aqui estão seus dados de acesso ao *FinControl AI*:\n\n🌐 *Endereço:* ${APP_URL}\n📧 *E-mail:* ${user.email}\n🔑 *Senha:* ${user.password}\n\nBons ganhos! 🚀`;
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
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
        <button 
          onClick={() => setShowAdd(!showAdd)}
          className="bg-blue-600 text-white p-3 rounded-2xl shadow-lg hover:bg-blue-700 transition active:scale-95"
        >
          {showAdd ? <X size={24} /> : <UserPlus size={24} />}
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-3xl shadow-xl border border-blue-50 space-y-4 animate-fade-in">
          <h3 className="font-black text-gray-800 text-lg">Criar Novo Usuário</h3>
          
          <div className="space-y-3">
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase block mb-1">Nome do Motorista/Usuário</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input 
                  type="text" value={name} onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Nome Completo"
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
                <Users size={14} className="mr-2" /> Usuários Ativos ({users.length})
            </h3>
        </div>
        <div className="divide-y divide-gray-100">
            {users.map(u => (
                <div key={u.id} className="p-4 flex justify-between items-center hover:bg-gray-50 transition">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-sm ${u.role === 'ADMIN' ? 'bg-indigo-600' : 'bg-blue-400'}`}>
                            {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <p className="font-bold text-gray-800 leading-tight">{u.name}</p>
                            <p className="text-xs text-gray-400">{u.email}</p>
                            <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${u.role === 'ADMIN' ? 'bg-indigo-100 text-indigo-600' : 'bg-blue-100 text-blue-600'}`}>
                                {u.role}
                            </span>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {u.role !== 'ADMIN' && (
                            <button 
                                onClick={() => handleSendWhatsApp(u)}
                                className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-lg transition"
                                title="Enviar acesso via WhatsApp"
                            >
                                <MessageCircle size={18} />
                            </button>
                        )}
                        {u.role !== 'ADMIN' && (
                            <button 
                                onClick={() => onDeleteUser(u.id)}
                                className="p-2 text-gray-300 hover:text-red-500 rounded-lg transition"
                                title="Excluir usuário"
                            >
                                <Trash2 size={18} />
                            </button>
                        )}
                    </div>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
