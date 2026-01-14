
import React, { useState, useEffect, useCallback } from 'react';
import { Expense, Earning, DailyKm, CreditEntry, User, ViewState, DEFAULT_CATEGORIES, RecurringExpense } from './types';
import Dashboard from './components/Dashboard';
import ExpenseForm from './components/ExpenseForm';
import ExpenseList from './components/ExpenseList';
import RecurringList from './components/RecurringList';
import AIAdvisor from './components/AIAdvisor';
import DailyFlow from './components/DailyFlow';
import CreditHistory from './components/CreditHistory';
import Login from './components/Login';
import AdminPanel from './components/AdminPanel';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import { LayoutDashboard, Plus, List, Sparkles, Menu, X, Wallet, CreditCard, ShieldCheck, LogOut, MessageCircle, Loader2, AlertTriangle } from 'lucide-react';

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Data States
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [earnings, setEarnings] = useState<Earning[]>([]);
  const [kmEntries, setKmEntries] = useState<DailyKm[]>([]);
  const [credits, setCredits] = useState<CreditEntry[]>([]);
  const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>([]);

  const [view, setView] = useState<ViewState>('DAILY_FLOW');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null);

  // Fetch initial data
  const fetchData = useCallback(async (userId: string) => {
    if (!isSupabaseConfigured) return;
    setLoading(true);
    try {
      const [
        { data: exp },
        { data: ear },
        { data: km },
        { data: cred },
        { data: rec },
        { data: prof }
      ] = await Promise.all([
        supabase.from('expenses').select('*').eq('user_id', userId),
        supabase.from('earnings').select('*').eq('user_id', userId),
        supabase.from('daily_km').select('*').eq('user_id', userId),
        supabase.from('credits').select('*').eq('user_id', userId),
        supabase.from('recurring_expenses').select('*').eq('user_id', userId),
        supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
      ]);

      if (exp) setExpenses(exp);
      if (ear) setEarnings(ear);
      if (km) setKmEntries(km);
      if (cred) setCredits(cred);
      if (rec) setRecurringExpenses(rec);
      if (prof) {
        setCurrentUser({
          id: prof.id,
          name: prof.name || 'Usuário',
          email: session?.user?.email || '',
          password: '',
          role: prof.role || 'USER'
        });
      }
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) fetchData(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) fetchData(session.user.id);
      else {
        setCurrentUser(null);
        setExpenses([]);
        setEarnings([]);
        setKmEntries([]);
        setCredits([]);
        setRecurringExpenses([]);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchData]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setMobileMenuOpen(false);
  };

  const handleAddExpense = async (exp: Expense, rec?: RecurringExpense) => {
    if (!session?.user) return;
    
    const { data, error } = await supabase.from('expenses').upsert({
      ...exp,
      user_id: session.user.id
    }).select().single();

    if (!error && data) {
      setExpenses(prev => {
        const filtered = prev.filter(e => e.id !== exp.id);
        return [...filtered, data];
      });
      setView('LIST');
    }

    if (rec) {
      const { data: recData } = await supabase.from('recurring_expenses').insert({
        ...rec,
        user_id: session.user.id
      }).select().single();
      if (recData) setRecurringExpenses(prev => [...prev, recData]);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    const { error } = await supabase.from('expenses').delete().eq('id', id);
    if (!error) setExpenses(prev => prev.filter(e => e.id !== id));
  };

  const handleAddEarning = async (ear: Earning) => {
    if (!session?.user) return;
    const { data, error } = await supabase.from('earnings').insert({
      ...ear,
      user_id: session.user.id
    }).select().single();
    if (!error && data) setEarnings(prev => [...prev, data]);
  };

  const handleUpdateKm = async (entry: DailyKm) => {
    if (!session?.user) return;
    const { data, error } = await supabase.from('daily_km').upsert({
      ...entry,
      user_id: session.user.id
    }).select().single();
    if (!error && data) {
      setKmEntries(prev => {
        const filtered = prev.filter(k => k.date !== entry.date);
        return [...filtered, data];
      });
    }
  };

  const handleAddCredit = async (c: CreditEntry) => {
    if (!session?.user) return;
    const { data } = await supabase.from('credits').insert({ ...c, user_id: session.user.id }).select().single();
    if (data) setCredits(prev => [...prev, data]);
  };

  const handleUpdateCredit = async (c: CreditEntry) => {
    const { error } = await supabase.from('credits').update(c).eq('id', c.id);
    if (!error) setCredits(prev => prev.map(item => item.id === c.id ? c : item));
  };

  const handleDeleteCredit = async (id: string) => {
    await supabase.from('credits').delete().eq('id', id);
    setCredits(prev => prev.filter(c => c.id !== id));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-blue-600">
        <Loader2 className="animate-spin mb-4" size={48} />
        <p className="font-bold animate-pulse">Iniciando FinControl AI...</p>
      </div>
    );
  }

  // Alerta de configuração pendente
  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl border border-amber-100 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-50 rounded-full text-amber-500 mb-6">
            <AlertTriangle size={32} />
          </div>
          <h2 className="text-2xl font-black text-gray-800 mb-2">Supabase Não Configurado</h2>
          <p className="text-gray-500 mb-6">
            Para que o sistema funcione, você precisa configurar as variáveis <strong>SUPABASE_URL</strong> e <strong>SUPABASE_ANON_KEY</strong> no seu ambiente.
          </p>
          <div className="bg-gray-50 p-4 rounded-xl text-left text-xs font-mono text-gray-600 mb-6">
            SUPABASE_URL=https://xyz.supabase.co<br/>
            SUPABASE_ANON_KEY=sua-chave-anonima
          </div>
          <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest leading-relaxed">
            Desenvolvido por Multiplus - Sistemas Inteligentes<br/>
            Silvio T. de Sá Filho
          </p>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Login onLogin={() => false} />;
  }

  const NavButton: React.FC<{ target: ViewState; icon: React.ReactNode; label: string }> = ({ target, icon, label }) => (
    <button
      onClick={() => { setView(target); setMobileMenuOpen(false); }}
      className={`flex items-center px-4 py-3 rounded-xl transition-all w-full md:w-auto ${view === target ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}
    >
      {icon} <span className="ml-2 font-medium">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans pb-32 md:pb-12">
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm print:hidden">
        <div className="max-w-5xl mx-auto px-4 h-16 flex justify-between items-center">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('DAILY_FLOW')}>
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">D</div>
            <span className="text-xl font-black text-gray-800 hidden sm:inline">FinControl<span className="text-blue-600">AI</span></span>
          </div>
          
          <nav className="hidden md:flex space-x-2 items-center">
            {currentUser?.role === 'ADMIN' && <NavButton target="ADMIN_PANEL" icon={<ShieldCheck size={18} />} label="Administração" />}
            <NavButton target="DAILY_FLOW" icon={<Wallet size={18} />} label="Diário" />
            <NavButton target="DASHBOARD" icon={<LayoutDashboard size={18} />} label="Balanço" />
            <NavButton target="CREDIT_HISTORY" icon={<CreditCard size={18} />} label="Crédito" />
            <NavButton target="LIST" icon={<List size={18} />} label="Histórico" />
            <NavButton target="AI_ADVISOR" icon={<Sparkles size={18} />} label="Consultor IA" />
            
            <div className="h-8 w-px bg-gray-200 mx-2"></div>

            <button onClick={handleLogout} className="p-3 text-gray-400 hover:text-red-600 rounded-xl transition" title="Sair">
                <LogOut size={20} />
            </button>
          </nav>

          <div className="flex items-center gap-2 md:hidden">
             <span className="text-xs font-bold text-gray-400 max-w-[100px] truncate">{currentUser?.name || session.user.email}</span>
             <button className="p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
             </button>
          </div>
        </div>
      </header>

      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b p-4 space-y-2 fixed w-full z-40 shadow-xl animate-fade-in">
           {currentUser?.role === 'ADMIN' && <NavButton target="ADMIN_PANEL" icon={<ShieldCheck size={18} />} label="Administração" />}
           <NavButton target="DAILY_FLOW" icon={<Wallet size={18} />} label="Fluxo do Dia" />
           <NavButton target="DASHBOARD" icon={<LayoutDashboard size={18} />} label="Balanço Geral" />
           <NavButton target="CREDIT_HISTORY" icon={<CreditCard size={18} />} label="Dívidas e Crédito" />
           <NavButton target="LIST" icon={<List size={18} />} label="Histórico" />
           <NavButton target="AI_ADVISOR" icon={<Sparkles size={18} />} label="IA Driver" />
           <button onClick={handleLogout} className="w-full flex items-center justify-center px-4 py-3 rounded-xl bg-red-50 text-red-600 font-bold transition mt-2">
               <LogOut size={18} className="mr-2" /> Sair
           </button>
        </div>
      )}

      <main className="max-w-5xl mx-auto px-4 py-6">
        {view === 'DASHBOARD' && <Dashboard expenses={expenses} earnings={earnings} />}
        {view === 'DAILY_FLOW' && (
          <DailyFlow 
            onAddEarning={handleAddEarning}
            onAddExpense={(e) => handleAddExpense(e)}
            onUpdateKm={handleUpdateKm}
            expenses={expenses} earnings={earnings} kmEntries={kmEntries}
          />
        )}
        {view === 'ADD_ENTRY' && (
          <ExpenseForm 
            categories={categories} initialData={expenseToEdit}
            onAddExpense={handleAddExpense}
            onCancel={() => setView('LIST')}
            onAddCategory={(c) => setCategories([...categories, c])}
            onDeleteCategory={(c) => setCategories(categories.filter(x => x !== c))}
          />
        )}
        {view === 'LIST' && <ExpenseList expenses={expenses} onDelete={handleDeleteExpense} onEdit={(e) => { setExpenseToEdit(e); setView('ADD_ENTRY'); }} />}
        {view === 'AI_ADVISOR' && <AIAdvisor expenses={expenses} />}
        {view === 'CREDIT_HISTORY' && (
          <CreditHistory 
            credits={credits} 
            onAddCredit={handleAddCredit} 
            onDeleteCredit={handleDeleteCredit}
            onUpdateCredit={handleUpdateCredit}
          />
        )}

        <footer className="mt-20 pt-10 border-t border-gray-200 pb-16 print:hidden">
            <div className="text-center flex flex-col items-center justify-center space-y-2">
                <p className="text-[10px] md:text-sm font-bold text-gray-500 tracking-wide">
                    Desenvolvido por Multiplus - Sistemas Inteligentes
                </p>
                <p className="text-[10px] md:text-sm font-bold text-gray-500 tracking-wide">
                    Silvio T. de Sá Filho
                </p>
            </div>
        </footer>
      </main>

      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around py-3 z-40 shadow-2xl print:hidden">
        <button onClick={() => setView('DAILY_FLOW')} className={`flex flex-col items-center ${view === 'DAILY_FLOW' ? 'text-blue-600' : 'text-gray-400'}`}>
          <Wallet size={24} /><span className="text-[10px] font-bold mt-1">Hoje</span>
        </button>
        <button onClick={() => setView('CREDIT_HISTORY')} className={`flex flex-col items-center ${view === 'CREDIT_HISTORY' ? 'text-blue-600' : 'text-gray-400'}`}>
          <CreditCard size={24} /><span className="text-[10px] font-bold mt-1">Crédito</span>
        </button>
        <button onClick={() => { setExpenseToEdit(null); setView('ADD_ENTRY'); }} className="bg-blue-600 text-white rounded-full p-3 -mt-8 shadow-xl active:scale-90 transition">
          <Plus size={32} />
        </button>
        <button onClick={() => setView('DASHBOARD')} className={`flex flex-col items-center ${view === 'DASHBOARD' ? 'text-blue-600' : 'text-gray-400'}`}>
          <LayoutDashboard size={24} /><span className="text-[10px] font-bold mt-1">Balanço</span>
        </button>
        <button onClick={() => setView('LIST')} className={`flex flex-col items-center ${view === 'LIST' ? 'text-blue-600' : 'text-gray-400'}`}>
            <List size={24} /><span className="text-[10px] font-bold mt-1">Lista</span>
        </button>
      </div>
    </div>
  );
};

export default App;