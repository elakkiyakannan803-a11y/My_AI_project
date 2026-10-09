import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
}

export function Button({ variant = 'primary', size = 'md', children, className = '', ...props }: ButtonProps) {
  const variants = {
    primary: 'bg-accent-500 hover:bg-accent-400 text-navy-900 font-semibold shadow-lg shadow-accent-500/20',
    secondary: 'bg-navy-600 hover:bg-navy-500 text-white border border-navy-400/30',
    ghost: 'bg-transparent hover:bg-navy-600/50 text-navy-100',
    danger: 'bg-red-500/90 hover:bg-red-500 text-white',
  };
  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
  };
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </button>
  );
}
