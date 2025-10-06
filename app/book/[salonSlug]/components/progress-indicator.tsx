"use client";

type BookingStep = "service" | "staff" | "datetime" | "client-info" | "confirmation";

const steps = [
  { id: "service", label: "Service" },
  { id: "staff", label: "Staff" },
  { id: "datetime", label: "Date & Time" },
  { id: "client-info", label: "Your Info" },
];

export function ProgressIndicator({ currentStep }: { currentStep: BookingStep }) {
  const currentStepIndex = steps.findIndex((step) => step.id === currentStep);

  return (
    <div className="border-b border-gray-200 bg-gray-50 px-4 py-4">
      <div className="mx-auto flex max-w-md items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.id} className="flex flex-1 items-center">
            <div className="flex flex-1 flex-col items-center">
              {/* Circle */}
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors sm:h-10 sm:w-10 ${
                  index <= currentStepIndex ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-500"
                }`}
              >
                {index + 1}
              </div>
              {/* Label */}
              <span
                className={`mt-1 hidden text-center text-xs sm:block ${
                  index <= currentStepIndex ? "font-medium text-blue-600" : "text-gray-500"
                }`}
              >
                {step.label}
              </span>
            </div>

            {/* Connector line */}
            {index < steps.length - 1 && (
              <div
                className={`mx-1 h-0.5 flex-1 transition-colors sm:mx-2 ${
                  index < currentStepIndex ? "bg-blue-600" : "bg-gray-200"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Mobile step label */}
      <div className="mt-2 text-center sm:hidden">
        <span className="text-sm font-medium text-blue-600">{steps[currentStepIndex]?.label}</span>
      </div>
    </div>
  );
}
