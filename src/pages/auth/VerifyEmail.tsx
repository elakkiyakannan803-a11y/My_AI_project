import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { MailCheck, Mail, ArrowLeft, RotateCw, CheckCircle, AlertTriangle, Headset } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/lib/toast';
import Logo from '@/components/ui/Logo';
import { Button } from '@/components/ui/Button';

const RESEND_COOLDOWN_SECONDS = 60;

export default function VerifyEmail() {
  const { resendVerification } = useAuth();
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';
  const [cooldown, setCooldown] = useState(0);
  const [sending, setSending] = useState(false);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((c) => Math.max(0, c - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleResend = useCallback(async () => {
    if (cooldown > 0 || sending || !email) return;
    setSending(true);
    try {
      const result = await resendVerification(email);
      if (result.success) {
        showToast('Verification email sent. Please check your inbox.', 'success');
        setCooldown(RESEND_COOLDOWN_SECONDS);
      } else {
        showToast(result.error || 'Unable to resend verification email.', 'error');
      }
    } catch {
      showToast('An unexpected error occurred. Please try again.', 'error');
    } finally {
      setSending(false);
    }
  }, [cooldown, sending, email, resendVerification, showToast]);

  const handleContactSupport = useCallback(() => {
    if (!email) {
      showToast('Please enter an email address first.', 'error');
      return;
    }
    window.location.href = `mailto:${email}`;
  }, [email, showToast]);

  return (
    <div className="min-h-screen bg-navy-900 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-accent-500/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-accent-600/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="flex justify-center mb-6">
          <Logo size="lg" />
        </div>

        <div className="rounded-2xl bg-navy-800/80 border border-navy-600/40 backdrop-blur-sm p-6 sm:p-8 shadow-2xl">
          {verified ? (
            <div className="text-center py-4">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/15">
                <CheckCircle className="h-8 w-8 text-green-400" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Email Verified Successfully</h2>
              <p className="text-sm text-navy-300 mb-6">
                Your email has been verified. You can now sign in to your account.
              </p>
              <Link to="/login">
                <Button className="w-full">Sign In</Button>
              </Link>
            </div>
          ) : (
            <div className="text-center py-2">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent-500/15">
                <MailCheck className="h-8 w-8 text-accent-400" />
              </div>

              <h2 className="text-xl font-bold text-white mb-2">Verify Your Email</h2>
              <p className="text-sm text-navy-300 mb-4">
                A verification email has been sent to
              </p>
              {email && (
                <p className="text-sm font-semibold text-white mb-4 break-all">{email}</p>
              )}
              <p className="text-sm text-navy-300 mb-6">
                Click the link in the email to verify your account. The link will expire after a short period and can only be used once.
              </p>

              <div className="rounded-xl bg-navy-700/40 border border-navy-500/20 px-4 py-3 mb-6 flex gap-3 text-left">
                <AlertTriangle className="h-4 w-4 text-orange-400 shrink-0 mt-0.5" />
                <p className="text-xs text-navy-200">
                  Check your spam or junk folder if you don't see the email. Verification links expire and must be used promptly.
                </p>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={handleResend}
                  disabled={cooldown > 0 || sending || !email}
                  className="w-full"
                >
                  {sending ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 border-2 border-navy-900 border-t-transparent rounded-full animate-spin" />
                      Sending...
                    </span>
                  ) : cooldown > 0 ? (
                    <span className="flex items-center gap-2">
                      <RotateCw className="h-4 w-4 opacity-50" />
                      Resend in {cooldown}s
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Resend Verification Email
                    </span>
                  )}
                </Button>

                <Button
                  variant="ghost"
                  onClick={handleContactSupport}
                  disabled={!email}
                  className="w-full"
                >
                  <span className="flex items-center gap-2">
                    <Headset className="h-4 w-4" />
                    Contact Support
                  </span>
                </Button>

                <Link to="/login" className="flex items-center justify-center gap-1.5 text-sm text-accent-400 hover:text-accent-300">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Sign In
                </Link>
              </div>
            </div>
          )}
        </div>

        <p className="mt-4 text-center text-xs text-navy-400">
          LoanSure AI provides informational estimates only. Not a bank or lender.
        </p>
      </div>
    </div>
  );
}
