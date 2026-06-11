import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FileText, ShoppingCart, Package, Users, LogOut } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export default function Navigation() {
  const { user, logout } = useAuthStore();
  
  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['OWNER'] },
    { name: 'Reports', path: '/reports', icon: FileText, roles: ['OWNER'] },
    { name: 'POS', path: '/pos', icon: ShoppingCart, roles: ['OWNER', 'CASHIER'] },
    { name: 'Inventory', path: '/inventory', icon: Package, roles: ['OWNER', 'STOCK_MANAGER'] },
    { name: 'Staff', path: '/admin', icon: Users, roles: ['OWNER'] },
  ].filter(item => item.roles.includes(user?.role));

  return (
    <nav className="h-16 bg-[var(--color-bg-surface)] border-b border-[var(--color-border)] px-6 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[var(--color-primary)] rounded-full flex items-center justify-center text-black font-bold text-sm">B</div>
          <span className="font-bold font-[var(--font-display)] hidden md:block tracking-tight text-white">BMS</span>
        </div>
        
        <div className="flex items-center gap-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `
                flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-bold transition-all
                ${isActive 
                  ? 'text-[var(--color-primary)] bg-[var(--color-bg-elevated)]' 
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                }
              `}
            >
              <item.icon size={16} />
              <span className="hidden sm:block">{item.name}</span>
            </NavLink>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-bold leading-none">{user?.name}</p>
          <p className="text-[10px] text-[var(--color-text-secondary)] uppercase tracking-widest font-bold mt-1">{user?.role}</p>
        </div>
        <button 
          onClick={logout}
          className="p-2 hover:bg-[var(--color-bg-elevated)] rounded-xl text-[var(--color-text-secondary)] hover:text-[var(--color-error)] transition-colors"
          title="Logout"
        >
          <LogOut size={20} />
        </button>
      </div>
    </nav>
  );
}
