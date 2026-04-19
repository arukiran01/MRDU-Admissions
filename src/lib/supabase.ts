import { createClient } from '@supabase/supabase-js';

// Fallback credentials for immediate functionality if environment variables are missing
const FALLBACK_URL = "https://laaholzwfjahuugaqzfh.supabase.co";
const FALLBACK_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhYWhvbHp3ZmphaHV1Z2FxemZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0OTgyNjAsImV4cCI6MjA5MjA3NDI2MH0._qdq6eFs1pnYUQ5mCMqbVbIql7IX60Qsax8Te5W6JC8";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || FALLBACK_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || FALLBACK_ANON_KEY;

// Ensure URL is a valid string starting with http before initializing
const hasValidConfig = typeof SUPABASE_URL === 'string' && SUPABASE_URL.startsWith('http') && SUPABASE_ANON_KEY;

export const supabase = hasValidConfig 
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) 
  : null;

if (!supabase) {
  console.warn("Frontend: Supabase client failed to initialize due to missing or invalid configuration.");
}
