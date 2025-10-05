'use client'

import { User } from '@prisma/client'

type StaffSelectionProps = {
  staff: Pick<User, 'id' | 'name' | 'email'>[]
  selectedStaffId?: string
  onSelect: (staffId: string) => void
  onBack: () => void
}

export function StaffSelection({
  staff,
  selectedStaffId,
  onSelect,
  onBack,
}: StaffSelectionProps) {
  if (staff.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">No staff available for this service.</p>
        <button
          onClick={onBack}
          className="px-6 py-2 text-blue-600 hover:text-blue-700 font-medium"
        >
          ← Go Back
        </button>
      </div>
    )
  }

  // If only one staff member, auto-select
  if (staff.length === 1 && !selectedStaffId) {
    onSelect(staff[0].id)
    return null
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Select Staff Member</h2>
        <button
          onClick={onBack}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          style={{ minHeight: '44px', minWidth: '44px' }}
        >
          ← Back
        </button>
      </div>

      <div className="space-y-3">
        {/* No preference option */}
        <button
          onClick={() => onSelect(staff[0].id)}
          className={`w-full text-left p-4 rounded-lg border-2 transition-all hover:border-blue-500 hover:shadow-md active:scale-[0.98] ${
            !selectedStaffId || selectedStaffId === staff[0].id
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 bg-white'
          }`}
          style={{ minHeight: '44px' }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900">No Preference</h3>
              <p className="text-sm text-gray-600 mt-1">
                First available staff member
              </p>
            </div>
            {(!selectedStaffId || selectedStaffId === staff[0].id) && (
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
            )}
          </div>
        </button>

        {/* Individual staff members */}
        {staff.map((member) => (
          <button
            key={member.id}
            onClick={() => onSelect(member.id)}
            className={`w-full text-left p-4 rounded-lg border-2 transition-all hover:border-blue-500 hover:shadow-md active:scale-[0.98] ${
              selectedStaffId === member.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 bg-white'
            }`}
            style={{ minHeight: '44px' }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Avatar placeholder */}
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-medium">
                  {member.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2)}
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">{member.name}</h3>
                </div>
              </div>
              {selectedStaffId === member.id && (
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
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
