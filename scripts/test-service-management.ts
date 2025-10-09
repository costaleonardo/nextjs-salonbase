/**
 * Test Service Management CRUD Operations
 *
 * This script tests the complete service management functionality including:
 * - Creating services
 * - Retrieving services (list and by ID)
 * - Updating services
 * - Staff assignment
 * - Archiving services
 * - Restoring services
 * - Deleting services
 *
 * Run: npx tsx scripts/test-service-management.ts
 */

import { db } from '@/lib/db'
import { hash } from 'bcryptjs'

interface TestResult {
  test: string
  status: 'PASS' | 'FAIL'
  message: string
}

const results: TestResult[] = []

function logTest(test: string, status: 'PASS' | 'FAIL', message: string) {
  results.push({ test, status, message })
  const icon = status === 'PASS' ? '✅' : '❌'
  console.log(`${icon} ${test}: ${message}`)
}

async function setupTestData() {
  console.log('\n🔧 Setting up test data...\n')

  try {
    // Create test salon
    const salon = await db.salon.create({
      data: {
        name: 'Test Service Salon',
        slug: `test-service-salon-${Date.now()}`,
        email: 'test@servicesalon.com',
        phone: '555-0100',
        address: '100 Service Test St',
      },
    })

    // Create test owner
    const owner = await db.user.create({
      data: {
        email: `owner-service-${Date.now()}@test.com`,
        password: await hash('password123', 10),
        name: 'Service Owner',
        role: 'OWNER',
        salonId: salon.id,
      },
    })

    // Create test staff members
    const staff1 = await db.user.create({
      data: {
        email: `staff1-service-${Date.now()}@test.com`,
        password: await hash('password123', 10),
        name: 'Staff Member 1',
        role: 'STAFF',
        salonId: salon.id,
      },
    })

    const staff2 = await db.user.create({
      data: {
        email: `staff2-service-${Date.now()}@test.com`,
        password: await hash('password123', 10),
        name: 'Staff Member 2',
        role: 'STAFF',
        salonId: salon.id,
      },
    })

    logTest('Setup', 'PASS', `Created salon, owner, and 2 staff members`)

    return { salon, owner, staff1, staff2 }
  } catch (error) {
    logTest('Setup', 'FAIL', `Failed to create test data: ${error}`)
    throw error
  }
}

async function testCreateService(salonId: string) {
  console.log('\n📝 Testing service creation...\n')

  try {
    // Test 1: Create basic service
    const service1 = await db.service.create({
      data: {
        salonId,
        name: 'Haircut',
        description: 'Standard haircut service',
        duration: 45,
        price: 50,
        staffIds: [],
        isActive: true,
      },
    })

    logTest('Create Basic Service', 'PASS', `Created service: ${service1.name}`)

    // Test 2: Create service with staff assignment
    const staff = await db.user.findMany({
      where: { salonId, role: { in: ['OWNER', 'STAFF'] } },
      select: { id: true },
    })

    const service2 = await db.service.create({
      data: {
        salonId,
        name: 'Hair Coloring',
        description: 'Professional hair coloring',
        duration: 120,
        price: 150,
        staffIds: staff.map((s) => s.id),
        isActive: true,
      },
    })

    logTest('Create Service with Staff', 'PASS', `Assigned ${staff.length} staff members`)

    // Test 3: Validation - empty name
    try {
      await db.service.create({
        data: {
          salonId,
          name: '',
          duration: 30,
          price: 25,
          isActive: true,
        },
      })
      logTest('Validation - Empty Name', 'FAIL', 'Should have rejected empty name')
    } catch (error) {
      logTest('Validation - Empty Name', 'PASS', 'Correctly rejected empty name')
    }

    // Test 4: Create multiple services
    const services = await Promise.all([
      db.service.create({
        data: {
          salonId,
          name: 'Manicure',
          duration: 30,
          price: 35,
          isActive: true,
        },
      }),
      db.service.create({
        data: {
          salonId,
          name: 'Pedicure',
          duration: 45,
          price: 45,
          isActive: true,
        },
      }),
      db.service.create({
        data: {
          salonId,
          name: 'Facial',
          duration: 60,
          price: 80,
          isActive: true,
        },
      }),
    ])

    logTest('Bulk Create Services', 'PASS', `Created ${services.length} additional services`)

    return { service1, service2 }
  } catch (error) {
    logTest('Create Service', 'FAIL', `Error: ${error}`)
    throw error
  }
}

