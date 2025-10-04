import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { Role } from '@prisma/client'

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role === Role.CLIENT) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (!session.user.salonId) {
      return NextResponse.json({ error: 'No salon associated' }, { status: 400 })
    }

    const staff = await db.user.findMany({
      where: {
        salonId: session.user.salonId,
        role: {
          in: [Role.OWNER, Role.STAFF],
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
      orderBy: {
        name: 'asc',
      },
    })

    return NextResponse.json(staff)
  } catch (error) {
    console.error('Error fetching staff:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
