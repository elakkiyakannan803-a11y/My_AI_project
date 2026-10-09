import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Bell,
  Lock,
  Shield,
  Moon,
  Sun,
  LogOut,
  ChevronRight,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/lib/auth';
import { useTheme } from '@/lib/theme';
import { useToast } from '@/lib/toast';

export default function Settings() {
  const { logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState({
    eligibility: true,
    schemes: true,
    documents: true,
    applications: true,
  });
  const [privacy, setPrivacy] = useState({
    profileVisible: true,
    shareData: false,
  analytics: true,
  });

  const handleLogout = async () => {
    await logout();
    showToast('You have been logged out.', 'info');
    navigate('/login');
  };

  type SettingsItem = {
    label: string;
    action?: () => void;
    toggle?: boolean;
    onToggle?: () => void;
  };

  const settingsSections: { title: string; icon: typeof User; items: SettingsItem[] }[] = [
    {
      title: 'Profile Settings',
      icon: User,
      items: [
        { label: 'Edit Profile', action: () => navigate('/profile') },
        { label: 'Change Password', action: () => showToast('Password change is not available in demo mode.', 'info') },
      ],
    },
    {
      title: 'Privacy',
      icon: Shield,
      items: [
        { label: 'Profile Visibility', toggle: privacy.profileVisible, onToggle: () => setPrivacy({ ...privacy, profileVisible: !privacy.profileVisible }) },
        { label: 'Share Data with Lenders', toggle: privacy.shareData, onToggle: () => setPrivacy({ ...privacy, shareData: !privacy.shareData }) },
        { label: 'Analytics & Tracking', toggle: privacy.analytics, onToggle: () => setPrivacy({ ...privacy, analytics: !privacy.analytics }) },
      ],
    },
    {
      title: 'Security',
      icon: Lock,
      items: [
        { label: 'Two-Factor Authentication', action: () => showToast('2FA is not available in demo mode.', 'info') },
        { label: 'Active Sessions', action: () => showToast('1 active session (this device).', 'info') },
      ],
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div>
        <h2 className="text-xl font-bold text-white mb-1">Settings</h2>
        <p className="text-sm text-navy-300">Manage your account preferences and configuration</p>
      </div>

      {/* Theme toggle */}
      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
        </CardHeader>
        <CardBody>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-navy-600/50 text-accent-400">
                {theme === 'dark' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
              </div>
              <div>
                <p className="text-sm font-medium text-white">Theme</p>
                <p className="text-xs text-navy-300">Switch between dark and light mode</p>
              </div>
            </div>
            <button
              onClick={toggleTheme}
              className={`relative h-7 w-12 rounded-full transition-colors ${theme === 'dark' ? 'bg-accent-500' : 'bg-navy-600'}`}
            >
              <span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-transform ${theme === 'dark' ? 'left-6' : 'left-1'}`} />
            </button>
          </div>
        </CardBody>
      </Card>

      {/* Notification settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-accent-400" />
            <CardTitle>Notification Settings</CardTitle>
          </div>
        </CardHeader>
        <CardBody className="space-y-3">
          {[
            { key: 'eligibility', label: 'Eligibility Updates', desc: 'Get notified when your eligibility estimate changes' },
            { key: 'schemes', label: 'New Loan Schemes', desc: 'Receive alerts about new loan schemes' },
            { key: 'documents', label: 'Document Reminders', desc: 'Get reminded about pending document uploads' },
            { key: 'applications', label: 'Application Status', desc: 'Get notified about application status changes' },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between py-2 border-b border-navy-600/20 last:border-0">
              <div>
                <p className="text-sm font-medium text-white">{item.label}</p>
                <p className="text-xs text-navy-300">{item.desc}</p>
              </div>
              <button
                onClick={() => setNotifications({ ...notifications, [item.key]: !notifications[item.key as keyof typeof notifications] })}
                className={`relative h-6 w-11 rounded-full transition-colors ${notifications[item.key as keyof typeof notifications] ? 'bg-accent-500' : 'bg-navy-600'}`}
              >
                <span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-transform ${notifications[item.key as keyof typeof notifications] ? 'left-6' : 'left-1'}`} />
              </button>
            </div>
          ))}
        </CardBody>
      </Card>

      {/* Other settings sections */}
      {settingsSections.map((section) => {
        const Icon = section.icon;
        return (
          <Card key={section.title}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-accent-400" />
                <CardTitle>{section.title}</CardTitle>
              </div>
            </CardHeader>
            <CardBody className="space-y-1">
              {section.items.map((item, i) => (
                <div key={i} className="flex items-center justify-between py-2.5 border-b border-navy-600/20 last:border-0">
                  <span className="text-sm text-navy-100">{item.label}</span>
                  {item.toggle !== undefined ? (
                    <button
                      onClick={item.onToggle}
                      className={`relative h-6 w-11 rounded-full transition-colors ${item.toggle ? 'bg-accent-500' : 'bg-navy-600'}`}
                    >
                      <span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-transform ${item.toggle ? 'left-6' : 'left-1'}`} />
                    </button>
                  ) : (
                    <button onClick={item.action} className="text-navy-300 hover:text-accent-400">
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </CardBody>
          </Card>
        );
      })}

      {/* Logout */}
      <Card className="border-orange-500/30">
        <CardBody className="pt-5">
          <Button variant="danger" className="w-full" onClick={handleLogout}>
            <LogOut className="h-4.5 w-4.5" width={18} height={18} />
            Logout
          </Button>
        </CardBody>
      </Card>
    </div>
  );
}
