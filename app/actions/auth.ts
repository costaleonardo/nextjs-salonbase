"use server"

import { db } from "@/lib/db"
import bcrypt from "bcryptjs"
import { Role } from "@prisma/client"

export async function signUp(formData: {
  name: string
  email: string
  password: string
  salonName?: string
}) {
  try {
    // Validate input
    if (!formData.name || !formData.email || !formData.password) {
      return { success: false, error: "All fields are required" }
    }

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email: formData.email },
    })

    if (existingUser) {
      return { success: false, error: "Email already exists" }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(formData.password, 10)

    // Create salon if salonName is provided (for OWNER role)
    let salonId: string | null = null
    if (formData.salonName) {
      const salon = await db.salon.create({
        data: {
          name: formData.salonName,
          slug: formData.salonName.toLowerCase().replace(/\s+/g, "-"),
        },
      })
      salonId = salon.id
    }

    // Create user
    const user = await db.user.create({
      data: {
        name: formData.name,
        email: formData.email,
        password: hashedPassword,
        role: formData.salonName ? Role.OWNER : Role.CLIENT,
        salonId,
      },
    })

    return { success: true, user: { id: user.id, email: user.email } }
  } catch (error) {
    console.error("Signup error:", error)
    return { success: false, error: "An error occurred during signup" }
  }
}
