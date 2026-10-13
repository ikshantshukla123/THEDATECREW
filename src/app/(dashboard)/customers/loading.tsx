export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="h-9 w-48 animate-pulse rounded-md bg-surface-muted" />
      <div className="h-10 w-full max-w-sm animate-pulse rounded-md bg-surface-muted" />
      <div className="flex gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-8 w-24 animate-pulse rounded-full bg-surface-muted" />
        ))}
      </div>
      <div className="overflow-hidden rounded-lg border border-border">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-14 animate-pulse border-b border-border bg-surface last:border-0" />
        ))}
      </div>
    </div>
  );
}
