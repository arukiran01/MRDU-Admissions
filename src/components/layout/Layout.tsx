import { ReactNode } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  Building2, 
  LayoutDashboard, 
  UserPlus, 
  CheckSquare, 
  FileText, 
  LogOut 
} from 'lucide-react';

export default function Layout({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Add Student', path: '/add-student', icon: UserPlus },
    { name: 'Document Verification', path: '/verify', icon: CheckSquare },
    { name: 'Reports', path: '#', icon: FileText },
  ];

  // Do not show sidebar on certain pages like login or print receipt
  const isPrintReceipt = location.pathname.includes('/receipt');
  
  if (isPrintReceipt) {
    return <main className="min-h-screen bg-gray-50">{children}</main>;
  }

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800">
      {/* Sidebar */}
      <aside className="w-[220px] bg-white border-r border-slate-200 flex flex-col">
        <div className="h-[75px] flex items-center px-4 shrink-0 border-b border-slate-200">
          <img src="https://mrdu.edu.in/wp-content/uploads/2025/08/Logo.png" alt="MALLA REDDY Logo" className="h-10 w-auto mr-2 shrink-0" referrerPolicy="no-referrer" />
          <div className="flex flex-col">
            <span className="text-[13px] font-bold text-slate-800 leading-tight">MALLA REDDY (MR)</span>
            <span className="text-[9px] font-bold text-slate-500">(DEEMED TO BE UNIVERSITY)</span>
          </div>
        </div>
        
        <nav className="flex-1 py-6 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center px-6 py-3 text-sm font-medium transition-colors ${
                  isActive 
                    ? 'text-blue-600 bg-blue-50 border-r-[3px] border-blue-600' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 border-r-[3px] border-transparent'
                }`
              }
            >
              <item.icon className="w-5 h-5 mr-3 flex-shrink-0" />
              {item.name}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Navbar */}
        <header className="h-[60px] bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0">
          <div /> {/* Spacer */}
          <div className="flex items-center space-x-6">
            <div className="text-right">
              <div className="text-[13px] font-semibold text-slate-800">Admin</div>
              <div className="text-[11px] text-slate-500">Administration Team</div>
            </div>
            <button 
              onClick={handleLogout} 
              className="px-3 py-1.5 text-xs font-semibold text-slate-800 bg-transparent border border-slate-200 rounded-md hover:bg-slate-50 transition-colors"
            >
              Logout
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
