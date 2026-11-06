import { createClient } from '@supabase/supabase-js';

// Credenciais do projeto Supabase fornecidas
const DEFAULT_SUPABASE_URL = 'https://nzfhnszfereyoqutbcpf.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_wKeLqnic9ZO1QhZEgeS76g_lHnHaIWq';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.startsWith('http') &&
    !supabaseUrl.includes('YOUR_SUPABASE')
  );
};

export const supabase = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;
