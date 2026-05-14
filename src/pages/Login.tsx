import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Lock, Mail, Loader2, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { supabase } from '../lib/supabase';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        throw new Error(authError.message);
      }

      if (data.session) {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || "An error occurred during sign in.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 font-sans">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-sm bg-white text-slate-800 rounded-xl shadow-sm border border-slate-200 overflow-hidden"
      >
        <div className="p-8 pb-4 text-center">
          <div className="flex flex-col items-center justify-center mb-6 gap-2">
            <img src="https://mrdu.edu.in/wp-content/uploads/2025/08/Logo.png" alt="MALLA REDDY Logo" className="h-[70px] w-auto" referrerPolicy="no-referrer" />
            <div className="text-center mt-2">
              <h1 className="text-lg font-bold text-slate-800 uppercase tracking-widest leading-tight">MALLA REDDY (MR)</h1>
              <p className="text-[11px] font-bold text-slate-800 mt-1 uppercase tracking-wide leading-tight">(DEEMED TO BE UNIVERSITY)</p>
              <p className="text-[9px] text-slate-600 font-medium leading-tight mt-1 max-w-[280px]">
                Recognised Under Section 3 of The UGC Act, 1956.
              </p>
            </div>
          </div>
          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-4 p-3 bg-red-50 border border-red-100 rounded-md flex items-start gap-2 text-red-600 text-[12px]"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </motion.div>
          )}

          <p className="text-slate-500 text-[13px] border-t border-slate-100 pt-4 mt-4">Login to access admissions portal</p>
        </div>
        
        <div className="p-8 pt-4">
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  disabled={loading}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 rounded-md border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm outline-none disabled:bg-slate-50"
                  placeholder="admin@mrdu.edu.in"
                  required
                />
              </div>
            </div>
            
            <div>
               <label className="block text-[11px] font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  disabled={loading}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 rounded-md border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm outline-none disabled:bg-slate-50"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm py-2.5 rounded-md transition-all shadow-sm active:scale-[0.98] disabled:bg-blue-400 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
