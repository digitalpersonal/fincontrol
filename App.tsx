
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Expense, Earning, DailyKm, CreditEntry, User, ViewState, DEFAULT_CATEGORIES, EARNING_CATEGORIES, RecurringExpense } from './types';
import Dashboard from './components/Dashboard';
import ExpenseForm from './components/ExpenseForm';
import ExpenseList from './components/ExpenseList';
import EarningList from './components/EarningList';
import RecurringList from './components/RecurringList';
import AIAdvisor from './components/AIAdvisor';
import DailyFlow from './components/DailyFlow';
import CreditHistory from './components/CreditHistory';
import Login from './components/Login';
import AdminPanel from './components/AdminPanel';
import InstallGuide from './components/InstallGuide';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import { LayoutDashboard, Plus, List, Sparkles, Menu, X, Wallet, CreditCard, ShieldCheck, LogOut, Loader2, Download, Repeat } from 'lucide-react';

const ADMIN_EMAIL = 'digitalpersonal@gmail.com';

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallGuide, setShowInstallGuide] = useState(false);

  const isMounted = useRef(true);
  const fetchController = useRef<AbortController | null>(null);

  const [categories, setCategories] = useState<string[]>(() => {
    const saved = localStorage.getItem('expenseCategories');
    return saved ? JSON.parse(saved) : DEFAULT_CATEGORIES;
  });

  const [earningCategories, setEarningCategories] = useState<string[]>(() => {
    const saved = localStorage.getItem('earningCategories');
    return saved ? JSON.parse(saved) : EARNING_CATEGORIES;
  });

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [earnings, setEarnings] = useState<Earning[]>([]);
  const [kmEntries, setKmEntries] = useState<DailyKm[]>([]);
  const [credits, setCredits] = useState<CreditEntry[]>([]);
  const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);

  const [view, setView] = useState<ViewState>('DAILY_FLOW');
  const [historyTab, setHistoryTab] = useState<'EXPENSES' | 'EARNINGS'>('EXPENSES');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null);
  const [earningToEdit, setEarningToEdit] = useState<Earning | null>(null);

  useEffect(() => {
    localStorage.setItem('expenseCategories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('earningCategories', JSON.stringify(earningCategories));
  }, [earningCategories]);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const fetchUsers = useCallback(async (signal?: AbortSignal) => {
    if (!isSupabaseConfigured) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('name', { ascending: true })
        .abortSignal(signal as any);

      if (error) return;
      if (data && isMounted.current) {
        setAllUsers(data.map(p => ({
          id: p.id,
          name: p.name || 'Usuário',
          email: p.email || '',
          password: '***',
          role: p.role as 'ADMIN' | 'USER',
          status: p.status || 'ACTIVE'
        })));
      }
    } catch (err) {}
  }, []);

  const fetchData = useCallback(async (userId: string, email: string) => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    if (fetchController.current) fetchController.current.abort();
    const controller = new AbortController();
    fetchController.current = controller;
    setLoading(true);

    try {
        const isMasterAdmin = email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
        const { data: profileData } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle().abortSignal(controller.signal as any);

        if (profileData && profileData.status === 'BLOCKED') {
            await supabase.auth.signOut();
            alert("ACESSO SUSPENSO: Conta bloqueada.");
            return;
        }

        const [exp, ear, km, cre, rec] = await Promise.all([
            supabase.from('expenses').select('*').eq('user_id', userId).abortSignal(controller.signal as any),
            supabase.from('earnings').select('*').eq('user_id', userId).abortSignal(controller.signal as any),
            supabase.from('daily_km').select('*').eq('user_id', userId).abortSignal(controller.signal as any),
            supabase.from('credits').select('*').eq('user_id', userId).abortSignal(controller.signal as any),
            supabase.from('recurring_expenses').select('*').eq('user_id', userId).abortSignal(controller.signal as any)
        ]);

        if (controller.signal.aborted) return;

        setExpenses(exp.data || []);
        setEarnings(ear.data || []);
        setKmEntries(km.data || []);
        setCredits(cre.data || []);
        setRecurringExpenses(rec.data || []);
        
        if (isMasterAdmin) {
            if (!profileData || profileData.role !== 'ADMIN') {
                 await supabase.from('profiles').upsert({ id: userId, email, name: email.split('@')[0], role: 'ADMIN', status: 'ACTIVE' });
            }
            fetchUsers(controller.signal);
            setCurrentUser({ id: userId, email, name: profileData?.name || 'Admin', role: 'ADMIN', status: 'ACTIVE', password: '' });
        } else if (profileData) {
            setCurrentUser({ id: userId, email, name: profileData.name, role: profileData.role as any, status: profileData.status as any, password: '' });
            if (profileData.role === 'ADMIN') fetchUsers(controller.signal);
        }
    } catch (err) {} finally {
        if (isMounted.current) setLoading(false);
    }
  }, [fetchUsers]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession?.user) fetchData(newSession.user.id, newSession.user.email || '');
      else { setLoading(false); setCurrentUser(null); }
    });
    return () => subscription.unsubscribe();
  }, [fetchData]);

  const handleLogout = async () => { await supabase.auth.signOut(); setView('DAILY_FLOW'); };

  const handleAddExpense = async (exp: Expense, rec?: RecurringExpense) => {
    if (!session?.user) return;
    const payload = { ...exp, user_id: session.user.id };
    setExpenses(prev => [...prev.filter(e => e.id !== exp.id), payload]);
    setView('LIST'); 
    await supabase.from('expenses').upsert(payload);
    if (rec) await supabase.from('recurring_expenses').insert({ ...rec, user_id: session.user.id });
  };

  const handleDeleteExpense = async (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
    await supabase.from('expenses').delete().eq('id', id);
  };

  const handleAddEarning = async (ear: Earning) => {
    if (!session?.user) return;
    const payload = { ...ear, user_id: session.user.id };
    setEarnings(prev => [...prev.filter(e => e.id !== ear.id), payload]);
    await supabase.from('earnings').upsert(payload);
    setEarningToEdit(null);
  };

  const handleDeleteEarning = async (id: string) => {
    setEarnings(prev => prev.filter(e => e.id !== id));
    await supabase.from('earnings').delete().eq('id', id);
  };

  const handleUpdateKm = async (entry: DailyKm) => {
    if (!session?.user) return;
    setKmEntries(prev => [...prev.filter(k => k.date !== entry.date), entry]);
    await supabase.from('daily_km').upsert({ ...entry, user_id: session.user.id });
  };

  const handleAddCredit = async (c: CreditEntry) => {
    if (!session?.user) return;
    const payload = { ...c, user_id: session.user.id };
    setCredits(prev => [...prev.filter(i => i.id !== c.id), payload]);
    await supabase.from('credits').upsert(payload);
  };

  const handleDeleteCredit = async (id: string) => {
    setCredits(prev => prev.filter(c => c.id !== id));
    await supabase.from('credits').delete().eq('id', id);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" size={48} /></div>;
  if (!session) return <Login />;

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      <header className="sticky top-0 z-30 bg-white border-b h-16 flex items-center px-4 justify-between">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('DAILY_FLOW')}>
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">D</div>
          <span className="font-black text-gray-800">FinControl<span className="text-blue-600">AI</span></span>
        </div>
        <nav className="hidden md:flex gap-2">
          {currentUser?.role === 'ADMIN' && <button onClick={() => setView('ADMIN_PANEL')} className="px-3 py-2 text-sm font-medium">Gestão</button>}
          <button onClick={() => setView('DAILY_FLOW')} className="px-3 py-2 text-sm font-medium">Diário</button>
          <button onClick={() => setView('LIST')} className="px-3 py-2 text-sm font-medium">Histórico</button>
          <button onClick={() => setView('CREDIT_HISTORY')} className="px-3 py-2 text-sm font-medium">Crédito</button>
          <button onClick={handleLogout} className="p-2 text-gray-400 hover:text-red-600"><LogOut size={20} /></button>
        </nav>
        <button className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}><Menu /></button>
      </header>

      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b p-4 space-y-2">
           <button onClick={() => { setView('DAILY_FLOW'); setMobileMenuOpen(false); }} className="w-full text-left py-2 font-bold">Diário</button>
           <button onClick={() => { setView('LIST'); setMobileMenuOpen(false); }} className="w-full text-left py-2 font-bold">Histórico</button>
           <button onClick={() => { setView('CREDIT_HISTORY'); setMobileMenuOpen(false); }} className="w-full text-left py-2 font-bold">Crédito</button>
           <button onClick={handleLogout} className="w-full text-left py-2 text-red-600 font-bold">Sair</button>
        </div>
      )}

      <main className="max-w-5xl mx-auto px-4 py-6">
        {view === 'DASHBOARD' && <Dashboard expenses={expenses} earnings={earnings} />}
        {view === 'DAILY_FLOW' && (
            <DailyFlow 
                onAddEarning={handleAddEarning} onAddExpense={handleAddExpense} onUpdateKm={handleUpdateKm} 
                expenses={expenses} earnings={earnings} kmEntries={kmEntries}
                expenseCategories={categories} earningCategories={earningCategories}
                onAddCategory={(t, c) => t === 'EXPENSE' ? setCategories([...categories, c]) : setEarningCategories([...earningCategories, c])}
                onDeleteCategory={(t, c) => t === 'EXPENSE' ? setCategories(categories.filter(x => x !== c)) : setEarningCategories(earningCategories.filter(x => x !== c))}
            />
        )}
        {view === 'ADD_ENTRY' && <ExpenseForm categories={categories} initialData={expenseToEdit} onAddExpense={handleAddExpense} onCancel={() => setView('LIST')} onAddCategory={c => setCategories([...categories, c])} onDeleteCategory={c => setCategories(categories.filter(x => x !== c))} />}
        {view === 'LIST' && (
          <div className="space-y-6">
            <div className="flex p-1 bg-gray-200 rounded-xl w-fit">
              <button onClick={() => setHistoryTab('EXPENSES')} className={`px-6 py-2 rounded-lg text-sm font-bold ${historyTab === 'EXPENSES' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}>Despesas</button>
              <button onClick={() => setHistoryTab('EARNINGS')} className={`px-6 py-2 rounded-lg text-sm font-bold ${historyTab === 'EARNINGS' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500'}`}>Ganhos</button>
            </div>
            {historyTab === 'EXPENSES' ? 
              <ExpenseList expenses={expenses} onDelete={handleDeleteExpense} onEdit={e => { setExpenseToEdit(e); setView('ADD_ENTRY'); }} /> :
              <EarningList earnings={earnings} onDelete={handleDeleteEarning} onEdit={e => { setEarningToEdit(e); setView('DAILY_FLOW'); }} />
            }
          </div>
        )}
        {view === 'CREDIT_HISTORY' && <CreditHistory credits={credits} onAddCredit={handleAddCredit} onDeleteCredit={handleDeleteCredit} onUpdateCredit={handleAddCredit} />}
        {view === 'ADMIN_PANEL' && <AdminPanel users={allUsers} onAddUser={() => Promise.resolve(true)} onDeleteUser={() => {}} onToggleStatus={() => {}} onRefresh={() => fetchUsers()} />}
      </main>

      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around py-3">
        <button onClick={() => setView('DAILY_FLOW')} className={view === 'DAILY_FLOW' ? 'text-blue-600' : 'text-gray-400'}><Wallet /></button>
        <button onClick={() => setView('CREDIT_HISTORY')} className={view === 'CREDIT_HISTORY' ? 'text-blue-600' : 'text-gray-400'}><CreditCard /></button>
        <button onClick={() => { setExpenseToEdit(null); setView('ADD_ENTRY'); }} className="bg-blue-600 text-white rounded-full p-3 -mt-8 shadow-lg"><Plus size={32} /></button>
        <button onClick={() => setView('DASHBOARD')} className={view === 'DASHBOARD' ? 'text-blue-600' : 'text-gray-400'}><LayoutDashboard /></button>
        <button onClick={() => setView('LIST')} className={view === 'LIST' ? 'text-blue-600' : 'text-gray-400'}><List /></button>
      </div>
      <InstallGuide isOpen={showInstallGuide} onClose={() => setShowInstallGuide(false)} installPrompt={deferredPrompt} />
    </div>
  );
};

export default App;
