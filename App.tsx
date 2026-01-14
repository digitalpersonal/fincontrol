
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
      const { data, error } = await supabase.from('profiles').select('*').abortSignal(signal as any);
      if (error) {
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
      if (err.name !== 'AbortError' && !err.message?.includes('aborted')) {
        console.warn("Erro ao buscar usuários:", err);
      }
    }
  }, []);

  const fetchData = useCallback(async (userId: string, email: string) => {
    if (!isSupabaseConfigured) return;

    if (fetchController.current) {
        fetchController.current.abort();
    }
    const controller = new AbortController();
    fetchController.current = controller;
    
    setLoading(true);

    try {
        const isMasterAdmin = email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

        // Conditionally define promises for financial data
        // For master admin, these promises will resolve immediately with empty arrays
        let expensesPromise = Promise.resolve({ data: [] });
        let earningsPromise = Promise.resolve({ data: [] });
        let kmPromise = Promise.resolve({ data: [] });
        let creditsPromise = Promise.resolve({ data: [] });
        let recurringPromise = Promise.resolve({ data: [] });

        if (!isMasterAdmin) {
            expensesPromise = supabase.from('expenses').select('*').eq('user_id', userId).abortSignal(controller.signal as any);
            earningsPromise = supabase.from('earnings').select('*').eq('user_id', userId).abortSignal(controller.signal as any);
            kmPromise = supabase.from('daily_km').select('*').eq('user_id', userId).abortSignal(controller.signal as any);
            creditsPromise = supabase.from('credits').select('*').eq('user_id', userId).abortSignal(controller.signal as any);
            recurringPromise = supabase.from('recurring_expenses').select('*').eq('user_id', userId).abortSignal(controller.signal as any);
        }

        // Fetch profile and all other user-specific data concurrently
        const [
            profileResponse,
            expensesResponse,
            earningsResponse,
            kmResponse,
            creditsResponse,
            recurringResponse
        ] = await Promise.all([
            supabase.from('profiles').select('*').eq('id', userId).maybeSingle().abortSignal(controller.signal as any),
            expensesPromise,
            earningsPromise,
            kmPromise,
            creditsPromise,
            recurringPromise
        ]);

        if (controller.signal.aborted || !isMounted.current) return;

        // Set all data states
        setExpenses(expensesResponse.data || []);
        setEarnings(earningsResponse.data || []);
        setKmEntries(kmResponse.data || []);
        setCredits(creditsResponse.data || []);
        setRecurringExpenses(recurringResponse.data || []);
        
        const profileData = profileResponse.data;
        let userToSet: User;

        if (isMasterAdmin) {
            // Force ADMIN role for the master user, regardless of DB state
            userToSet = {
                id: userId,
                name: profileData?.name || email.split('@')[0] || 'Admin Mestre', // More explicit name
                email: email,
                password: '',
                role: 'ADMIN' // Unquestionably ADMIN for the UI
            };

            // If the DB profile is missing or incorrect, update it.
            // This is a "fire-and-forget" to sync DB, the UI is already correct.
            if (!profileData || profileData.role !== 'ADMIN') {
                console.log("Master Admin profile out of sync. Correcting in DB.");
                await supabase.from('profiles').upsert({
                    id: userId,
                    role: 'ADMIN',
                    email: email,
                    name: userToSet.name
                }, { onConflict: 'id' });
            }
            fetchUsers(controller.signal); // Always fetch all users for the admin panel

        } else {
            // For regular users, trust the database or create a new profile if one doesn't exist
            if (profileData) {
                userToSet = {
                    id: userId,
                    name: profileData.name,
                    email: email,
                    password: '',
                    role: profileData.role as 'ADMIN' | 'USER'
                };
            } else {
                console.warn(`Profile not found for user ${userId}. Creating a new one.`);
                // This case handles users created by the admin who are logging in for the first time
                const { data: newProfile } = await supabase.from('profiles').insert({
                    id: userId,
                    name: email.split('@')[0] || 'Novo Usuário',
                    role: 'USER',
                    email: email
                }).select().single();
                
                userToSet = {
                    id: userId,
                    name: newProfile?.name || 'Novo Usuário',
                    email: email,
                    password: '',
                    role: 'USER'
                };
            }
        }
        
        if (isMounted.current) {
            setCurrentUser(userToSet);
            console.log(`[DEBUG] Current user set: ${userToSet.email}, Role: ${userToSet.role}`);
        }

    } catch (err: any) {
        if (err.name !== 'AbortError' && !err.message?.includes('aborted')) {
            console.error("Erro ao carregar dados do usuário:", err);
        }
    } finally {
        if (isMounted.current && !controller.signal.aborted) {
            setLoading(false);
        }
    }
}, [fetchUsers]);


  useEffect(() => {
    isMounted.current = true;
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!isMounted.current) return;
      
      setSession(newSession);
      
      if (newSession?.user) {
        fetchData(newSession.user.id, newSession.user.email || '');
      } else {
        setCurrentUser(null);
        setExpenses([]);
        setEarnings([]);
        setKmEntries([]);
        setCredits([]);
        setRecurringExpenses([]);
        setAllUsers([]);
        setLoading(false);
      }
    });

    return () => {
      isMounted.current = false;
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

  const handleAddUser = async (userToAdd: User): Promise<boolean> => { // Changed return type to Promise<boolean>
    if (currentUser?.role !== 'ADMIN') {
        console.error("Non-admin user attempted to add a user.");
        alert("Você não tem permissão para adicionar usuários.");
        return false;
    }

    try {
        setLoading(true);

        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: userToAdd.email,
            password: userToAdd.password,
            options: {
                data: {
                    name: userToAdd.name, // Pass name as metadata for potential use in trigger or profile update
                }
            }
        });

        if (authError) {
            console.error("Error creating auth user:", authError);
            let errorMessage = `Erro ao criar usuário: ${authError.message}`;
            if (authError.message.includes('already registered')) {
                errorMessage = `Este e-mail já está cadastrado. Por favor, use outro.`;
            }
            alert(errorMessage);
            return false;
        }

        if (authData.user) {
            console.log("Auth user created successfully:", authData.user.id);
            alert(`Usuário "${userToAdd.name}" criado com sucesso! (ID: ${authData.user.id}).`);
            fetchUsers(); // Refresh the list of profiles
            return true;
        } else {
            // This path is usually taken if email confirmation is required, and no session is immediately created.
            alert(`Usuário "${userToAdd.name}" registrado! Um e-mail de confirmação foi enviado para ${userToAdd.email}. O usuário precisará verificar o e-mail antes de fazer login.`);
            // Even if user needs to confirm, the signup was initiated, so we can consider it "successful" for the admin's action.
            return true; // Consider it successful as the signup flow was initiated.
        }
    } catch (err) {
        console.error("Unexpected error during user creation:", err);
        alert("Ocorreu um erro inesperado ao criar o usuário.");
        return false;
    } finally {
        setLoading(false);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (currentUser?.role !== 'ADMIN') return;
    const { error } = await supabase.from('profiles').delete().eq('id', id);
    if (!error) fetchUsers(); 
  };

  const handleAddExpense = async (exp: Expense) => {
    if (!session?.user) return;
    const payload = { ...exp, user_id: session.user.id };
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
        <button onClick={() => { setExpenseToEdit(null); setView('ADD_ENTRY'); }} className="bg-blue-600 text-white rounded-full p-3 -mt-8 shadow-xl active:scale-95 transition">
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
