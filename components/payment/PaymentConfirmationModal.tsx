'use client'

import { PaymentSourceData } from './PaymentSourceSelector'

interface PaymentConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  amount: number
  paymentSource: PaymentSourceData | null
  isProcessing: boolean
}

/**
 * Payment Confirmation Modal
 *
 * Requires explicit user confirmation before processing payment.
 * This is a critical safety measure to prevent accidental charges.
 */
export function PaymentConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  amount,
  paymentSource,
  isProcessing
}: PaymentConfirmationModalProps) {
  if (!isOpen) return null

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const getPaymentSourceDescription = () => {
    if (!paymentSource) return 'No payment source selected'

    switch (paymentSource.type) {
      case 'GIFT_CERTIFICATE':
        return `Gift Certificate (${paymentSource.giftCertificateCode})`
      case 'CREDIT_CARD':
        return paymentSource.creditCardLast4
          ? `Credit Card ending in ${paymentSource.creditCardLast4}`
          : 'Credit Card'
      case 'CASH':
        return 'Cash'
      case 'OTHER':
        return 'Other Payment Method'
      default:
        return 'Unknown'
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h2 className="text-2xl font-bold mb-4">Confirm Payment</h2>

        <div className="space-y-4 mb-6">
          <div className="border-t border-b border-gray-200 py-4">
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Amount:</span>
              <span className="font-semibold text-lg">{formatCurrency(amount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Payment Method:</span>
              <span className="font-semibold">{getPaymentSourceDescription()}</span>
            </div>
          </div>

          {paymentSource?.type === 'GIFT_CERTIFICATE' && paymentSource.giftCertificateBalance !== undefined && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="text-sm text-green-800">
                <div className="font-semibold mb-1">Gift Certificate Details:</div>
                <div>Current Balance: {formatCurrency(paymentSource.giftCertificateBalance)}</div>
                <div>Amount to Apply: {formatCurrency(Math.min(amount, paymentSource.giftCertificateBalance))}</div>
                <div>
                  Remaining Balance: {formatCurrency(Math.max(0, paymentSource.giftCertificateBalance - amount))}
                </div>
              </div>
            </div>
          )}

          {paymentSource?.type === 'CREDIT_CARD' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="text-sm text-blue-800">
                <div className="font-semibold mb-1">⚠️ Credit Card Charge</div>
                <div>Your card will be charged {formatCurrency(amount)} immediately.</div>
              </div>
            </div>
          )}

          <p className="text-sm text-gray-600">
            By confirming, you authorize this payment to be processed using the selected payment method.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isProcessing}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed"
          >
            {isProcessing ? 'Processing...' : 'Confirm Payment'}
          </button>
        </div>
      </div>
    </div>
  )
}
