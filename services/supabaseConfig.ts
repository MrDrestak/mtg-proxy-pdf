import { createClient } from '@supabase/supabase-js';

/**
 * Supabase configuration - Load from environment variables
 * Required env variables (set in .env.local and Vercel):
 * - VITE_SUPABASE_URL
 * - VITE_SUPABASE_ANON_KEY
 */

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'Supabase configuration incomplete. Missing:',
    !supabaseUrl ? 'VITE_SUPABASE_URL' : '',
    !supabaseAnonKey ? 'VITE_SUPABASE_ANON_KEY' : ''
  );
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');

export default supabase;
