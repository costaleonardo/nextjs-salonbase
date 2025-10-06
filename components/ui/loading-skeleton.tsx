/**
 * Loading skeleton components for better mobile UX
 * Provides content-aware placeholders during data loading
 */

export function TimeSlotsSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className="h-11 animate-pulse rounded-lg bg-gray-200"
          style={{ animationDelay: `${i * 50}ms` }}
        />
      ))}
    </div>
  );
}

export function ServiceCardSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="w-full rounded-lg border-2 border-gray-200 bg-white p-4"
          style={{ minHeight: "44px" }}
        >
          <div className="animate-pulse">
            <div className="mb-2 h-5 w-1/3 rounded bg-gray-200"></div>
            <div className="mb-2 h-4 w-2/3 rounded bg-gray-200"></div>
            <div className="flex gap-4">
              <div className="h-4 w-16 rounded bg-gray-200"></div>
              <div className="h-4 w-16 rounded bg-gray-200"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function FormSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div>
        <div className="mb-2 h-4 w-24 rounded bg-gray-200"></div>
        <div className="h-11 rounded-lg bg-gray-200"></div>
      </div>
      <div>
        <div className="mb-2 h-4 w-24 rounded bg-gray-200"></div>
        <div className="h-11 rounded-lg bg-gray-200"></div>
      </div>
      <div>
        <div className="mb-2 h-4 w-24 rounded bg-gray-200"></div>
        <div className="h-11 rounded-lg bg-gray-200"></div>
      </div>
      <div className="mt-4 h-11 rounded-lg bg-gray-200"></div>
    </div>
  );
}

export function AppointmentCardSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="animate-pulse rounded-lg border border-gray-200 bg-white p-4">
          <div className="mb-2 flex justify-between">
            <div className="h-5 w-1/3 rounded bg-gray-200"></div>
            <div className="h-5 w-16 rounded bg-gray-200"></div>
          </div>
          <div className="mb-2 h-4 w-2/3 rounded bg-gray-200"></div>
          <div className="h-4 w-1/2 rounded bg-gray-200"></div>
        </div>
      ))}
    </div>
  );
}

export function Skeleton({
  className = "",
  width,
  height,
}: {
  className?: string;
  width?: string | number;
  height?: string | number;
}) {
  return (
    <div
      className={`animate-pulse rounded bg-gray-200 ${className}`}
      style={{
        width: typeof width === "number" ? `${width}px` : width,
        height: typeof height === "number" ? `${height}px` : height,
      }}
    />
  );
}
