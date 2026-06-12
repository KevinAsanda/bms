import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  BarChart3, 
  ShoppingCart, 
  Warehouse, 
  ShieldCheck, 
  LogOut 
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export default function Navigation() {
  const { user, logout } = useAuthStore();
  
  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['OWNER'] },
    { name: 'Reports', path: '/reports', icon: BarChart3, roles: ['OWNER'] },
    { name: 'POS', path: '/pos', icon: ShoppingCart, roles: ['OWNER', 'CASHIER'] },
    { name: 'Inventory', path: '/inventory', icon: Warehouse, roles: ['OWNER', 'STOCK_MANAGER'] },
    { name: 'Staff Management', path: '/admin', icon: ShieldCheck, roles: ['OWNER'] },
  ].filter(item => item.roles.includes(user?.role));

  return (
    <aside className="sidebar">
      {/* Logo Area */}
      <div className="sidebar-logo flex items-center gap-3">
        <img src="/logo-icon.svg" alt="Simon Family Farm Mascot" />
        <div>
          <h2 className="text-white text-md font-bold leading-none tracking-tight font-[var(--font-display)] m-0">SIMON FARM</h2>
          <span className="text-[10px] text-gray-400 font-medium tracking-wider">BUTCHERY BMS</span>
        </div>
      </div>

      {/* Nav Items */}
      <div className="flex-1 flex flex-col gap-1 px-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <item.icon size={20} strokeWidth={1.5} />
            <span>{item.name}</span>
          </NavLink>
        ))}
      </div>

      {/* User Info / Logout Area at the bottom */}
      <div className="p-4 border-t border-gray-800 flex flex-col gap-3">
        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 rounded-full bg-red-900/40 border border-red-500/30 flex items-center justify-center text-white font-bold font-[var(--font-display)] text-sm">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-semibold leading-none text-white truncate m-0">{user?.name}</p>
            <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mt-1 block">
              {user?.role?.replace('_', ' ')}
            </span>
          </div>
        </div>
        
        <button 
          onClick={logout}
          className="btn-secondary btn-sm w-full text-white border-gray-700 hover:bg-gray-800 hover:border-gray-600 flex items-center justify-center gap-2"
        >
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
