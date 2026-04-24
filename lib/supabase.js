import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const hasCredentials = Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);

const supabase = hasCredentials
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  : null;

let connectionReady = false;

export const getSupabase = () => supabase;

export const isSupabaseConfigured = () => hasCredentials;

export const isDatabaseReady = () => connectionReady;

export const checkSupabaseConnection = async () => {
  if (!supabase) {
    connectionReady = false;
    return false;
  }

  const { error } = await supabase
    .from('products')
    .select('id', { head: true, count: 'exact' })
    .limit(1);

  connectionReady = !error;
  return connectionReady;
};
