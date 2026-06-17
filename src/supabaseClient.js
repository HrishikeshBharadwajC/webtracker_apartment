import { createClient } from '@supabase/supabase-js';

let supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://fijgrrqlrtqugpaxbtlz.supabase.co';
let supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_VK1Bv8nLZPpBbvhab8minw_XJzENMsi';

// Fallback to localStorage settings if env variables are empty
if (!supabaseUrl && typeof window !== 'undefined') {
  try {
    const savedUrl = window.localStorage.getItem('supabaseUrl');
    const savedKey = window.localStorage.getItem('supabaseKey');
    if (savedUrl) supabaseUrl = JSON.parse(savedUrl);
    if (savedKey) supabaseAnonKey = JSON.parse(savedKey);
  } catch (e) {
    console.error('Error parsing localStorage Supabase keys:', e);
  }
}

export let supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

export const updateSupabaseClient = (url, key) => {
  if (url && key) {
    supabase = createClient(url, key);
  } else {
    supabase = null;
  }
  return supabase;
};
