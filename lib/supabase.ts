
import { createClient } from '@supabase/supabase-js';

// Fallbacks seguros para evitar "supabaseUrl is required" durante o desenvolvimento inicial
// As variáveis REAIS devem ser configuradas no ambiente (Secrets/Env Vars)
const supabaseUrl = process.env.SUPABASE_URL || 'https://placeholder-project.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'placeholder-anon-key';

export const isSupabaseConfigured = !!process.env.SUPABASE_URL && !!process.env.SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
