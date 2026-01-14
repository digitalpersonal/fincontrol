
export const DEFAULT_CATEGORIES = [
  'Combustível',
  'Manutenção Veículo',
  'Seguro/IPVA',
  'Aluguel de Veículo',
  'Alimentação (Trabalho)',
  'Contas de Casa (Luz/Água)',
  'Aluguel Casa',
  'Saúde',
  'Lazer',
  'Outros'
];

export const EARNING_CATEGORIES = [
  'Entrega/transporte'
];

export interface User {
  id: string;
  email: string;
  password: string;
  role: 'ADMIN' | 'USER';
  name: string;
  status?: 'ACTIVE' | 'BLOCKED';
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  date: string;
  category: string;
  km?: number;
  type: 'WORK' | 'PERSONAL';
  isRecurringInstance?: boolean;
  observations?: string;
}

export interface Earning {
  id: string;
  description: string;
  amount: number;
  date: string;
  category: string;
}

export interface DailyKm {
  id: string;
  date: string;
  startKm: number;
  endKm: number;
}

export interface CreditEntry {
  id: string;
  description: string;
  totalAmount: number;
  paidAmount: number;
  remainingBalance: number;
  dueDate: string;
  category: 'Empréstimo' | 'Financiamento' | 'Cartão' | 'Outros';
}

export type Frequency = 'WEEKLY' | 'MONTHLY' | 'YEARLY';

export interface RecurringExpense {
  id: string;
  description: string;
  amount: number;
  category: string;
  frequency: Frequency;
  nextDueDate: string;
}

export type ViewState = 'DASHBOARD' | 'DAILY_FLOW' | 'ADD_ENTRY' | 'LIST' | 'AI_ADVISOR' | 'RECURRING' | 'CREDIT_HISTORY' | 'ADMIN_PANEL';
