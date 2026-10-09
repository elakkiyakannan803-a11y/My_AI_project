import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User, Eye, EyeOff, UserPlus, Check } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/lib/toast';
import Logo from '@/components/ui/Logo';
import { Button } from '@/components/ui/Button';

export default function SignUp() {
  const { signup } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agree, setAgree] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string; confirm?: string; agree?: string }>({});
  const [loading, setLoading] = useState(false);

  const passwordChecks = [
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'Contains uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'Contains a number', met: /\d/.test(password) },
  ];

  const validate = () => {
    const e: typeof errors = {};
    if (!name) e.name = 'Please enter your full name.';
    else if (name.trim().length < 2) e.name = 'Name must be at least 2 characters.';
    if (!email) e.email = 'Please enter your email.';
    else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) e.email = 'Please enter a valid email address.';
    if (!password) e.password = 'Please enter a password.';
    else if (password.length < 8) e.password = 'Password must be at least 8 characters.';
    if (password !== confirm) e.confirm = 'Passwords do not match.';
    if (!agree) e.agree = 'Please accept the terms to continue.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const result = await signup(name, email, password);
      if (result.success) {
        showToast('Account created! Verification email sent.', 'success');
        navigate(`/verify-email?email=${encodeURIComponent(email)}`);
      } else {
        showToast(result.error || 'Sign up failed.', 'error');
      }
    } catch {
      showToast('An unexpected error occurred. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-navy-900 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-accent-500/10 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-accent-600/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="flex justify-center mb-6">
          <Logo size="lg" />
        </div>

        <div className="rounded-2xl bg-navy-800/80 border border-navy-600/40 backdrop-blur-sm p-6 sm:p-8 shadow-2xl">
          <h2 className="text-xl font-bold text-white mb-1">Create Account</h2>
          <p className="text-sm text-navy-300 mb-6">Sign up to start exploring loan options</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-navy-100 mb-1.5">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-navy-300" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  autoComplete="name"
                  className={`w-full rounded-lg bg-navy-800/60 border ${errors.name ? 'border-orange-500' : 'border-navy-500/40'} pl-10 pr-3.5 py-2.5 text-sm text-white placeholder:text-navy-300/60 focus:outline-none focus:border-accent-400 focus:ring-1 focus:ring-accent-400/30`}
                />
              </div>
              {errors.name && <p className="mt-1 text-xs text-orange-400">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-navy-100 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-navy-300" />
                <input
                  type="text"
                  inputMode="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className={`w-full rounded-lg bg-navy-800/60 border ${errors.email ? 'border-orange-500' : 'border-navy-500/40'} pl-10 pr-3.5 py-2.5 text-sm text-white placeholder:text-navy-300/60 focus:outline-none focus:border-accent-400 focus:ring-1 focus:ring-accent-400/30`}
                />
              </div>
              {errors.email && <p className="mt-1 text-xs text-orange-400">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-navy-100 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-navy-300" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 8 characters"
                  autoComplete="new-password"
                  className={`w-full rounded-lg bg-navy-800/60 border ${errors.password ? 'border-orange-500' : 'border-navy-500/40'} pl-10 pr-10 py-2.5 text-sm text-white placeholder:text-navy-300/60 focus:outline-none focus:border-accent-400 focus:ring-1 focus:ring-accent-400/30`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-300 hover:text-white"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-orange-400">{errors.password}</p>}
              {password.length > 0 && (
                <div className="mt-2 space-y-1">
                  {passwordChecks.map((check) => (
                    <div key={check.label} className="flex items-center gap-1.5 text-xs">
                      <Check className={`h-3 w-3 ${check.met ? 'text-green-400' : 'text-navy-500'}`} />
                      <span className={check.met ? 'text-green-400' : 'text-navy-400'}>{check.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-navy-100 mb-1.5">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-navy-300" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Re-enter password"
                  autoComplete="new-password"
                  className={`w-full rounded-lg bg-navy-800/60 border ${errors.confirm ? 'border-orange-500' : 'border-navy-500/40'} pl-10 pr-3.5 py-2.5 text-sm text-white placeholder:text-navy-300/60 focus:outline-none focus:border-accent-400 focus:ring-1 focus:ring-accent-400/30`}
                />
              </div>
              {errors.confirm && <p className="mt-1 text-xs text-orange-400">{errors.confirm}</p>}
            </div>

            <label className="flex items-start gap-2 text-sm text-navy-200 cursor-pointer">
              <input
                type="checkbox"
                checked={agree}
                onChange={(e) => setAgree(e.target.checked)}
                className="h-4 w-4 rounded border-navy-500 bg-navy-800 text-accent-500 focus:ring-accent-400 mt-0.5"
              />
              <span>
                I agree to the Terms of Service and Privacy Policy. I understand LoanSure AI provides informational estimates only.
              </span>
            </label>
            {errors.agree && <p className="text-xs text-orange-400">{errors.agree}</p>}

            <Button type="submit" size="lg" className="w-full" disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 border-2 border-navy-900 border-t-transparent rounded-full animate-spin" />
                  Creating account...
                </span>
              ) : (
                <>
                  <UserPlus className="h-4.5 w-4.5" width={18} height={18} />
                  Create Account
                </>
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-navy-300">
            Already have an account?{' '}
            <Link to="/login" className="text-accent-400 hover:text-accent-300 font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
