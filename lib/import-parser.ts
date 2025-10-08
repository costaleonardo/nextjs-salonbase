import Papa from "papaparse"
import * as XLSX from "xlsx"

export type ImportDataRow = {
  firstName: string
  lastName: string
  name: string // Combined full name
  email: string
  phone: string
  notes?: string
  // For validation tracking
  rowNumber: number
  errors: string[]
}

export type ParsedImportData = {
  data: ImportDataRow[]
  totalRows: number
  validRows: number
  invalidRows: number
  errors: Array<{ row: number; errors: string[] }>
}

/**
 * Parse CSV or Excel file and return structured data
 */
export async function parseImportFile(
  file: File
): Promise<ParsedImportData> {
  const fileExtension = file.name.split(".").pop()?.toLowerCase()

  if (fileExtension === "csv") {
    return parseCSV(file)
  } else if (fileExtension === "xlsx" || fileExtension === "xls") {
    return parseExcel(file)
  } else {
    throw new Error(
      "Unsupported file format. Please upload a CSV or Excel file."
    )
  }
}

/**
 * Parse CSV file using PapaParse
 */
async function parseCSV(file: File): Promise<ParsedImportData> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const parsedData = processRawData(results.data as any[])
          resolve(parsedData)
        } catch (error) {
          reject(error)
        }
      },
      error: (error) => {
        reject(new Error(`CSV parsing error: ${error.message}`))
      },
    })
  })
}

/**
 * Parse Excel file using xlsx
 */
async function parseExcel(file: File): Promise<ParsedImportData> {
  const arrayBuffer = await file.arrayBuffer()
  const workbook = XLSX.read(arrayBuffer, { type: "array" })

  // Get the first sheet
  const firstSheetName = workbook.SheetNames[0]
  if (!firstSheetName) {
    throw new Error("Excel file has no sheets")
  }

  const worksheet = workbook.Sheets[firstSheetName]
  const rawData = XLSX.utils.sheet_to_json(worksheet, { defval: "" })

  return processRawData(rawData as any[])
}

/**
 * Process raw data from CSV or Excel and validate
 */
function processRawData(rawData: any[]): ParsedImportData {
  const data: ImportDataRow[] = []
  const errors: Array<{ row: number; errors: string[] }> = []

  rawData.forEach((row, index) => {
    const rowNumber = index + 2 // +2 because index is 0-based and we skip header
    const rowErrors: string[] = []

    // Normalize field names (case-insensitive, handle variations)
    const normalizedRow = normalizeRowFields(row)

    // Extract and validate fields
    const firstName = normalizedRow.firstName?.trim() || ""
    const lastName = normalizedRow.lastName?.trim() || ""
    const email = normalizedRow.email?.trim() || ""
    const phone = normalizedRow.phone?.trim() || ""
    const notes = normalizedRow.notes?.trim() || ""

    // Validate required fields
    if (!firstName) {
      rowErrors.push("First name is required")
    }
    if (!lastName) {
      rowErrors.push("Last name is required")
    }
    if (!email && !phone) {
      rowErrors.push("Either email or phone is required")
    }

    // Validate email format
    if (email && !isValidEmail(email)) {
      rowErrors.push(`Invalid email format: ${email}`)
    }

    // Validate phone format
    if (phone && !isValidPhone(phone)) {
      rowErrors.push(`Invalid phone format: ${phone}`)
    }

    const importRow: ImportDataRow = {
      firstName,
      lastName,
      name: `${firstName} ${lastName}`.trim(), // Combine into full name
      email,
      phone,
      notes,
      rowNumber,
      errors: rowErrors,
    }

    data.push(importRow)

    if (rowErrors.length > 0) {
      errors.push({ row: rowNumber, errors: rowErrors })
    }
  })

  return {
    data,
    totalRows: data.length,
    validRows: data.filter((row) => row.errors.length === 0).length,
    invalidRows: data.filter((row) => row.errors.length > 0).length,
    errors,
  }
}

/**
 * Normalize field names to handle case variations and common naming patterns
 */
function normalizeRowFields(row: any): any {
  const normalized: any = {}

  // Create a lowercase key map
  const keyMap: Record<string, string> = {}
  Object.keys(row).forEach((key) => {
    keyMap[key.toLowerCase().replace(/[^a-z0-9]/g, "")] = key
  })

  // Map common field name variations
  const fieldMappings = {
    firstName: ["firstname", "first", "fname", "givenname"],
    lastName: ["lastname", "last", "lname", "surname", "familyname"],
    email: ["email", "emailaddress", "mail"],
    phone: ["phone", "phonenumber", "mobile", "cell", "telephone", "tel"],
    notes: ["notes", "note", "comments", "comment", "memo"],
  }

  Object.entries(fieldMappings).forEach(([normalizedKey, variations]) => {
    for (const variation of variations) {
      const originalKey = keyMap[variation]
      if (originalKey && row[originalKey]) {
        normalized[normalizedKey] = row[originalKey]
        break
      }
    }
  })

  return normalized
}

/**
 * Validate email format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validate phone format (supports various formats)
 */
function isValidPhone(phone: string): boolean {
  // Remove all non-digit characters for validation
  const digitsOnly = phone.replace(/\D/g, "")

  // Accept phone numbers with 10-15 digits
  // This handles US (10), international with country code (11-15)
  return digitsOnly.length >= 10 && digitsOnly.length <= 15
}

/**
 * Format phone number to consistent format (for storage)
 */
export function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters
  const digitsOnly = phone.replace(/\D/g, "")

  // If US number (10 digits), format as (XXX) XXX-XXXX
  if (digitsOnly.length === 10) {
    return `(${digitsOnly.slice(0, 3)}) ${digitsOnly.slice(3, 6)}-${digitsOnly.slice(6)}`
  }

  // Otherwise, return with minimal formatting
  return digitsOnly.length > 10
    ? `+${digitsOnly}`
    : digitsOnly
}
