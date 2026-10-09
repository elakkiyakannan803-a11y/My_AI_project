import { ShieldCheck } from 'lucide-react';

export default function Logo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = {
    sm: { box: 'h-8 w-8', icon: 16, text: 'text-base' },
    md: { box: 'h-10 w-10', icon: 20, text: 'text-lg' },
    lg: { box: 'h-14 w-14', icon: 28, text: 'text-2xl' },
  };
  const s = sizes[size];

  return (
    <div className="flex items-center gap-2.5">
      <div className={`${s.box} relative rounded-xl bg-gradient-to-br from-accent-500 to-accent-700 flex items-center justify-center shadow-lg shadow-accent-500/20`}>
        <ShieldCheck className={`text-white`} width={s.icon} height={s.icon} strokeWidth={2.5} />
        <div className={`absolute inset-0 rounded-xl border border-accent-300/30`} />
      </div>
      <div className="flex flex-col leading-none">
        <span className={`${s.text} font-bold text-white tracking-tight`}>
          LoanSure <span className="text-accent-400">AI</span>
        </span>
        <span className="text-[10px] text-navy-300 font-medium tracking-wide hidden sm:block">
          Smarter Decisions. Better Lending.
        </span>
      </div>
    </div>
  );
}
