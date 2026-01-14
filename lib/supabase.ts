
import { createClient } from '@supabase/supabase-js';

// Credenciais fornecidas pelo usuário
const supabaseUrl = process.env.SUPABASE_URL || 'https://aalgcrxkwaaokihqsrrk.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhbGdjcnhrd2Fhb2tpaHFzcnJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzNTE1NjIsImV4cCI6MjA4MzkyNzU2Mn0.tDg9T7V_-JOtAbDKNnuPdTKzUnojEuKoNiExJNW-zRo';

// Verifica se as chaves estão presentes (seja via env ou hardcoded)
export const isSupabaseConfigured = !!supabaseUrl && !!supabaseAnonKey && !supabaseUrl.includes('placeholder');

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
