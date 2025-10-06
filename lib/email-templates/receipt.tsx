import * as React from "react";

export interface ReceiptEmailData {
  salonName: string;
  salonEmail?: string;
  salonPhone?: string;
  salonAddress?: string;
  clientName: string;
  clientEmail?: string;
  appointmentDate: string;
  appointmentTime: string;
  serviceName: string;
  staffName: string;
  amount: number;
  paymentMethod: string;
  paymentDate: string;
  receiptNumber: string;
  transactionId?: string;
  giftCertificateApplied?: number;
}

export const ReceiptEmail = ({
  salonName,
  salonEmail,
  salonPhone,
  salonAddress,
  clientName,
  clientEmail,
  appointmentDate,
  appointmentTime,
  serviceName,
  staffName,
  amount,
  paymentMethod,
  paymentDate,
  receiptNumber,
  transactionId,
  giftCertificateApplied,
}: ReceiptEmailData) => {
  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body
        style={{
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          backgroundColor: "#f6f6f6",
          margin: 0,
          padding: 0,
        }}
      >
        <table
          width="100%"
          cellPadding="0"
          cellSpacing="0"
          style={{ backgroundColor: "#f6f6f6", padding: "20px 0" }}
        >
          <tr>
            <td align="center">
              <table
                width="600"
                cellPadding="0"
                cellSpacing="0"
                style={{
                  backgroundColor: "#ffffff",
                  borderRadius: "8px",
                  overflow: "hidden",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                }}
              >
                {/* Header */}
                <tr>
                  <td
                    style={{
                      backgroundColor: "#1a1a1a",
                      padding: "32px 40px",
                      textAlign: "center",
                    }}
                  >
                    <h1
                      style={{
                        margin: 0,
                        color: "#ffffff",
                        fontSize: "28px",
                        fontWeight: "600",
                      }}
                    >
                      Payment Receipt
                    </h1>
                    <p
                      style={{
                        margin: "8px 0 0 0",
                        color: "#a0a0a0",
                        fontSize: "14px",
                      }}
                    >
                      Receipt #{receiptNumber}
                    </p>
                  </td>
                </tr>

                {/* Content */}
                <tr>
                  <td style={{ padding: "40px" }}>
                    {/* Salon Info */}
                    <div style={{ marginBottom: "32px" }}>
                      <h2
                        style={{
                          margin: "0 0 8px 0",
                          fontSize: "20px",
                          fontWeight: "600",
                          color: "#1a1a1a",
                        }}
                      >
                        {salonName}
                      </h2>
                      {salonAddress && (
                        <p
                          style={{
                            margin: "4px 0",
                            fontSize: "14px",
                            color: "#666666",
                          }}
                        >
                          {salonAddress}
                        </p>
                      )}
                      {salonPhone && (
                        <p
                          style={{
                            margin: "4px 0",
                            fontSize: "14px",
                            color: "#666666",
                          }}
                        >
                          {salonPhone}
                        </p>
                      )}
                      {salonEmail && (
                        <p
                          style={{
                            margin: "4px 0",
                            fontSize: "14px",
                            color: "#666666",
                          }}
                        >
                          {salonEmail}
                        </p>
                      )}
                    </div>

                    <hr
                      style={{
                        border: "none",
                        borderTop: "1px solid #e5e5e5",
                        margin: "32px 0",
                      }}
                    />

                    {/* Client Info */}
                    <div style={{ marginBottom: "32px" }}>
                      <h3
                        style={{
                          margin: "0 0 12px 0",
                          fontSize: "14px",
                          fontWeight: "600",
                          color: "#666666",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                        }}
                      >
                        Billed To
                      </h3>
                      <p
                        style={{
                          margin: "4px 0",
                          fontSize: "16px",
                          color: "#1a1a1a",
                        }}
                      >
                        {clientName}
                      </p>
                      {clientEmail && (
                        <p
                          style={{
                            margin: "4px 0",
                            fontSize: "14px",
                            color: "#666666",
                          }}
                        >
                          {clientEmail}
                        </p>
                      )}
                    </div>

                    {/* Appointment Details */}
                    <div style={{ marginBottom: "32px" }}>
                      <h3
                        style={{
                          margin: "0 0 12px 0",
                          fontSize: "14px",
                          fontWeight: "600",
                          color: "#666666",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                        }}
                      >
                        Appointment Details
                      </h3>
                      <table width="100%" cellPadding="0" cellSpacing="0">
                        <tr>
                          <td
                            style={{
                              padding: "8px 0",
                              fontSize: "14px",
                              color: "#666666",
                            }}
                          >
                            Service
                          </td>
                          <td
                            style={{
                              padding: "8px 0",
                              fontSize: "14px",
                              color: "#1a1a1a",
                              textAlign: "right",
                            }}
                          >
                            {serviceName}
                          </td>
                        </tr>
                        <tr>
                          <td
                            style={{
                              padding: "8px 0",
                              fontSize: "14px",
                              color: "#666666",
                            }}
                          >
                            Provider
                          </td>
                          <td
                            style={{
                              padding: "8px 0",
                              fontSize: "14px",
                              color: "#1a1a1a",
                              textAlign: "right",
                            }}
                          >
                            {staffName}
                          </td>
                        </tr>
                        <tr>
                          <td
                            style={{
                              padding: "8px 0",
                              fontSize: "14px",
                              color: "#666666",
                            }}
                          >
                            Date
                          </td>
                          <td
                            style={{
                              padding: "8px 0",
                              fontSize: "14px",
                              color: "#1a1a1a",
                              textAlign: "right",
                            }}
                          >
                            {appointmentDate}
                          </td>
                        </tr>
                        <tr>
                          <td
                            style={{
                              padding: "8px 0",
                              fontSize: "14px",
                              color: "#666666",
                            }}
                          >
                            Time
                          </td>
                          <td
                            style={{
                              padding: "8px 0",
                              fontSize: "14px",
                              color: "#1a1a1a",
                              textAlign: "right",
                            }}
                          >
                            {appointmentTime}
                          </td>
                        </tr>
                      </table>
                    </div>

                    <hr
                      style={{
                        border: "none",
                        borderTop: "1px solid #e5e5e5",
                        margin: "32px 0",
                      }}
                    />

                    {/* Payment Summary */}
                    <div style={{ marginBottom: "32px" }}>
                      <h3
                        style={{
                          margin: "0 0 12px 0",
                          fontSize: "14px",
                          fontWeight: "600",
                          color: "#666666",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                        }}
                      >
                        Payment Summary
                      </h3>
                      <table width="100%" cellPadding="0" cellSpacing="0">
                        {giftCertificateApplied && giftCertificateApplied > 0 && (
                          <tr>
                            <td
                              style={{
                                padding: "8px 0",
                                fontSize: "14px",
                                color: "#666666",
                              }}
                            >
                              Gift Certificate Applied
                            </td>
                            <td
                              style={{
                                padding: "8px 0",
                                fontSize: "14px",
                                color: "#16a34a",
                                textAlign: "right",
                              }}
                            >
                              -${giftCertificateApplied.toFixed(2)}
                            </td>
                          </tr>
                        )}
                        <tr>
                          <td
                            style={{
                              padding: "8px 0",
                              fontSize: "16px",
                              fontWeight: "600",
                              color: "#1a1a1a",
                            }}
                          >
                            Total Paid
                          </td>
                          <td
                            style={{
                              padding: "8px 0",
                              fontSize: "20px",
                              fontWeight: "600",
                              color: "#1a1a1a",
                              textAlign: "right",
                            }}
                          >
                            ${amount.toFixed(2)}
                          </td>
                        </tr>
                        <tr>
                          <td
                            style={{
                              padding: "8px 0",
                              fontSize: "14px",
                              color: "#666666",
                            }}
                          >
                            Payment Method
                          </td>
                          <td
                            style={{
                              padding: "8px 0",
                              fontSize: "14px",
                              color: "#1a1a1a",
                              textAlign: "right",
                            }}
                          >
                            {paymentMethod}
                          </td>
                        </tr>
                        <tr>
                          <td
                            style={{
                              padding: "8px 0",
                              fontSize: "14px",
                              color: "#666666",
                            }}
                          >
                            Payment Date
                          </td>
                          <td
                            style={{
                              padding: "8px 0",
                              fontSize: "14px",
                              color: "#1a1a1a",
                              textAlign: "right",
                            }}
                          >
                            {paymentDate}
                          </td>
                        </tr>
                        {transactionId && (
                          <tr>
                            <td
                              style={{
                                padding: "8px 0",
                                fontSize: "14px",
                                color: "#666666",
                              }}
                            >
                              Transaction ID
                            </td>
                            <td
                              style={{
                                padding: "8px 0",
                                fontSize: "12px",
                                color: "#999999",
                                textAlign: "right",
                                fontFamily: "monospace",
                              }}
                            >
                              {transactionId}
                            </td>
                          </tr>
                        )}
                      </table>
                    </div>

                    {/* Thank You Message */}
                    <div
                      style={{
                        backgroundColor: "#f9f9f9",
                        padding: "24px",
                        borderRadius: "8px",
                        textAlign: "center",
                        marginTop: "32px",
                      }}
                    >
                      <p
                        style={{
                          margin: 0,
                          fontSize: "16px",
                          color: "#1a1a1a",
                          fontWeight: "500",
                        }}
                      >
                        Thank you for your business!
                      </p>
                      <p
                        style={{
                          margin: "8px 0 0 0",
                          fontSize: "14px",
                          color: "#666666",
                        }}
                      >
                        We look forward to seeing you again.
                      </p>
                    </div>
                  </td>
                </tr>

                {/* Footer */}
                <tr>
                  <td
                    style={{
                      backgroundColor: "#f9f9f9",
                      padding: "24px 40px",
                      textAlign: "center",
                      borderTop: "1px solid #e5e5e5",
                    }}
                  >
                    <p
                      style={{
                        margin: 0,
                        fontSize: "12px",
                        color: "#999999",
                      }}
                    >
                      This is an automated receipt. Please keep it for your records.
                    </p>
                    <p
                      style={{
                        margin: "8px 0 0 0",
                        fontSize: "12px",
                        color: "#999999",
                      }}
                    >
                      If you have any questions, please contact {salonName}
                      {salonEmail && ` at ${salonEmail}`}.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  );
};

export default ReceiptEmail;