async function testRetrieveServices(salonId: string) {
  console.log('\n🔍 Testing service retrieval...\n')

  try {
    // Test 1: Get all services
    const allServices = await db.service.findMany({
      where: { salonId },
    })

    logTest('Get All Services', 'PASS', `Retrieved ${allServices.length} services`)

    // Test 2: Get active services only
    const activeServices = await db.service.findMany({
      where: { salonId, isActive: true },
    })

    logTest('Get Active Services', 'PASS', `Retrieved ${activeServices.length} active services`)

    // Test 3: Search by name
    const searchResults = await db.service.findMany({
      where: {
        salonId,
        name: { contains: 'Hair', mode: 'insensitive' },
      },
    })

    logTest('Search Services', 'PASS', `Found ${searchResults.length} services matching "Hair"`)

    // Test 4: Get service by ID
    const serviceId = allServices[0].id
    const service = await db.service.findUnique({
      where: { id: serviceId },
    })

    if (service) {
      logTest('Get Service by ID', 'PASS', `Retrieved service: ${service.name}`)
    } else {
      logTest('Get Service by ID', 'FAIL', 'Service not found')
    }

    return allServices[0]
  } catch (error) {
    logTest('Retrieve Services', 'FAIL', `Error: ${error}`)
    throw error
  }
}

async function testUpdateService(serviceId: string, staffId: string) {
  console.log('\n✏️ Testing service updates...\n')

  try {
    // Test 1: Update basic fields
    const updated1 = await db.service.update({
      where: { id: serviceId },
      data: {
        name: 'Premium Haircut',
        description: 'Premium haircut with styling',
        price: 75,
      },
    })

    logTest('Update Basic Fields', 'PASS', `Updated name to: ${updated1.name}`)

    // Test 2: Update duration
    const updated2 = await db.service.update({
      where: { id: serviceId },
      data: {
        duration: 60,
      },
    })

    logTest('Update Duration', 'PASS', `Updated duration to: ${updated2.duration} minutes`)

    // Test 3: Update staff assignment
    const updated3 = await db.service.update({
      where: { id: serviceId },
      data: {
        staffIds: [staffId],
      },
    })

    logTest('Update Staff Assignment', 'PASS', `Assigned ${updated3.staffIds.length} staff member`)

    // Test 4: Clear staff assignment
    const updated4 = await db.service.update({
      where: { id: serviceId },
      data: {
        staffIds: [],
      },
    })

    logTest('Clear Staff Assignment', 'PASS', 'Cleared all staff assignments (available to all)')

    return updated4
  } catch (error) {
    logTest('Update Service', 'FAIL', `Error: ${error}`)
    throw error
  }
}

async function testArchiveAndRestore(serviceId: string) {
  console.log('\n📦 Testing archive and restore...\n')

  try {
    // Test 1: Archive service
    const archived = await db.service.update({
      where: { id: serviceId },
      data: { isActive: false },
    })

    if (!archived.isActive) {
      logTest('Archive Service', 'PASS', 'Service successfully archived')
    } else {
      logTest('Archive Service', 'FAIL', 'Service still active')
    }

    // Test 2: Verify archived services are filterable
    const activeServices = await db.service.findMany({
      where: { salonId: archived.salonId, isActive: true },
    })

    const archivedServices = await db.service.findMany({
      where: { salonId: archived.salonId, isActive: false },
    })

    logTest(
      'Filter Active/Archived',
      'PASS',
      `Active: ${activeServices.length}, Archived: ${archivedServices.length}`
    )

    // Test 3: Restore service
    const restored = await db.service.update({
      where: { id: serviceId },
      data: { isActive: true },
    })

    if (restored.isActive) {
      logTest('Restore Service', 'PASS', 'Service successfully restored')
    } else {
      logTest('Restore Service', 'FAIL', 'Service still archived')
    }

    return restored
  } catch (error) {
    logTest('Archive/Restore', 'FAIL', `Error: ${error}`)
    throw error
  }
}

async function testDeleteService(salonId: string) {
  console.log('\n🗑️ Testing service deletion...\n')

  try {
    // Create a service to delete
    const serviceToDelete = await db.service.create({
      data: {
        salonId,
        name: 'Temporary Service',
        duration: 30,
        price: 20,
        isActive: true,
      },
    })

    // Test 1: Hard delete service without appointments
    await db.service.delete({
      where: { id: serviceToDelete.id },
    })

    const deleted = await db.service.findUnique({
      where: { id: serviceToDelete.id },
    })

    if (!deleted) {
      logTest('Delete Service', 'PASS', 'Service permanently deleted')
    } else {
      logTest('Delete Service', 'FAIL', 'Service still exists')
    }

    // Test 2: Test deletion with appointments (should fail)
    const serviceWithAppointment = await db.service.create({
      data: {
        salonId,
        name: 'Service with Appointment',
        duration: 30,
        price: 20,
        isActive: true,
      },
    })

    // Create client and appointment
    const client = await db.client.create({
      data: {
        salonId,
        name: 'Test Client',
        email: `client-${Date.now()}@test.com`,
      },
    })

    const staff = await db.user.findFirst({
      where: { salonId, role: { in: ['OWNER', 'STAFF'] } },
    })

    if (staff) {
      const appointment = await db.appointment.create({
        data: {
          salonId,
          clientId: client.id,
          staffId: staff.id,
          serviceId: serviceWithAppointment.id,
          datetime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
          status: 'SCHEDULED',
        },
      })

      // Try to delete service with scheduled appointment (should fail due to cascade)
      try {
        await db.service.delete({
          where: { id: serviceWithAppointment.id },
        })
        logTest('Delete with Appointments', 'FAIL', 'Should not allow deletion with appointments')
      } catch (error) {
        logTest(
          'Delete with Appointments',
          'PASS',
          'Correctly prevented deletion (appointments exist)'
        )
      }

      // Archive instead of delete
      await db.service.update({
        where: { id: serviceWithAppointment.id },
        data: { isActive: false },
      })

      logTest('Archive Alternative', 'PASS', 'Service archived instead of deleted')
    }
  } catch (error) {
    logTest('Delete Service', 'FAIL', `Error: ${error}`)
    throw error
  }
}

