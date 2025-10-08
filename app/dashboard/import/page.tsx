"use client"

import { useState } from "react"
import { parseImportFile, type ImportDataRow } from "@/lib/import-parser"
import {
  checkForDuplicates,
  importClients,
  getSampleCSVTemplate,
  type ImportClientRow,
  type ImportResult,
} from "@/app/actions/import"

type ImportStep = "upload" | "preview" | "confirm" | "result"

export default function ImportPage() {
  const [step, setStep] = useState<ImportStep>("upload")
  const [parsedData, setParsedData] = useState<ImportDataRow[]>([])
  const [clientsWithMatches, setClientsWithMatches] = useState<
    ImportClientRow[]
  >([])
  const [updateExisting, setUpdateExisting] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Step 1: File upload
  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const selectedFile = event.target.files?.[0]
    if (!selectedFile) return

    setError(null)
    setIsLoading(true)

    try {
      const parsed = await parseImportFile(selectedFile)

      if (parsed.invalidRows > 0) {
        setError(
          `Found ${parsed.invalidRows} invalid rows. Please fix errors before importing.`
        )
        setParsedData(parsed.data)
        setStep("preview")
      } else {
        setParsedData(parsed.data)
        setStep("preview")
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to parse file"
      )
    } finally {
      setIsLoading(false)
    }
  }

  // Step 2: Check for duplicates and show preview
  const handlePreviewNext = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Filter out invalid rows
      const validRows = parsedData.filter((row) => row.errors.length === 0)

      // Check for duplicates
      const clientsWithDupes = await checkForDuplicates(validRows)
      setClientsWithMatches(clientsWithDupes)
      setStep("confirm")
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to check for duplicates"
      )
    } finally {
      setIsLoading(false)
    }
  }

  // Step 3: Import with confirmation
  const handleImport = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await importClients(clientsWithMatches, {
        updateExisting,
      })

      setImportResult(result)
      setStep("result")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed")
    } finally {
      setIsLoading(false)
    }
  }

  // Download sample CSV
  const handleDownloadSample = async () => {
    const csvContent = await getSampleCSVTemplate()
    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "sample-import-template.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  // Reset and start over
  const handleReset = () => {
    setStep("upload")
    setParsedData([])
    setClientsWithMatches([])
    setUpdateExisting(false)
    setImportResult(null)
    setError(null)
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Import Clients</h1>
        <p className="text-gray-600">
          Upload a CSV or Excel file to import clients into your salon
        </p>
      </div>

      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <StepIndicator
            number={1}
            label="Upload"
            active={step === "upload"}
            completed={["preview", "confirm", "result"].includes(step)}
          />
          <div className="flex-1 h-1 bg-gray-200 mx-2">
            <div
              className={`h-full bg-blue-600 transition-all ${
                ["preview", "confirm", "result"].includes(step)
                  ? "w-full"
                  : "w-0"
              }`}
            />
          </div>
          <StepIndicator
            number={2}
            label="Preview"
            active={step === "preview"}
            completed={["confirm", "result"].includes(step)}
          />
          <div className="flex-1 h-1 bg-gray-200 mx-2">
            <div
              className={`h-full bg-blue-600 transition-all ${
                ["confirm", "result"].includes(step) ? "w-full" : "w-0"
              }`}
            />
          </div>
          <StepIndicator
            number={3}
            label="Confirm"
            active={step === "confirm"}
            completed={step === "result"}
          />
          <div className="flex-1 h-1 bg-gray-200 mx-2">
            <div
              className={`h-full bg-blue-600 transition-all ${
                step === "result" ? "w-full" : "w-0"
              }`}
            />
          </div>
          <StepIndicator number={4} label="Complete" active={step === "result"} />
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 font-medium">Error</p>
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Step 1: Upload */}
      {step === "upload" && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Upload File</h2>

          <div className="mb-6">
            <button
              onClick={handleDownloadSample}
              className="text-blue-600 hover:text-blue-800 underline text-sm"
            >
              Download sample CSV template
            </button>
          </div>

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload"
              disabled={isLoading}
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer flex flex-col items-center"
            >
              <svg
                className="w-12 h-12 text-gray-400 mb-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <p className="text-lg font-medium text-gray-700 mb-1">
                {isLoading ? "Processing..." : "Click to upload file"}
              </p>
              <p className="text-sm text-gray-500">
                CSV or Excel (.csv, .xlsx, .xls)
              </p>
            </label>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">
              Required Fields:
            </h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• First Name</li>
              <li>• Last Name</li>
              <li>• Email OR Phone (at least one required)</li>
            </ul>
            <h3 className="font-medium text-blue-900 mt-4 mb-2">
              Optional Fields:
            </h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Notes</li>
            </ul>
          </div>
        </div>
      )}

      {/* Step 2: Preview */}
      {step === "preview" && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Preview Data</h2>

          <div className="mb-4">
            <p className="text-gray-700">
              Total rows: <span className="font-semibold">{parsedData.length}</span>
            </p>
            <p className="text-green-700">
              Valid rows:{" "}
              <span className="font-semibold">
                {parsedData.filter((row) => row.errors.length === 0).length}
              </span>
            </p>
            <p className="text-red-700">
              Invalid rows:{" "}
              <span className="font-semibold">
                {parsedData.filter((row) => row.errors.length > 0).length}
              </span>
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Row
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    First Name
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Last Name
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Email
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Phone
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {parsedData.slice(0, 50).map((row, index) => (
                  <tr
                    key={index}
                    className={row.errors.length > 0 ? "bg-red-50" : ""}
                  >
                    <td className="px-3 py-2 text-sm text-gray-900">
                      {row.rowNumber}
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-900">
                      {row.firstName}
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-900">
                      {row.lastName}
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-900">
                      {row.email}
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-900">
                      {row.phone}
                    </td>
                    <td className="px-3 py-2 text-sm">
                      {row.errors.length > 0 ? (
                        <div className="text-red-600">
                          <p className="font-medium">Invalid</p>
                          {row.errors.map((err, i) => (
                            <p key={i} className="text-xs">
                              {err}
                            </p>
                          ))}
                        </div>
                      ) : (
                        <span className="text-green-600 font-medium">Valid</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {parsedData.length > 50 && (
              <p className="text-sm text-gray-500 mt-2">
                Showing first 50 rows of {parsedData.length}
              </p>
            )}
          </div>

          <div className="mt-6 flex justify-between">
            <button
              onClick={handleReset}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              onClick={handlePreviewNext}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
              disabled={
                isLoading ||
                parsedData.filter((row) => row.errors.length === 0).length === 0
              }
            >
              {isLoading ? "Processing..." : "Continue"}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Confirm */}
      {step === "confirm" && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Confirm Import</h2>

          <div className="mb-6 space-y-2">
            <p className="text-gray-700">
              New clients to import:{" "}
              <span className="font-semibold">
                {
                  clientsWithMatches.filter(
                    (c) => !c.deduplicationMatch
                  ).length
                }
              </span>
            </p>
            <p className="text-orange-700">
              Duplicate clients found:{" "}
              <span className="font-semibold">
                {
                  clientsWithMatches.filter((c) => c.deduplicationMatch)
                    .length
                }
              </span>
            </p>
          </div>

          {/* Deduplication Options */}
          {clientsWithMatches.filter((c) => c.deduplicationMatch).length >
            0 && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h3 className="font-medium text-yellow-900 mb-3">
                Duplicate Handling
              </h3>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    checked={!updateExisting}
                    onChange={() => setUpdateExisting(false)}
                    className="mr-2"
                  />
                  <span className="text-sm text-yellow-800">
                    Skip duplicates (only import new clients)
                  </span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    checked={updateExisting}
                    onChange={() => setUpdateExisting(true)}
                    className="mr-2"
                  />
                  <span className="text-sm text-yellow-800">
                    Update existing clients with new data
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* Show duplicates */}
          {clientsWithMatches.filter((c) => c.deduplicationMatch).length >
            0 && (
            <div className="mb-6">
              <h3 className="font-medium mb-2">Duplicate Clients:</h3>
              <div className="overflow-x-auto max-h-96">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Import Data
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Matched By
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Existing Client
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {clientsWithMatches
                      .filter((c) => c.deduplicationMatch)
                      .map((client, index) => (
                        <tr key={index} className="bg-yellow-50">
                          <td className="px-3 py-2">
                            <div>
                              <p className="font-medium">
                                {client.name}
                              </p>
                              <p className="text-gray-600">{client.email}</p>
                              <p className="text-gray-600">{client.phone}</p>
                            </div>
                          </td>
                          <td className="px-3 py-2">
                            <span className="px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded">
                              {client.deduplicationMatch?.matchedBy}
                            </span>
                          </td>
                          <td className="px-3 py-2">
                            <div>
                              <p className="font-medium">
                                {client.deduplicationMatch?.existingClient.name}
                              </p>
                              <p className="text-gray-600">
                                {client.deduplicationMatch?.existingClient.email}
                              </p>
                              <p className="text-gray-600">
                                {client.deduplicationMatch?.existingClient.phone}
                              </p>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="mt-6 flex justify-between">
            <button
              onClick={() => setStep("preview")}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              disabled={isLoading}
            >
              Back
            </button>
            <button
              onClick={handleImport}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
              disabled={isLoading}
            >
              {isLoading ? "Importing..." : "Import Clients"}
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Result */}
      {step === "result" && importResult && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">
            {importResult.success ? "Import Complete!" : "Import Failed"}
          </h2>

          {importResult.success ? (
            <div className="space-y-3 mb-6">
              <div className="flex items-center text-green-700">
                <svg
                  className="w-6 h-6 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="text-lg font-medium">
                  {importResult.importedCount} new clients imported
                </span>
              </div>
              {importResult.updatedCount > 0 && (
                <p className="text-blue-700">
                  {importResult.updatedCount} existing clients updated
                </p>
              )}
              {importResult.skippedCount > 0 && (
                <p className="text-gray-600">
                  {importResult.skippedCount} duplicate clients skipped
                </p>
              )}
            </div>
          ) : (
            <div className="mb-6">
              <div className="flex items-center text-red-700 mb-3">
                <svg
                  className="w-6 h-6 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                <span className="text-lg font-medium">Import failed</span>
              </div>
              <p className="text-gray-600">
                The transaction was rolled back. No changes were made to your
                database.
              </p>
            </div>
          )}

          {/* Error Report */}
          {importResult.errors.length > 0 && (
            <div className="mb-6">
              <h3 className="font-medium text-red-700 mb-2">
                Errors ({importResult.errors.length}):
              </h3>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-h-64 overflow-y-auto">
                {importResult.errors.map((error, index) => (
                  <div key={index} className="text-sm text-red-800 mb-1">
                    {error.row > 0 && (
                      <span className="font-medium">Row {error.row}: </span>
                    )}
                    {error.message}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-between">
            <button
              onClick={handleReset}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Import Another File
            </button>
            <a
              href="/dashboard/clients"
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              View Clients
            </a>
          </div>
        </div>
      )}
    </div>
  )
}

// Step indicator component
function StepIndicator({
  number,
  label,
  active,
  completed,
}: {
  number: number
  label: string
  active?: boolean
  completed?: boolean
}) {
  return (
    <div className="flex flex-col items-center">
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
          completed
            ? "bg-blue-600 text-white"
            : active
              ? "bg-blue-100 text-blue-600 border-2 border-blue-600"
              : "bg-gray-200 text-gray-500"
        }`}
      >
        {completed ? "✓" : number}
      </div>
      <span
        className={`text-sm mt-1 ${
          active ? "text-blue-600 font-medium" : "text-gray-500"
        }`}
      >
        {label}
      </span>
    </div>
  )
}
