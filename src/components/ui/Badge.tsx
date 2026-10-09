import type { ReactNode } from 'react';

const variants = {
  success: 'bg-green-500/15 text-green-400 border-green-500/30',
  warning: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  error: 'bg-red-500/15 text-red-400 border-red-500/30',
  info: 'bg-accent-500/15 text-accent-400 border-accent-500/30',
  neutral: 'bg-navy-500/30 text-navy-200 border-navy-400/30',
};

export function Badge({ children, variant = 'neutral', className = '' }: { children: ReactNode; variant?: keyof typeof variants; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium border ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, keyof typeof variants> = {
    'Approved': 'success',
    'Eligible': 'success',
    'Potentially Eligible': 'success',
    'Completed': 'success',
    'Submitted': 'info',
    'Under Review': 'info',
    'Received by Lender': 'info',
    'Disbursal Pending': 'info',
    'Documents Required': 'warning',
    'Additional Documents Required': 'warning',
    'Draft': 'neutral',
    'Review Required': 'warning',
    'Needs Review': 'warning',
    'Rejected': 'error',
    'Not Eligible': 'error',
    'Uploaded': 'info',
    'Processing': 'info',
    'Verified': 'success',
  };
  const variant = map[status] || 'neutral';
  return <Badge variant={variant}>{status}</Badge>;
}
