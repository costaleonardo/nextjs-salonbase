'use client'

import { CheckCircle, XCircle, AlertCircle } from 'lucide-react'

interface PaymentResultDialogProps {
  isOpen: boolean
  onClose: () => void
  result: {
    status: 'success' | 'failed' | 'requires_action'
    message?: string
    paymentId?: string
    amount?: number
    canRetry?: boolean
  }
  onRetry?: () => void
}

/**
 * Payment result dialog
 *
 * Shows the result of a payment attempt with appropriate messaging
 * and actions based on the outcome.
 */
export default function PaymentResultDialog({
  isOpen,
  onClose,
  result,
  onRetry
}: PaymentResultDialogProps) {
  if (!isOpen) return null

  const getIcon = () => {
    switch (result.status) {
      case 'success':
        return <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
      case 'failed':
        return <XCircle className="h-16 w-16 text-red-500 mx-auto" />
      case 'requires_action':
        return <AlertCircle className="h-16 w-16 text-yellow-500 mx-auto" />
    }
  }

  const getTitle = () => {
    switch (result.status) {
      case 'success':
        return 'Payment Successful'
      case 'failed':
        return 'Payment Failed'
      case 'requires_action':
        return 'Additional Action Required'
    }
  }

  const getMessage = () => {
    if (result.message) {
      return result.message
    }

    switch (result.status) {
      case 'success':
        return `Your payment of $${result.amount?.toFixed(2)} has been processed successfully.`
      case 'failed':
        return 'We were unable to process your payment. Please try again or use a different payment method.'
      case 'requires_action':
        return 'Your payment requires additional authentication. Please complete the verification process.'
    }
  }

  const getBackgroundColor = () => {
    switch (result.status) {
      case 'success':
        return 'bg-green-50'
      case 'failed':
        return 'bg-red-50'
      case 'requires_action':
        return 'bg-yellow-50'
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={result.status === 'success' ? onClose : undefined}
        />

        {/* Dialog */}
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6 sm:p-8">
          {/* Icon */}
          <div className={`${getBackgroundColor()} rounded-full p-4 w-24 h-24 mx-auto mb-6 flex items-center justify-center`}>
            {getIcon()}
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-4">
            {getTitle()}
          </h2>

          {/* Message */}
          <p className="text-gray-600 text-center mb-6">
            {getMessage()}
          </p>

          {/* Payment ID (for success) */}
          {result.status === 'success' && result.paymentId && (
            <div className="bg-gray-50 rounded-lg p-3 mb-6">
              <p className="text-xs text-gray-500 text-center">
                Payment ID: {result.paymentId}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3">
            {result.status === 'success' && (
              <button
                onClick={onClose}
                className="w-full px-4 py-3 bg-green-600 text-white font-medium rounded-lg
                         hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500
                         focus:ring-offset-2 transition-colors duration-200
                         min-h-[44px] touch-manipulation"
              >
                Done
              </button>
            )}

            {result.status === 'failed' && (
              <>
                {result.canRetry && onRetry && (
                  <button
                    onClick={onRetry}
                    className="w-full px-4 py-3 bg-blue-600 text-white font-medium rounded-lg
                             hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500
                             focus:ring-offset-2 transition-colors duration-200
                             min-h-[44px] touch-manipulation"
                  >
                    Try Again
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="w-full px-4 py-3 border border-gray-300 text-gray-700 font-medium
                           rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2
                           focus:ring-gray-400 focus:ring-offset-2 transition-colors duration-200
                           min-h-[44px] touch-manipulation"
                >
                  {result.canRetry ? 'Use Different Payment Method' : 'Close'}
                </button>
              </>
            )}

            {result.status === 'requires_action' && (
              <button
                onClick={onClose}
                className="w-full px-4 py-3 bg-yellow-600 text-white font-medium rounded-lg
                         hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500
                         focus:ring-offset-2 transition-colors duration-200
                         min-h-[44px] touch-manipulation"
              >
                Complete Verification
              </button>
            )}
          </div>

          {/* Helper text for failed payments */}
          {result.status === 'failed' && (
            <p className="text-xs text-gray-500 text-center mt-4">
              If the problem persists, please contact your bank or try a different payment method.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
