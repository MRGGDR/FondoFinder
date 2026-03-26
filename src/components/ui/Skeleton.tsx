interface SkeletonProps {
  className?: string
}

export default function Skeleton({ className = '' }: SkeletonProps) {
  return <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
}

export function SkeletonCard() {
  return (
    <div className="animate-pulse bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gray-100 px-4 pt-4 pb-3 flex items-start justify-between">
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-4 w-8" />
      </div>
      {/* Body */}
      <div className="px-4 py-3 space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-3 w-1/2 mt-1" />
      </div>
      {/* Footer */}
      <div className="px-4 pb-4 pt-2 flex gap-2">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <div className="px-4 pb-4 flex justify-between items-center">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-8 w-20 rounded-lg" />
      </div>
    </div>
  )
}

export function SkeletonText({ lines = 3 }: { lines?: number }) {
  return (
    <div className="animate-pulse space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={`h-4 rounded ${i === lines - 1 ? 'w-3/5' : 'w-full'}`}
        />
      ))}
    </div>
  )
}
