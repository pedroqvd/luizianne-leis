import { cn } from '@/lib/utils';

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-lg bg-slate-100', className)} />;
}

export function SkeletonCard() {
  return (
    <div className="stat-card space-y-3">
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-3 w-24" />
        </div>
        <Skeleton className="h-9 w-9 rounded-xl" />
      </div>
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="px-4 py-3.5 flex items-start gap-3">
      <Skeleton className="h-7 w-7 rounded-lg flex-shrink-0 mt-0.5" />
      <div className="flex-1 space-y-2">
        <div className="flex gap-2">
          <Skeleton className="h-4 w-16 rounded-full" />
          <Skeleton className="h-4 w-24 rounded-full" />
        </div>
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/3" />
      </div>
    </div>
  );
}

export function SkeletonListPage({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="stat-card space-y-3">
        <div className="flex gap-3 flex-wrap">
          <Skeleton className="h-9 flex-1 min-w-[180px]" />
          <Skeleton className="h-9 w-36" />
          <Skeleton className="h-9 w-28" />
        </div>
      </div>
      <div className="bg-white rounded-xl border border-slate-100 shadow-card overflow-hidden">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="border-b border-slate-50 last:border-0">
            <SkeletonRow />
          </div>
        ))}
      </div>
    </div>
  );
}
