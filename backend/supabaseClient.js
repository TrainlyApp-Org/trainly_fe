import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('WARNING: SUPABASE_URL or SUPABASE_ANON_KEY is missing from environment variables. Backend will run in mock mode or queries may fail.');
}

// Default admin/anon client
export const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseAnonKey || 'placeholder-anon-key');

// Server-only client for the public share endpoint. Never expose this key to the frontend.
export const supabaseAdmin = supabaseServiceRoleKey
  ? createClient(supabaseUrl, supabaseServiceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } })
  : null;

/**
 * Creates an instance of Supabase Client authenticated with the user's JWT.
 * This ensures that Row Level Security (RLS) policies are correctly evaluated.
 * 
 * @param {string} authHeader - The Authorization header from the request
 * @returns {import('@supabase/supabase-js').SupabaseClient}
 */
export const getSupabaseClientForUser = (authHeader) => {
  if (!authHeader) {
    return supabase;
  }
  
  const token = authHeader.replace(/^Bearer\s+/, '');
  
  return createClient(
    supabaseUrl || 'https://placeholder.supabase.co', 
    supabaseAnonKey || 'placeholder-anon-key',
    {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    }
  );
};
