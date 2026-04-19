import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = (import.meta as any).env.VITE_SUPABASE_URL || "https://laaholzwfjahuugaqzfh.supabase.co";
const SUPABASE_ANON_KEY = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhYWhvbHp3ZmphaHV1Z2FxemZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0OTgyNjAsImV4cCI6MjA5MjA3NDI2MH0._qdq6eFs1pnYUQ5mCMqbVbIql7IX60Qsax8Te5W6JC8";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
