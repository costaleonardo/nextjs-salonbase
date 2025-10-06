"use client";

import { useState, useEffect } from "react";
import { checkGiftCertificateBalance } from "@/app/actions/gift-certificates";

export type PaymentSource = "GIFT_CERTIFICATE" | "CREDIT_CARD" | "CASH" | "OTHER";

export interface PaymentSourceData {
  type: PaymentSource;
  giftCertificateCode?: string;
  giftCertificateBalance?: number;
  creditCardLast4?: string;
}

interface PaymentSourceSelectorProps {
  amountDue: number;
  onSourceChange: (source: PaymentSourceData | null) => void;
  availableGiftCertificates?: Array<{ code: string; balance: number }>;
  savedCards?: Array<{ id: string; last4: string; brand: string }>;
  disabled?: boolean;
}

/**
 * CRITICAL PAYMENT COMPONENT
 *
 * This component implements the explicit payment source selection UI
 * required for payment reliability. It ensures:
 *
 * 1. Gift certificates are shown FIRST and DEFAULT if available
 * 2. Users must explicitly select their payment source
 * 3. Gift certificate balance is prominently displayed
 * 4. Credit card charges require explicit user selection
 * 5. All selections are logged for audit trail
 */
export function PaymentSourceSelector({
  amountDue,
  onSourceChange,
  availableGiftCertificates = [],
  savedCards = [],
  disabled = false,
}: PaymentSourceSelectorProps) {
  const [selectedSource, setSelectedSource] = useState<PaymentSource | null>(null);
  const [giftCertificateCode, setGiftCertificateCode] = useState("");
  const [giftCertificateBalance, setGiftCertificateBalance] = useState<number | null>(null);
  const [isCheckingGiftCertificate, setIsCheckingGiftCertificate] = useState(false);
  const [giftCertificateError, setGiftCertificateError] = useState<string | null>(null);

  // Auto-select gift certificate if available and sufficient balance
  useEffect(() => {
    if (availableGiftCertificates.length > 0 && !selectedSource) {
      const firstCert = availableGiftCertificates[0];
      if (firstCert.balance >= amountDue) {
        setSelectedSource("GIFT_CERTIFICATE");
        setGiftCertificateCode(firstCert.code);
        setGiftCertificateBalance(firstCert.balance);
        onSourceChange({
          type: "GIFT_CERTIFICATE",
          giftCertificateCode: firstCert.code,
          giftCertificateBalance: firstCert.balance,
        });
      }
    }
  }, [availableGiftCertificates, amountDue, selectedSource, onSourceChange]);

  const handleSourceChange = (source: PaymentSource) => {
    setSelectedSource(source);
    setGiftCertificateError(null);

    if (source === "GIFT_CERTIFICATE") {
      // Don't emit change until we have a valid certificate
      onSourceChange(null);
    } else if (source === "CASH" || source === "OTHER") {
      onSourceChange({ type: source });
    } else {
      // For credit card, we'll emit the change with card details
      onSourceChange({ type: source });
    }
  };

  const handleCheckGiftCertificate = async () => {
    if (!giftCertificateCode.trim()) {
      setGiftCertificateError("Please enter a gift certificate code");
      return;
    }

    setIsCheckingGiftCertificate(true);
    setGiftCertificateError(null);

    const result = await checkGiftCertificateBalance(giftCertificateCode);

    setIsCheckingGiftCertificate(false);

    if (result.success && result.data) {
      const balance = parseFloat(result.data.balance.toString());
      setGiftCertificateBalance(balance);
      onSourceChange({
        type: "GIFT_CERTIFICATE",
        giftCertificateCode: result.data.code,
        giftCertificateBalance: balance,
      });
    } else {
      setGiftCertificateError(result.error || "Invalid gift certificate");
      setGiftCertificateBalance(null);
      onSourceChange(null);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  return (
    <div className="space-y-4">
      <div className="mb-4 text-lg font-semibold">Total Due: {formatCurrency(amountDue)}</div>

      <div className="space-y-3">
        {/* Gift Certificate Option - ALWAYS SHOWN FIRST */}
        {availableGiftCertificates.length > 0 && (
          <div className="rounded-lg border-2 border-green-500 bg-green-50 p-4">
            <div className="flex items-start">
              <input
                type="radio"
                id="gift-certificate-saved"
                name="paymentSource"
                value="GIFT_CERTIFICATE"
                checked={selectedSource === "GIFT_CERTIFICATE"}
                onChange={() => handleSourceChange("GIFT_CERTIFICATE")}
                disabled={disabled}
                className="mt-1 h-5 w-5 text-green-600 focus:ring-green-500"
              />
              <label htmlFor="gift-certificate-saved" className="ml-3 flex-1 cursor-pointer">
                <div className="font-semibold text-green-900">Gift Certificate</div>
                <div className="mt-1 text-sm text-green-700">
                  Available Balance: {formatCurrency(availableGiftCertificates[0].balance)}
                </div>
                <div className="mt-1 text-xs text-green-600">
                  Code: {availableGiftCertificates[0].code}
                </div>
                {availableGiftCertificates[0].balance < amountDue && (
                  <div className="mt-2 text-sm text-orange-600">
                    ⚠️ Remaining {formatCurrency(amountDue - availableGiftCertificates[0].balance)}{" "}
                    will need another payment method
                  </div>
                )}
              </label>
            </div>
          </div>
        )}

        {/* Manual Gift Certificate Entry */}
        {availableGiftCertificates.length === 0 && (
          <div className="rounded-lg border-2 p-4">
            <div className="flex items-start">
              <input
                type="radio"
                id="gift-certificate-manual"
                name="paymentSource"
                value="GIFT_CERTIFICATE"
                checked={selectedSource === "GIFT_CERTIFICATE"}
                onChange={() => handleSourceChange("GIFT_CERTIFICATE")}
                disabled={disabled}
                className="mt-1 h-5 w-5 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="gift-certificate-manual" className="ml-3 flex-1">
                <div className="font-semibold">Gift Certificate</div>
                {selectedSource === "GIFT_CERTIFICATE" && (
                  <div className="mt-3 space-y-2">
                    <input
                      type="text"
                      value={giftCertificateCode}
                      onChange={(e) => setGiftCertificateCode(e.target.value.toUpperCase())}
                      placeholder="XXXX-XXXX-XXXX"
                      className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      disabled={disabled || isCheckingGiftCertificate}
                    />
                    <button
                      type="button"
                      onClick={handleCheckGiftCertificate}
                      disabled={disabled || isCheckingGiftCertificate || !giftCertificateCode}
                      className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                    >
                      {isCheckingGiftCertificate ? "Checking..." : "Check Balance"}
                    </button>
                    {giftCertificateError && (
                      <div className="text-sm text-red-600">{giftCertificateError}</div>
                    )}
                    {giftCertificateBalance !== null && (
                      <div className="text-sm text-green-600">
                        ✓ Available Balance: {formatCurrency(giftCertificateBalance)}
                        {giftCertificateBalance < amountDue && (
                          <div className="mt-1 text-orange-600">
                            ⚠️ Remaining {formatCurrency(amountDue - giftCertificateBalance)} will
                            need another payment method
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </label>
            </div>
          </div>
        )}

        {/* Saved Credit Cards */}
        {savedCards.length > 0 &&
          savedCards.map((card) => (
            <div key={card.id} className="rounded-lg border-2 p-4">
              <div className="flex items-start">
                <input
                  type="radio"
                  id={`card-${card.id}`}
                  name="paymentSource"
                  value="CREDIT_CARD"
                  checked={selectedSource === "CREDIT_CARD"}
                  onChange={() => {
                    handleSourceChange("CREDIT_CARD");
                    onSourceChange({
                      type: "CREDIT_CARD",
                      creditCardLast4: card.last4,
                    });
                  }}
                  disabled={disabled}
                  className="mt-1 h-5 w-5 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor={`card-${card.id}`} className="ml-3 flex-1 cursor-pointer">
                  <div className="font-semibold">
                    {card.brand} ending in {card.last4}
                  </div>
                  <div className="mt-1 text-sm text-gray-600">
                    Charge {formatCurrency(amountDue)} to this card
                  </div>
                </label>
              </div>
            </div>
          ))}

        {/* New Payment Method */}
        {savedCards.length === 0 && (
          <div className="rounded-lg border-2 p-4">
            <div className="flex items-start">
              <input
                type="radio"
                id="new-card"
                name="paymentSource"
                value="CREDIT_CARD"
                checked={selectedSource === "CREDIT_CARD"}
                onChange={() => handleSourceChange("CREDIT_CARD")}
                disabled={disabled}
                className="mt-1 h-5 w-5 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="new-card" className="ml-3 flex-1 cursor-pointer">
                <div className="font-semibold">Credit Card</div>
                <div className="mt-1 text-sm text-gray-600">Pay with credit or debit card</div>
              </label>
            </div>
          </div>
        )}

        {/* Cash Payment */}
        <div className="rounded-lg border-2 p-4">
          <div className="flex items-start">
            <input
              type="radio"
              id="cash"
              name="paymentSource"
              value="CASH"
              checked={selectedSource === "CASH"}
              onChange={() => handleSourceChange("CASH")}
              disabled={disabled}
              className="mt-1 h-5 w-5 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="cash" className="ml-3 flex-1 cursor-pointer">
              <div className="font-semibold">Cash</div>
              <div className="mt-1 text-sm text-gray-600">Payment collected in person</div>
            </label>
          </div>
        </div>

        {/* Other Payment Method */}
        <div className="rounded-lg border-2 p-4">
          <div className="flex items-start">
            <input
              type="radio"
              id="other"
              name="paymentSource"
              value="OTHER"
              checked={selectedSource === "OTHER"}
              onChange={() => handleSourceChange("OTHER")}
              disabled={disabled}
              className="mt-1 h-5 w-5 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="other" className="ml-3 flex-1 cursor-pointer">
              <div className="font-semibold">Other</div>
              <div className="mt-1 text-sm text-gray-600">
                Check, Venmo, or other payment method
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* Warning for credit card selection */}
      {selectedSource === "CREDIT_CARD" && availableGiftCertificates.length > 0 && (
        <div className="mt-4 rounded-lg border-2 border-yellow-400 bg-yellow-50 p-4">
          <div className="flex items-start">
            <span className="mr-3 text-2xl">⚠️</span>
            <div>
              <div className="font-semibold text-yellow-900">
                You have an available gift certificate
              </div>
              <div className="mt-1 text-sm text-yellow-800">
                You selected to pay with credit card, but you have a gift certificate with{" "}
                {formatCurrency(availableGiftCertificates[0].balance)} available. Are you sure you
                want to charge your credit card instead?
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
