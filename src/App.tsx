import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/lib/auth';
import { ThemeProvider } from '@/lib/theme';
import { ToastProvider } from '@/lib/toast';
import Layout from '@/components/layout/Layout';
import Login from '@/pages/auth/Login';
import SignUp from '@/pages/auth/SignUp';
import ForgotPassword from '@/pages/auth/ForgotPassword';
import VerifyEmail from '@/pages/auth/VerifyEmail';
import Dashboard from '@/pages/Dashboard';
import Eligibility from '@/pages/Eligibility';
import Calculator from '@/pages/Calculator';
import Banks from '@/pages/Banks';
import Schemes from '@/pages/Schemes';
import Assistant from '@/pages/Assistant';
import Applications from '@/pages/Applications';
import ApplyLoan from '@/pages/ApplyLoan';
import Documents from '@/pages/Documents';
import Profile from '@/pages/Profile';
import Settings from '@/pages/Settings';
import type { ReactNode } from 'react';

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isEmailVerified, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-navy-900 flex items-center justify-center">
        <div className="h-8 w-8 border-2 border-accent-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isEmailVerified) return <Navigate to="/verify-email" replace />;

  return <>{children}</>;
}

function PublicRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isEmailVerified, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-navy-900 flex items-center justify-center">
        <div className="h-8 w-8 border-2 border-accent-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isAuthenticated && isEmailVerified) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
              <Route path="/signup" element={<PublicRoute><SignUp /></PublicRoute>} />
              <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/eligibility" element={<Eligibility />} />
                <Route path="/calculator" element={<Calculator />} />
                <Route path="/banks" element={<Banks />} />
                <Route path="/schemes" element={<Schemes />} />
                <Route path="/assistant" element={<Assistant />} />
                <Route path="/applications" element={<Applications />} />
                <Route path="/apply" element={<ApplyLoan />} />
                <Route path="/documents" element={<Documents />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/settings" element={<Settings />} />
              </Route>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
