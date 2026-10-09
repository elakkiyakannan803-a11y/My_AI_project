export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-navy-500/30 ${className}`} />;
}

export function SkeletonCard() {
  return (
    <div className="rounded-xl bg-navy-700/60 border border-navy-500/30 p-5 space-y-3">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-8 w-2/3" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  );
}