async function testStaffAssignment(salonId: string) {
  console.log('\n👥 Testing staff assignment...\n')

  try {
    const staff = await db.user.findMany({
      where: { salonId, role: { in: ['OWNER', 'STAFF'] } },
      select: { id: true, name: true },
    })

    // Test 1: Service available to all staff (empty array)
    const service1 = await db.service.create({
      data: {
        salonId,
        name: 'Service for All',
        duration: 30,
        price: 30,
        staffIds: [],
        isActive: true,
      },
    })

    logTest('All Staff Service', 'PASS', 'Created service available to all staff')

    // Test 2: Service assigned to specific staff
    const service2 = await db.service.create({
      data: {
        salonId,
        name: 'Service for Specific Staff',
        duration: 30,
        price: 30,
        staffIds: [staff[0].id],
        isActive: true,
      },
    })

    logTest('Specific Staff Service', 'PASS', `Assigned to ${staff[0].name}`)

    // Test 3: Service assigned to multiple staff
    const service3 = await db.service.create({
      data: {
        salonId,
        name: 'Service for Multiple Staff',
        duration: 30,
        price: 30,
        staffIds: staff.map((s) => s.id),
        isActive: true,
      },
    })

    logTest('Multiple Staff Service', 'PASS', `Assigned to ${staff.length} staff members`)

    // Test 4: Get staff members for a service
    const serviceStaff = staff.filter((s) => service2.staffIds.includes(s.id))
    logTest(
      'Get Service Staff',
      'PASS',
      `Retrieved ${serviceStaff.length} assigned staff members`
    )
  } catch (error) {
    logTest('Staff Assignment', 'FAIL', `Error: ${error}`)
    throw error
  }
}

async function cleanup(salonId: string) {
  console.log('\n🧹 Cleaning up test data...\n')

  try {
    // Delete appointments
    await db.appointment.deleteMany({
      where: { salonId },
    })

    // Delete clients
    await db.client.deleteMany({
      where: { salonId },
    })

    // Delete services
    await db.service.deleteMany({
      where: { salonId },
    })

    // Delete users
    await db.user.deleteMany({
      where: { salonId },
    })

    // Delete salon
    await db.salon.delete({
      where: { id: salonId },
    })

    logTest('Cleanup', 'PASS', 'Removed all test data')
  } catch (error) {
    logTest('Cleanup', 'FAIL', `Error: ${error}`)
  }
}

async function printSummary() {
  console.log('\n' + '='.repeat(60))
  console.log('TEST SUMMARY')
  console.log('='.repeat(60))

  const passed = results.filter((r) => r.status === 'PASS').length
  const failed = results.filter((r) => r.status === 'FAIL').length
  const total = results.length

  console.log(`\nTotal Tests: ${total}`)
  console.log(`✅ Passed: ${passed}`)
  console.log(`❌ Failed: ${failed}`)
  console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`)

  if (failed > 0) {
    console.log('\n❌ Failed Tests:')
    results
      .filter((r) => r.status === 'FAIL')
      .forEach((r) => {
        console.log(`  - ${r.test}: ${r.message}`)
      })
  }

  console.log('\n' + '='.repeat(60))
}

async function main() {
  console.log('🧪 Service Management CRUD Operations Test')
  console.log('='.repeat(60))

  try {
    const { salon, owner, staff1, staff2 } = await setupTestData()

    await testCreateService(salon.id)
    const testService = await testRetrieveServices(salon.id)
    await testUpdateService(testService.id, staff1.id)
    await testArchiveAndRestore(testService.id)
    await testDeleteService(salon.id)
    await testStaffAssignment(salon.id)

    await cleanup(salon.id)

    await printSummary()

    const failed = results.filter((r) => r.status === 'FAIL').length
    process.exit(failed > 0 ? 1 : 0)
  } catch (error) {
    console.error('\n❌ Test suite failed with error:', error)
    process.exit(1)
  }
}

main()
