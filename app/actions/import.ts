"use server"

import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { formatPhoneNumber } from "@/lib/import-parser"

export type DeduplicationMatch = {
  existingClientId: string
  matchedBy: "email" | "phone" | "both"
  existingClient: {
    id: string
    name: string
    email: string | null
    phone: string | null
  }
}

export type ImportClientRow = {
  firstName: string
  lastName: string
  name: string // Combined full name
  email: string
  phone: string
  notes?: string
  rowNumber: number
  deduplicationMatch?: DeduplicationMatch
}

export type ImportResult = {
  success: boolean
  importedCount: number
  updatedCount: number
  skippedCount: number
  errors: Array<{ row: number; message: string }>
  importId?: string
}

/**
 * Check for duplicate clients by email or phone
 */
export async function checkForDuplicates(
  clients: Omit<ImportClientRow, "deduplicationMatch">[]
): Promise<ImportClientRow[]> {
  const session = await auth()
  if (!session?.user?.id || !session.user.salonId) {
    throw new Error("Unauthorized")
  }

  const salonId = session.user.salonId

  // Get all existing clients for this salon
  const existingClients = await db.client.findMany({
    where: {
      salonId,
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
    },
  })

  // Check each import row for duplicates
  const clientsWithMatches: ImportClientRow[] = clients.map((client) => {
    // Try to find a match
    const match = existingClients.find((existing) => {
      const emailMatch =
        client.email &&
        existing.email &&
        client.email.toLowerCase() === existing.email.toLowerCase()
      const phoneMatch =
        client.phone &&
        existing.phone &&
        client.phone.replace(/\D/g, "") === existing.phone.replace(/\D/g, "")

      return emailMatch || phoneMatch
    })

    if (match) {
      const emailMatch =
        client.email &&
        match.email &&
        client.email.toLowerCase() === match.email.toLowerCase()
      const phoneMatch =
        client.phone &&
        match.phone &&
        client.phone.replace(/\D/g, "") === match.phone.replace(/\D/g, "")

      const matchedBy = emailMatch && phoneMatch ? "both" : emailMatch ? "email" : "phone"

      return {
        ...client,
        deduplicationMatch: {
          existingClientId: match.id,
          matchedBy,
          existingClient: match,
        },
      }
    }

    return client
  })

  return clientsWithMatches
}

/**
 * Import clients with transaction support and rollback capability
 */
export async function importClients(
  clients: ImportClientRow[],
  options: {
    updateExisting: boolean // If true, update existing clients; if false, skip them
  }
): Promise<ImportResult> {
  const session = await auth()
  if (!session?.user?.id || !session.user.salonId) {
    throw new Error("Unauthorized")
  }

  // Only OWNER can import data
  if (session.user.role !== "OWNER") {
    throw new Error("Only salon owners can import data")
  }

  const salonId = session.user.salonId
  const errors: Array<{ row: number; message: string }> = []
  let importedCount = 0
  let updatedCount = 0
  let skippedCount = 0

  try {
    // Use a transaction to ensure atomicity
    await db.$transaction(
      async (tx) => {
        for (const client of clients) {
          try {
            // Format phone number
            const formattedPhone = client.phone
              ? formatPhoneNumber(client.phone)
              : ""

            // Check if this client has a deduplication match
            if (client.deduplicationMatch) {
              if (options.updateExisting) {
                // Update existing client
                await tx.client.update({
                  where: {
                    id: client.deduplicationMatch.existingClientId,
                  },
                  data: {
                    name: client.name,
                    email: client.email || undefined,
                    phone: formattedPhone || undefined,
                    notes: client.notes
                      ? `${client.deduplicationMatch.existingClient.name}'s notes:\n${client.notes}`
                      : undefined,
                  },
                })
                updatedCount++
              } else {
                // Skip existing client
                skippedCount++
              }
            } else {
              // Create new client
              await tx.client.create({
                data: {
                  salonId,
                  name: client.name,
                  email: client.email || "",
                  phone: formattedPhone || "",
                  notes: client.notes || "",
                },
              })
              importedCount++
            }
          } catch (error) {
            // Collect error but continue with other rows
            errors.push({
              row: client.rowNumber,
              message:
                error instanceof Error
                  ? error.message
                  : "Unknown error occurred",
            })
          }
        }

        // If there are too many errors, rollback the transaction
        if (errors.length > clients.length * 0.1) {
          // More than 10% failed
          throw new Error(
            `Import aborted: Too many errors (${errors.length} out of ${clients.length} rows failed)`
          )
        }
      },
      {
        timeout: 60000, // 60 second timeout for large imports
      }
    )

    return {
      success: true,
      importedCount,
      updatedCount,
      skippedCount,
      errors,
    }
  } catch (error) {
    // Transaction was rolled back
    return {
      success: false,
      importedCount: 0,
      updatedCount: 0,
      skippedCount: 0,
      errors: [
        {
          row: 0,
          message:
            error instanceof Error
              ? error.message
              : "Transaction failed and was rolled back",
        },
      ],
    }
  }
}

/**
 * Get import history for the salon
 */
export async function getImportHistory() {
  const session = await auth()
  if (!session?.user?.id || !session.user.salonId) {
    throw new Error("Unauthorized")
  }

  // Note: We don't have an ImportHistory model yet, but this is a placeholder
  // for future implementation if needed
  return []
}

/**
 * Download a sample CSV template
 */
export async function getSampleCSVTemplate(): Promise<string> {
  return `firstName,lastName,email,phone,notes
John,Doe,john.doe@example.com,(555) 123-4567,Regular customer
Jane,Smith,jane.smith@example.com,5559876543,Prefers morning appointments
Bob,Johnson,,555-111-2222,No email provided
Alice,Williams,alice@example.com,,"No phone provided, prefers email"`
}
