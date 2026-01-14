
import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import { LayoutDashboard, Plus, List, Sparkles, Menu, X, Wallet, CreditCard, ShieldCheck, LogOut, Loader2, AlertTriangle } from 'lucide-react';

const ADMIN_EMAIL = 'digitalpersonal@gmail.com';

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  const isMounted = useRef(true);
  const fetchController = useRef<AbortController | null>(null);

  // Data States
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [earnings, setEarnings] = useState<Earning[]>([]);
  const [kmEntries, setKmEntries] = useState<DailyKm[]>([]);
  const [credits, setCredits] = useState<CreditEntry[]>([]);
  const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);

  const [view, setView] = useState<ViewState>('DAILY_FLOW');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null);

  const fetchUsers = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    try {
      const { data, error } = await supabase.from('profiles').select('*');
      if (error) throw error;
      if (data && isMounted.current) {
        setAllUsers(data.map(p => ({
          id: p.id,
          name: p.name || 'Usuário',
          email: p.email || '',
          password: '***',
          role: p.role as 'ADMIN' | 'USER'
        })));
      }
    } catch (err) {
      console.warn("Acesso negado à lista de usuários ou erro de rede.");
    }
  }, []);

  const fetchData = useCallback(async (userId: string, email: string) => {
    if (!isSupabaseConfigured) return;
    
    // Abort previous requests if they are still running
    if (fetchController.current) {
      fetchController.current.abort();
    }
    fetchController.current = new AbortController();
    
    setLoading(true);

    try {
      const results = await Promise.allSettled([
        supabase.from('expenses').select('*').eq('user_id', userId),
        supabase.from('earnings').select('*').eq('user_id', userId),
        supabase.from('daily_km').select('*').eq('user_id', userId),
        supabase.from('credits').select('*').eq('user_id', userId),
        supabase.from('recurring_expenses').select('*').eq('user_id', userId),
        supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
      ]);

      if (!isMounted.current) return;

      const [exp, ear, km, cred, rec, profResult] = results;

      // Type-safe handling of PromiseSettledResult and fixing logic errors
      // Use explicit status check and cast to access .value safely in TS
      if (exp.status === 'fulfilled') {
        const val = (exp as PromiseFulfilledResult<any>).value;
        if (val?.data) setExpenses(val.data);
      }
      
      if (ear.status === 'fulfilled') {
        const val = (ear as PromiseFulfilledResult<any>).value;
        if (val?.data) setEarnings(val.data);
      }
      
      if (km.status === 'fulfilled') {
        const val = (km as PromiseFulfilledResult<any>).value;
        if (val?.data) setKmEntries(val.data);
      }
      
      if (cred.status === 'fulfilled') {
        const val = (cred as PromiseFulfilledResult<any>).value;
        if (val?.data) setCredits(val.data);
      }
      
      if (rec.status === 'fulfilled') {
        const val = (rec as PromiseFulfilledResult<any>).value;
        if (val?.data) setRecurringExpenses(val.data);
      }

      const forcedRole = email.toLowerCase() === ADMIN_EMAIL.toLowerCase() ? 'ADMIN' : 
                        (profResult.status === 'fulfilled' ? (profResult as PromiseFulfilledResult<any>).value.data?.role : 'USER');
      
      const profileData = profResult.status === 'fulfilled' ? (profResult as PromiseFulfilledResult<any>).value.data : null;

      if (profileData) {
        setCurrentUser({
          id: profileData.id,
          name: profileData.name || 'Usuário',
          email: email,
          password: '',
          role: forcedRole as 'ADMIN' | 'USER'
        });
      } else {
        const { data: newProf } = await supabase.from('profiles').upsert({
          id: userId,
          name: email.split('@')[0] || 'Usuário',
          role: forcedRole,
          email: email
        }).select().single();
        
        if (newProf && isMounted.current) {
          setCurrentUser({
            id: newProf.id,
            name: newProf.name,
            email: email,
            password: '',
            role: forcedRole as 'ADMIN' | 'USER'
          });
        }
      }

      if (forcedRole === 'ADMIN') {
        fetchUsers();
      }

    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error("Erro ao carregar dados:", err);
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [fetchUsers]);

  useEffect(() => {
    isMounted.current = true;
    
    const checkSession = async () => {
      const { data: { session: activeSession } } = await supabase.auth.getSession();
      if (isMounted.current) {
        setSession(activeSession);
        if (activeSession?.user) {
          fetchData(activeSession.user.id, activeSession.user.email || '');
        } else {
          setLoading(false);
        }
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!isMounted.current) return;
      setSession(newSession);
      if (newSession?.user) {
        fetchData(newSession.user.id, newSession.user.email || '');
      } else {
        setCurrentUser(null);
        setExpenses([]);
        setEarnings([]);
        setLoading(false);
      }
    });

    return () => {
      isMounted.current = false;
      if (fetchController.current) fetchController.current.abort();
      subscription.unsubscribe();
    };
  }, [fetchData]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setMobileMenuOpen(false);
    setView('DAILY_FLOW');
  };

  const handleAddUser = async (user: User) => {
    if (currentUser?.role !== 'ADMIN') return;
    const { error } = await supabase.from('profiles').insert({
      id: user.id,
      name: user.name,
      email: user.email,
      role: 'USER'
    });
    if (!error) fetchUsers();
  };

  const handleDeleteUser = async (id: string) => {
    if (currentUser?.role !== 'ADMIN') return;
    const { error } = await supabase.from('profiles').delete().eq('id', id);
    if (!error) fetchUsers();
  };

  const handleAddExpense = async (exp: Expense) => {
    if (!session?.user) return;
    const { id, ...expData } = exp;
    const isNew = exp.id.includes('-') && exp.id.length > 30;
    const payload = isNew ? { ...expData, user_id: session.user.id } : { ...exp, user_id: session.user.id };
    
    const { data, error } = await supabase.from('expenses').upsert(payload).select().single();
    if (!error && data) {
      setExpenses(prev => [...prev.filter(e => e.id !== exp.id), data]);
      setView('LIST');
    }
  };

  const handleDeleteExpense = async (id: string) => {
    await supabase.from('expenses').delete().eq('id', id);
    setExpenses(prev => prev.filter(e => e.id !== id));
  };

  const handleAddEarning = async (ear: Earning) => {
    if (!session?.user) return;
    const { data } = await supabase.from('earnings').insert({ ...ear, user_id: session.user.id }).select().single();
    if (data) setEarnings(prev => [...prev, data]);
  };

  const handleUpdateKm = async (entry: DailyKm) => {
    if (!session?.user) return;
    const { data } = await supabase.from('daily_km').upsert({ ...entry, user_id: session.user.id }).select().single();
    if (data) setKmEntries(prev => [...prev.filter(k => k.date !== entry.date), data]);
  };

  const handleAddCredit = async (c: CreditEntry) => {
    if (!session?.user) return;
    const { data } = await supabase.from('credits').insert({ ...c, user_id: session.user.id }).select().single();
    if (data) setCredits(prev => [...prev, data]);
  };

  const handleUpdateCredit = async (c: CreditEntry) => {
    await supabase.from('credits').update(c).eq('id', c.id);
    setCredits(prev => prev.map(item => item.id === c.id ? c : item));
  };

  const handleDeleteCredit = async (id: string) => {
    await supabase.from('credits').delete().eq('id', id);
    setCredits(prev => prev.filter(c => c.id !== id));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-blue-600">
        <Loader2 className="animate-spin mb-4" size={48} />
        <p className="font-bold animate-pulse">Sincronizando dados...</p>
      </div>
    );
  }

  if (!session) return <Login />;

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
            {currentUser?.role === 'ADMIN' && <NavButton target="ADMIN_PANEL" icon={<ShieldCheck size={18} />} label="Gestão" />}
            <NavButton target="DAILY_FLOW" icon={<Wallet size={18} />} label="Diário" />
            <NavButton target="DASHBOARD" icon={<LayoutDashboard size={18} />} label="Balanço" />
            <NavButton target="CREDIT_HISTORY" icon={<CreditCard size={18} />} label="Crédito" />
            <NavButton target="LIST" icon={<List size={18} />} label="Histórico" />
            <NavButton target="AI_ADVISOR" icon={<Sparkles size={18} />} label="IA" />
            <div className="h-8 w-px bg-gray-200 mx-2"></div>
            <button onClick={handleLogout} className="p-3 text-gray-400 hover:text-red-600 rounded-xl transition">
                <LogOut size={20} />
            </button>
          </nav>

          <div className="flex items-center gap-2 md:hidden">
             <span className="text-xs font-bold text-blue-600">{currentUser?.role === 'ADMIN' ? 'ADMIN' : currentUser?.name}</span>
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
           <button onClick={handleLogout} className="w-full flex items-center justify-center px-4 py-3 rounded-xl bg-red-50 text-red-600 font-bold mt-2">
               <LogOut size={18} className="mr-2" /> Sair
           </button>
        </div>
      )}

      <main className="max-w-5xl mx-auto px-4 py-6">
        {view === 'DASHBOARD' && <Dashboard expenses={expenses} earnings={earnings} />}
        {view === 'DAILY_FLOW' && <DailyFlow onAddEarning={handleAddEarning} onAddExpense={handleAddExpense} onUpdateKm={handleUpdateKm} expenses={expenses} earnings={earnings} kmEntries={kmEntries} />}
        {view === 'ADD_ENTRY' && <ExpenseForm categories={categories} initialData={expenseToEdit} onAddExpense={handleAddExpense} onCancel={() => setView('LIST')} onAddCategory={(c) => setCategories([...categories, c])} onDeleteCategory={(c) => setCategories(categories.filter(x => x !== c))} />}
        {view === 'LIST' && <ExpenseList expenses={expenses} onDelete={handleDeleteExpense} onEdit={(e) => { setExpenseToEdit(e); setView('ADD_ENTRY'); }} />}
        {view === 'AI_ADVISOR' && <AIAdvisor expenses={expenses} />}
        {view === 'CREDIT_HISTORY' && <CreditHistory credits={credits} onAddCredit={handleAddCredit} onDeleteCredit={handleDeleteCredit} onUpdateCredit={handleUpdateCredit} />}
        {view === 'ADMIN_PANEL' && currentUser?.role === 'ADMIN' && (
          <AdminPanel users={allUsers} onAddUser={handleAddUser} onDeleteUser={handleDeleteUser} />
        )}

        <footer className="mt-20 pt-10 border-t border-gray-200 pb-16">
            <div className="text-center flex flex-col items-center justify-center space-y-1">
                <p className="text-[10px] md:text-sm font-black text-gray-500 uppercase tracking-widest">Multiplus - Sistemas Inteligentes</p>
                <p className="text-[10px] md:text-sm font-black text-gray-500 uppercase tracking-widest">Silvio T. de Sá Filho</p>
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
