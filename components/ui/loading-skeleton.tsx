/**
 * Loading skeleton components for better mobile UX
 * Provides content-aware placeholders during data loading
 */

export function TimeSlotsSkeleton() {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className="h-11 bg-gray-200 rounded-lg animate-pulse"
          style={{ animationDelay: `${i * 50}ms` }}
        />
      ))}
    </div>
  )
}

export function ServiceCardSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="w-full p-4 rounded-lg border-2 border-gray-200 bg-white"
          style={{ minHeight: '44px' }}
        >
          <div className="animate-pulse">
            <div className="h-5 bg-gray-200 rounded w-1/3 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
            <div className="flex gap-4">
              <div className="h-4 bg-gray-200 rounded w-16"></div>
              <div className="h-4 bg-gray-200 rounded w-16"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export function FormSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div>
        <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
        <div className="h-11 bg-gray-200 rounded-lg"></div>
      </div>
      <div>
        <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
        <div className="h-11 bg-gray-200 rounded-lg"></div>
      </div>
      <div>
        <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
        <div className="h-11 bg-gray-200 rounded-lg"></div>
      </div>
      <div className="h-11 bg-gray-200 rounded-lg mt-4"></div>
    </div>
  )
}

export function AppointmentCardSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="p-4 bg-white border border-gray-200 rounded-lg animate-pulse"
        >
          <div className="flex justify-between mb-2">
            <div className="h-5 bg-gray-200 rounded w-1/3"></div>
            <div className="h-5 bg-gray-200 rounded w-16"></div>
          </div>
          <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      ))}
    </div>
  )
}

export function Skeleton({
  className = '',
  width,
  height,
}: {
  className?: string
  width?: string | number
  height?: string | number
}) {
  return (
    <div
      className={`bg-gray-200 rounded animate-pulse ${className}`}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
      }}
    />
  )
}
