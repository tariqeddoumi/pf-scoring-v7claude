'use client';

interface LoadingSkeletonProps {
  rows?: number;
  columns?: number;
}

export default function LoadingSkeleton({
  rows = 5,
  columns = 6,
}: LoadingSkeletonProps) {
  return (
    <div className="space-y-3 animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-8 bg-muted rounded w-48" />
        <div className="h-10 bg-muted rounded w-36" />
      </div>

      {/* Search bar skeleton */}
      <div className="h-10 bg-muted rounded w-full" />

      {/* Table skeleton */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        {/* Table header */}
        <div className="grid gap-4 px-4 py-3 bg-muted/50" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }).map((_, i) => (
            <div key={i} className="h-4 bg-secondary rounded w-3/4" />
          ))}
        </div>

        {/* Table rows */}
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div
            key={rowIndex}
            className="grid gap-4 px-4 py-3 border-t border-border"
            style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
          >
            {Array.from({ length: columns }).map((_, colIndex) => (
              <div
                key={colIndex}
                className="h-4 bg-muted rounded"
                style={{ width: `${60 + Math.random() * 30}%` }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
