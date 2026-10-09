import type { InputHTMLAttributes, SelectHTMLAttributes, ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';

interface FieldProps {
  label: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
}

export function Field({ label, error, required, children }: FieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-navy-100 mb-1.5">
        {label}
        {required && <span className="text-accent-400 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-orange-400">{error}</p>}
    </div>
  );
}

const inputBase =
  'w-full rounded-lg bg-navy-800/60 border border-navy-500/40 px-3.5 py-2.5 text-sm text-white placeholder:text-navy-300/60 focus:outline-none focus:border-accent-400 focus:ring-1 focus:ring-accent-400/30 transition-colors';

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputBase} ${props.className || ''}`} />;
}

export function SelectInput({ children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select
        {...props}
        className={`${inputBase} appearance-none pr-9 ${props.className || ''}`}
      >
        {children}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-navy-300 pointer-events-none" />
    </div>
  );
}

export function TextArea(props: InputHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${inputBase} resize-none ${props.className || ''}`} />;
}
