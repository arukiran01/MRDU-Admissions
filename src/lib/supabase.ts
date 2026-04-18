import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://laaholzwfjahuugaqzfh.supabase.co";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_jyfddtLDeyAYEM15IxqjEg_pku83Toq";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
