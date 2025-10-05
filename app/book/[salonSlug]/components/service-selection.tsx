'use client'

import { Service } from '@prisma/client'

type ServiceSelectionProps = {
  services: Service[]
  selectedServiceId?: string
  onSelect: (serviceId: string) => void
}

export function ServiceSelection({
  services,
  selectedServiceId,
  onSelect,
}: ServiceSelectionProps) {
  if (services.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No services available at this time.</p>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Select a Service</h2>
      <div className="space-y-3">
        {services.map((service) => (
          <button
            key={service.id}
            onClick={() => onSelect(service.id)}
            className={`w-full text-left p-4 rounded-lg border-2 transition-all hover:border-blue-500 hover:shadow-md active:scale-[0.98] ${
              selectedServiceId === service.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 bg-white'
            }`}
            style={{ minHeight: '44px' }} // Mobile touch target requirement
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">{service.name}</h3>
                {service.description && (
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                    {service.description}
                  </p>
                )}
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                  <span>{service.duration} min</span>
                  <span className="font-medium text-gray-900">
                    ${service.price.toString()}
                  </span>
                </div>
              </div>
              {selectedServiceId === service.id && (
                <div className="ml-3">
                  <svg
                    className="w-6 h-6 text-blue-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
