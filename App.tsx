
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
import { LayoutDashboard, Plus, List, Sparkles, Menu, X, Wallet, CreditCard, ShieldCheck, LogOut, Loader2 } from 'lucide-react';

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

  const fetchUsers = useCallback(async (signal?: AbortSignal) => {
    if (!isSupabaseConfigured) return;
    try {
      // Adicionando abortSignal para todas as chamadas Supabase para permitir cancelamento
      const { data, error } = await supabase.from('profiles').select('*').abortSignal(signal as any);
      if (error) {
        // Ignorar erros de abortamento
        if (error.message.includes('abort') || error.code === '20') return;
        throw error;
      }
      if (data && isMounted.current) {
        setAllUsers(data.map(p => ({
          id: p.id,
          name: p.name || 'Usuário',
          email: p.email || '',
          password: '***',
          role: p.role as 'ADMIN' | 'USER'
        })));
      }
    } catch (err: any) {
      // Ignorar erros de abortamento para não poluir o console ou disparar estados de erro desnecessários
      if (err.name !== 'AbortError' && !err.message?.includes('aborted')) {
        console.warn("Erro ao buscar usuários:", err);
      }
    }
  }, []);

  const fetchData = useCallback(async (userId: string, email: string) => {
    if (!isSupabaseConfigured) return;
    
    // Abortar requisições anteriores para evitar race conditions
    if (fetchController.current) {
      fetchController.current.abort();
    }
    const controller = new AbortController();
    fetchController.current = controller;
    
    setLoading(true);

    try {
      // Usando Promise.allSettled para que uma falha não impeça as outras, e abortSignal
      const results = await Promise.allSettled([
        supabase.from('expenses').select('*').eq('user_id', userId).abortSignal(controller.signal as any),
        supabase.from('earnings').select('*').eq('user_id', userId).abortSignal(controller.signal as any),
        supabase.from('daily_km').select('*').eq('user_id', userId).abortSignal(controller.signal as any),
        supabase.from('credits').select('*').eq('user_id', userId).abortSignal(controller.signal as any),
        supabase.from('recurring_expenses').select('*').eq('user_id', userId).abortSignal(controller.signal as any),
        supabase.from('profiles').select('*').eq('id', userId).maybeSingle().abortSignal(controller.signal as any)
      ]);

      // Se o componente foi desmontado ou a requisição foi abortada, não atualize o estado
      if (!isMounted.current || controller.signal.aborted) return;

      const [exp, ear, km, cred, rec, profResult] = results;

      // Tratamento dos resultados de Promise.allSettled
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

      // Regra Master Admin: digitalpersonal@gmail.com sempre é ADMIN
      const isMasterAdmin = email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
      const forcedRole = isMasterAdmin ? 'ADMIN' : 
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
        // Se o perfil não existe, cria um novo (especialmente para o admin master no primeiro login)
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
        fetchUsers(controller.signal);
      }

    } catch (err: any) {
      // Ignorar erros de abortamento
      if (err.name !== 'AbortError' && !err.message?.includes('aborted')) {
        console.error("Erro ao carregar dados:", err);
      }
    } finally {
      // Apenas defina loading como false se o componente ainda estiver montado e a requisição não foi abortada
      if (isMounted.current && !controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, [fetchUsers]);

  useEffect(() => {
    isMounted.current = true;
    
    // Listener para mudanças no estado de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!isMounted.current) return;
      
      setSession(newSession);
      
      if (newSession?.user) {
        fetchData(newSession.user.id, newSession.user.email || '');
      } else {
        // Limpar estados ao deslogar
        setCurrentUser(null);
        setExpenses([]);
        setEarnings([]);
        setLoading(false);
      }
    });

    return () => {
      isMounted.current = false;
      // Abortar qualquer requisição pendente ao desmontar o componente
      if (fetchController.current) {
        fetchController.current.abort();
      }
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
    if (!error) fetchUsers(); // Re-fetch users list
  };

  const handleDeleteUser = async (id: string) => {
    if (currentUser?.role !== 'ADMIN') return;
    const { error } = await supabase.from('profiles').delete().eq('id', id);
    if (!error) fetchUsers(); // Re-fetch users list
  };

  const handleAddExpense = async (exp: Expense) => {
    if (!session?.user) return;
    // O id do expense já vem do form (randomUUID para novos, existente para edições)
    const payload = { ...exp, user_id: session.user.id };
    const { data, error } = await supabase.from('expenses').upsert(payload).select().single();
    if (!error && data) {
      setExpenses(prev => [...prev.filter(e => e.id !== exp.id), data]);
      setView('LIST'); // Navigate to list after add/edit
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
            <div className="text-center flex flex-col items-center justify-center space-y-2">
                <p className="text-xs md:text-sm font-semibold text-gray-600">
                    &copy; {new Date().getFullYear()} FinControl AI. Todos os direitos reservados.
                </p>
                <div className="h-px w-16 bg-gray-200"></div>
                <p className="text-[10px] md:text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Desenvolvido por Multiplus - Sistemas Inteligentes
                </p>
                <p className="text-[10px] md:text-xs font-medium text-gray-500 uppercase tracking-wider">
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
