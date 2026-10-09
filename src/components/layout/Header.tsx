import { useState, useRef, useEffect } from 'react';
import { Menu, Bell, ChevronDown } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { demoNotifications } from '@/data/demoData';
import { useNavigate } from 'react-router-dom';

export default function Header({ onMenuClick }: { onMenuClick: () => void }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const [notifications, setNotifications] = useState(demoNotifications);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

  const markAllRead = () => setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

  return (
    <header className="sticky top-0 z-30 bg-navy-800/80 backdrop-blur-md border-b border-navy-600/40">
      <div className="flex items-center justify-between px-4 sm:px-6 py-4">
        <div className="flex items-center gap-3">
          <button onClick={onMenuClick} className="lg:hidden text-navy-200 hover:text-white">
            <Menu className="h-6 w-6" />
          </button>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-white">{greeting}!</h1>
            <p className="text-xs sm:text-sm text-navy-300">Welcome to LoanSure AI</p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setNotifOpen((o) => !o)}
              className="relative p-2 rounded-lg text-navy-200 hover:bg-navy-600/40 hover:text-white transition-colors"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-accent-400 ring-2 ring-navy-800" />
              )}
            </button>
            {notifOpen && (
              <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-xl bg-navy-700 border border-navy-500/40 shadow-xl overflow-hidden animate-slide-up">
                <div className="flex items-center justify-between px-4 py-3 border-b border-navy-600/40">
                  <h3 className="text-sm font-semibold text-white">Notifications</h3>
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} className="text-xs text-accent-400 hover:text-accent-300">
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto scrollbar-thin">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`flex gap-3 px-4 py-3 border-b border-navy-600/30 hover:bg-navy-600/30 transition-colors ${
                        !n.read ? 'bg-accent-500/5' : ''
                      }`}
                    >
                      <div className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${n.read ? 'bg-navy-500' : 'bg-accent-400'}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white">{n.title}</p>
                        <p className="text-xs text-navy-300 mt-0.5">{n.message}</p>
                        <p className="text-[10px] text-navy-400 mt-1">{n.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Profile */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setProfileOpen((o) => !o)}
              className="flex items-center gap-2 rounded-lg p-1 pr-2 hover:bg-navy-600/40 transition-colors"
            >
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-accent-500 to-accent-700 flex items-center justify-center text-sm font-bold text-white">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <span className="hidden sm:block text-sm font-medium text-white max-w-[120px] truncate">
                {user?.name || 'User'}
              </span>
              <ChevronDown className="hidden sm:block h-4 w-4 text-navy-300" />
            </button>
            {profileOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-xl bg-navy-700 border border-navy-500/40 shadow-xl overflow-hidden animate-slide-up">
                <div className="px-4 py-3 border-b border-navy-600/40">
                  <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
                  <p className="text-xs text-navy-300 truncate">{user?.email}</p>
                </div>
                <button
                  onClick={() => { setProfileOpen(false); navigate('/profile'); }}
                  className="flex w-full items-center px-4 py-2.5 text-sm text-navy-100 hover:bg-navy-600/40 transition-colors"
                >
                  My Profile
                </button>
                <button
                  onClick={() => { setProfileOpen(false); navigate('/settings'); }}
                  className="flex w-full items-center px-4 py-2.5 text-sm text-navy-100 hover:bg-navy-600/40 transition-colors"
                >
                  Settings
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
