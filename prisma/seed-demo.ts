import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import * as dotenv from 'dotenv'

dotenv.config()

const url = process.env.DATABASE_URL
if (!url) {
  throw new Error('DATABASE_URL is not defined')
}

const pool = new Pool({ connectionString: url })
// @ts-ignore - bypassing type mismatch for adapter interface
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Seeding demo data...')

  const demoEmployees = [
    {
      employeeId: 'EMP101',
      employeeName: 'Rahul Sharma',
      state: 'Maharashtra',
      city: 'Mumbai',
      pincode: '400001',
      vendor: 'HDFC Bank',
      personalMobileNo: '9876543210',
      addressLine1: 'Flat 402, Sea View Apartment',
      addressLine2: 'Marine Drive',
      bookLanguage: 'English',
      trainingLanguage: 'Hindi',
      examCenter: 'Mumbai South Office',
      activeStatus: 'Active',
      phase: 'Phase 1'
    },
    {
      employeeId: 'EMP102',
      employeeName: 'Anjali Gupta',
      state: 'Delhi',
      city: 'New Delhi',
      pincode: '110001',
      vendor: 'ICICI Bank',
      personalMobileNo: '9823456789',
      addressLine1: 'H-24, Green Park Extension',
      addressLine2: 'Near Metro Station',
      bookLanguage: 'Hindi',
      trainingLanguage: 'Hindi',
      examCenter: 'Delhi Corporate Park',
      activeStatus: 'Active',
      phase: 'Phase 1'
    },
    {
      employeeId: 'EMP103',
      employeeName: 'Vikram Singh',
      state: 'Rajasthan',
      city: 'Jaipur',
      pincode: '302001',
      vendor: 'Axis Bank',
      personalMobileNo: '9988776655',
      addressLine1: 'Plot 78, Vaishali Nagar',
      addressLine2: 'Behind Hanuman Temple',
      bookLanguage: 'English',
      trainingLanguage: 'English',
      examCenter: 'Jaipur Zonal Office',
      activeStatus: 'Active',
      phase: 'Phase 1'
    },
    {
      employeeId: 'EMP104',
      employeeName: 'Priya Patel',
      state: 'Gujarat',
      city: 'Ahmedabad',
      pincode: '380001',
      vendor: 'SBI',
      personalMobileNo: '9765432109',
      addressLine1: 'B-105, Galaxy Heights',
      addressLine2: 'Satellite Road',
      bookLanguage: 'Gujarati',
      trainingLanguage: 'Gujarati',
      examCenter: 'Ahmedabad Main Branch',
      activeStatus: 'Active',
      phase: 'Phase 1'
    },
    {
      employeeId: 'EMP105',
      employeeName: 'Sanjay Kumar',
      state: 'Karnataka',
      city: 'Bangalore',
      pincode: '560001',
      vendor: 'Kotak Mahindra',
      personalMobileNo: '9654321098',
      addressLine1: '12th Floor, Prestige Tower',
      addressLine2: 'MG Road',
      bookLanguage: 'English',
      trainingLanguage: 'Kannada',
      examCenter: 'Bangalore Tech Hub',
      activeStatus: 'Active',
      phase: 'Phase 1'
    }
  ]

  for (const emp of demoEmployees) {
    const seedData = { ...emp, uploadMonth: "Demo" }
    await prisma.masterEmployee.upsert({
      where: { 
        employeeId_uploadMonth: { 
          employeeId: emp.employeeId, 
          uploadMonth: "Demo" 
        } 
      },
      update: seedData,
      create: seedData,
    })
  }

  console.log('Successfully seeded 5 demo employees (EMP101-EMP105)')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
