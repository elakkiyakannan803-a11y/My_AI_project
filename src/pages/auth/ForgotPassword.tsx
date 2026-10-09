import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import Logo from '@/components/ui/Logo';
import { Button } from '@/components/ui/Button';

export default function ForgotPassword() {
  const { resetPassword } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!email) {
      setError('Please enter your email.');
      return;
    }
    if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const result = await resetPassword(email);
      setLoading(false);
      if (result.success) {
        setSent(true);
      } else {
        setError(result.error || 'Unable to reset password.');
      }
    } catch {
      setLoading(false);
      setError('An unexpected error occurred. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-navy-900 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-accent-500/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="flex justify-center mb-6">
          <Logo size="lg" />
        </div>

        <div className="rounded-2xl bg-navy-800/80 border border-navy-600/40 backdrop-blur-sm p-6 sm:p-8 shadow-2xl">
          {sent ? (
            <div className="text-center py-4">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/15">
                <CheckCircle className="h-8 w-8 text-green-400" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Check Your Email</h2>
              <p className="text-sm text-navy-300 mb-6">
                If an account exists for {email}, you'll receive a password reset link shortly.
              </p>
              <Button onClick={() => navigate('/login')} className="w-full">
                Back to Sign In
              </Button>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-bold text-white mb-1">Forgot Password</h2>
              <p className="text-sm text-navy-300 mb-6">Enter your email to receive a reset link</p>

              <form onSubmit={handleSubmit} className="space-y-4">
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
                      className={`w-full rounded-lg bg-navy-800/60 border ${error ? 'border-orange-500' : 'border-navy-500/40'} pl-10 pr-3.5 py-2.5 text-sm text-white placeholder:text-navy-300/60 focus:outline-none focus:border-accent-400 focus:ring-1 focus:ring-accent-400/30`}
                    />
                  </div>
                  {error && <p className="mt-1 text-xs text-orange-400">{error}</p>}
                </div>

                <Button type="submit" size="lg" className="w-full" disabled={loading}>
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 border-2 border-navy-900 border-t-transparent rounded-full animate-spin" />
                      Sending...
                    </span>
                  ) : (
                    'Send Reset Link'
                  )}
                </Button>
              </form>

              <Link to="/login" className="mt-6 flex items-center justify-center gap-1.5 text-sm text-accent-400 hover:text-accent-300">
                <ArrowLeft className="h-4 w-4" />
                Back to Sign In
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
