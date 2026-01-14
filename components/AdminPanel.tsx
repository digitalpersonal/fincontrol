
import React, { useState } from 'react';
import { User } from '../types';
import { UserPlus, Users, ShieldCheck, Mail, Lock, User as UserIcon, Trash2, X, MessageCircle, Eye, EyeOff, CheckCircle } from 'lucide-react';

interface AdminPanelProps {
  users: User[];
  onAddUser: (user: User) => Promise<boolean>; // Changed return type to Promise<boolean>
  onDeleteUser: (id: string) => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ users, onAddUser, onDeleteUser }) => {
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

  const handleSubmit = async (e: React.FormEvent) => { // Made async
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) {
      alert("Por favor, preencha todos os campos.");
      return;
    }

    // Capture the password before clearing the state for the WhatsApp message
    const currentPassword = password.trim(); 

    const success = await onAddUser({ // Await the result
      id: crypto.randomUUID(), // This ID will be ignored by App.tsx, but required by type
      name: name.trim(),
      email: email.trim(),
      password: currentPassword, // Pass the actual password for creation
      role: 'USER' // New users are always 'USER'
    });

    if (success) {
      // Store credentials for the temporary success message and WhatsApp option
      setLastCreatedUserCredentials({ name: name.trim(), email: email.trim(), password: currentPassword });
      setName('');
      setEmail('');
      setPassword('');
      setShowAdd(false); // Close the add form
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
        <button 
          onClick={() => { setShowAdd(!showAdd); setLastCreatedUserCredentials(null); }} // Clear success message when toggling form
          className="bg-blue-600 text-white p-3 rounded-2xl shadow-lg hover:bg-blue-700 transition active:scale-95"
        >
          {showAdd ? <X size={24} /> : <UserPlus size={24} />}
        </button>
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
                                onClick={() => handleSendWhatsApp(u.name, u.email, u.password)} // u.password will be '***' for existing users
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
