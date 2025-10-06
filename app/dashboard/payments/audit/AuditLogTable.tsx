"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type AuditLog = {
  id: string;
  paymentId: string;
  action: string;
  details: any;
  createdAt: string;
  payment: {
    id: string;
    amount: string;
    method: string;
    status: string;
    appointment: {
      client: {
        name: string;
        email: string | null;
      };
      service: {
        name: string;
      };
      staff: {
        name: string;
      };
      datetime: string;
    };
  };
};

type Payment = {
  id: string;
  amount: string;
  method: string;
  status: string;
  createdAt: string;
  appointment: {
    client: {
      name: string;
    };
    service: {
      name: string;
    };
    datetime: string;
  };
};

export default function AuditLogTable({
  auditLogs,
  payments,
  currentPaymentId,
}: {
  auditLogs: AuditLog[];
  payments: Payment[];
  currentPaymentId?: string;
}) {
  const router = useRouter();
  const [selectedPaymentId, setSelectedPaymentId] = useState(currentPaymentId || "all");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const handlePaymentFilter = (paymentId: string) => {
    setSelectedPaymentId(paymentId);
    if (paymentId === "all") {
      router.push("/dashboard/payments/audit");
    } else {
      router.push(`/dashboard/payments/audit?paymentId=${paymentId}`);
    }
  };

  const toggleRowExpansion = (logId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(logId)) {
      newExpanded.delete(logId);
    } else {
      newExpanded.add(logId);
    }
    setExpandedRows(newExpanded);
  };

  const getActionBadgeColor = (action: string) => {
    if (action.includes("succeeded") || action.includes("completed")) {
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    }
    if (action.includes("failed") || action.includes("rolled_back")) {
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
    }
    if (action.includes("initiated") || action.includes("attempt")) {
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
    }
    return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
  };

  const formatActionName = (action: string) => {
    return action
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="flex items-center gap-4">
        <label htmlFor="payment-filter" className="text-sm font-medium">
          Filter by Payment:
        </label>
        <select
          id="payment-filter"
          value={selectedPaymentId}
          onChange={(e) => handlePaymentFilter(e.target.value)}
          className="border-input bg-background ring-offset-background focus-visible:ring-ring rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none"
        >
          <option value="all">All Payments</option>
          {payments.map((payment) => (
            <option key={payment.id} value={payment.id}>
              {new Date(payment.appointment.datetime).toLocaleDateString()} -{" "}
              {payment.appointment.client.name} -{payment.appointment.service.name} - $
              {payment.amount}
            </option>
          ))}
        </select>
      </div>

      {/* Audit Log Table */}
      <div className="rounded-md border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium">Timestamp</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Action</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Client</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Amount</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Method</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {auditLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-muted-foreground px-4 py-8 text-center text-sm">
                    No audit logs found
                  </td>
                </tr>
              ) : (
                auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-muted/50">
                    <td className="px-4 py-3 text-sm">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getActionBadgeColor(
                          log.action
                        )}`}
                      >
                        {formatActionName(log.action)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="font-medium">{log.payment.appointment.client.name}</div>
                      {log.payment.appointment.client.email && (
                        <div className="text-muted-foreground text-xs">
                          {log.payment.appointment.client.email}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium">${log.payment.amount}</td>
                    <td className="px-4 py-3 text-sm">{log.payment.method.replace("_", " ")}</td>
                    <td className="px-4 py-3 text-sm">
                      <button
                        onClick={() => toggleRowExpansion(log.id)}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        {expandedRows.has(log.id) ? "Hide" : "Show"}
                      </button>
                      {expandedRows.has(log.id) && (
                        <div className="bg-muted mt-2 rounded-md p-3 font-mono text-xs">
                          <pre className="whitespace-pre-wrap">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Stats */}
      {auditLogs.length > 0 && (
        <div className="bg-muted/50 rounded-md border p-4">
          <h3 className="mb-2 font-medium">Summary</h3>
          <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
            <div>
              <div className="text-muted-foreground">Total Events</div>
              <div className="text-2xl font-bold">{auditLogs.length}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Successful</div>
              <div className="text-2xl font-bold text-green-600">
                {auditLogs.filter((log) => log.action.includes("succeeded")).length}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Failed</div>
              <div className="text-2xl font-bold text-red-600">
                {auditLogs.filter((log) => log.action.includes("failed")).length}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Unique Payments</div>
              <div className="text-2xl font-bold">
                {new Set(auditLogs.map((log) => log.paymentId)).size}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
