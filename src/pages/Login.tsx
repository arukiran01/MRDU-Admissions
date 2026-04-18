import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2 } from 'lucide-react';
import { motion } from 'motion/react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Dummy login logic
    if (email && password) {
      navigate('/dashboard');
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
              <p className="text-[10px] font-bold text-slate-600 mb-1">(DEEMED TO BE UNIVERSITY)</p>
              <p className="text-[8px] text-slate-400 font-medium leading-[1.2] max-w-[280px]">
                Recognised Under Section 3 of The UGC Act, 1956, Vide Notification No.9-5/2025-U.3(A) by Department of Higher Education, Ministry of Education, Government of India.
              </p>
            </div>
          </div>
          <p className="text-slate-500 text-[13px] border-t border-slate-100 pt-4 mt-2">Login to access admissions portal</p>
        </div>
        
        <div className="p-8 pt-4">
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm outline-none"
                placeholder="admin@mrdu.edu.in"
                required
              />
            </div>
            
            <div>
               <label className="block text-[11px] font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm outline-none"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm py-2.5 rounded-md transition-colors shadow-sm"
            >
              Sign In
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
