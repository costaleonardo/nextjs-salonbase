'use client'

type BookingStep = 'service' | 'staff' | 'datetime' | 'client-info' | 'confirmation'

const steps = [
  { id: 'service', label: 'Service' },
  { id: 'staff', label: 'Staff' },
  { id: 'datetime', label: 'Date & Time' },
  { id: 'client-info', label: 'Your Info' },
]

export function ProgressIndicator({ currentStep }: { currentStep: BookingStep }) {
  const currentStepIndex = steps.findIndex((step) => step.id === currentStep)

  return (
    <div className="bg-gray-50 border-b border-gray-200 px-4 py-4">
      <div className="flex items-center justify-between max-w-md mx-auto">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-1">
              {/* Circle */}
              <div
                className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  index <= currentStepIndex
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {index + 1}
              </div>
              {/* Label */}
              <span
                className={`text-xs mt-1 text-center hidden sm:block ${
                  index <= currentStepIndex ? 'text-blue-600 font-medium' : 'text-gray-500'
                }`}
              >
                {step.label}
              </span>
            </div>

            {/* Connector line */}
            {index < steps.length - 1 && (
              <div
                className={`h-0.5 flex-1 mx-1 sm:mx-2 transition-colors ${
                  index < currentStepIndex ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Mobile step label */}
      <div className="text-center mt-2 sm:hidden">
        <span className="text-sm font-medium text-blue-600">
          {steps[currentStepIndex]?.label}
        </span>
      </div>
    </div>
  )
}
