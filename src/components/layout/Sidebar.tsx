import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Calculator,
  MapPin,
  Landmark,
  Bot,
  FileText,
  FolderOpen,
  User,
  Settings,
  LogOut,
  X,
  PiggyBank,
} from 'lucide-react';
import Logo from '@/components/ui/Logo';
import { useAuth } from '@/lib/auth';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/eligibility', label: 'Loan Eligibility', icon: Calculator },
  { to: '/calculator', label: 'EMI Calculator', icon: PiggyBank },
  { to: '/banks', label: 'Find Banks', icon: MapPin },
  { to: '/schemes', label: 'Loan Schemes', icon: Landmark },
  { to: '/assistant', label: 'AI Assistant', icon: Bot },
  { to: '/applications', label: 'Applications', icon: FileText },
  { to: '/documents', label: 'Documents', icon: FolderOpen },
  { to: '/profile', label: 'Profile', icon: User },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { logout } = useAuth();

  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />
      )}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-64 shrink-0 bg-navy-800 border-r border-navy-600/40 flex flex-col transition-transform duration-300 ${
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex items-center justify-between px-5 py-5 border-b border-navy-600/40">
          <Logo size="md" />
          <button onClick={onClose} className="lg:hidden text-navy-300 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => onClose()}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-accent-500/15 text-accent-400 border border-accent-500/30'
                      : 'text-navy-200 hover:bg-navy-600/40 hover:text-white'
                  }`
                }
              >
                <Icon className="h-4.5 w-4.5 shrink-0" width={18} height={18} />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-navy-600/40">
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-orange-400 hover:bg-orange-500/10 transition-colors"
          >
            <LogOut className="h-4.5 w-4.5" width={18} height={18} />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
