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

  // 1. Fetch or create the Demo Company client
  let demoClient = await prisma.client.findUnique({
    where: { slug: 'demo' }
  })

  if (!demoClient) {
    console.log('Demo Company client not found. Creating...')
    demoClient = await prisma.client.create({
      data: {
        name: 'Demo Company',
        slug: 'demo',
        examCenters: [
          'Mumbai South Office',
          'Delhi Corporate Park',
          'Jaipur Zonal Office',
          'Ahmedabad Main Branch',
          'Bangalore Tech Hub',
          'Lucknow Zonal Office',
          'Kolkata Regional Office',
          'Patna Main Branch',
          'Trivandrum Zonal Office',
          'Vijayawada Regional Office'
        ]
      }
    })
  }

  const clientId = demoClient.id
  console.log(`Using Demo Company Client ID: ${clientId}`)

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
    },
    {
      employeeId: 'EMP106',
      employeeName: 'Rohit Verma',
      state: 'Uttar Pradesh',
      city: 'Lucknow',
      pincode: '226001',
      vendor: 'PNB',
      personalMobileNo: '9812345678',
      addressLine1: 'C-302, Shalimar Apartments',
      addressLine2: 'Hazratganj',
      bookLanguage: 'English',
      trainingLanguage: 'Hindi',
      examCenter: 'Lucknow Zonal Office',
      activeStatus: 'Active',
      phase: 'Phase 1'
    },
    {
      employeeId: 'EMP107',
      employeeName: 'Neha Sen',
      state: 'West Bengal',
      city: 'Kolkata',
      pincode: '700001',
      vendor: 'Bandhan Bank',
      personalMobileNo: '9834567890',
      addressLine1: '54/1, Salt Lake Sector 1',
      addressLine2: 'Near Swimming Pool',
      bookLanguage: 'English',
      trainingLanguage: 'Bengali',
      examCenter: 'Kolkata Regional Office',
      activeStatus: 'Active',
      phase: 'Phase 1'
    },
    {
      employeeId: 'EMP108',
      employeeName: 'Amit Mishra',
      state: 'Bihar',
      city: 'Patna',
      pincode: '800001',
      vendor: 'BOI',
      personalMobileNo: '9543210987',
      addressLine1: 'K-12, Boring Road',
      addressLine2: 'Opp. Krishna Complex',
      bookLanguage: 'Hindi',
      trainingLanguage: 'Hindi',
      examCenter: 'Patna Main Branch',
      activeStatus: 'Active',
      phase: 'Phase 1'
    },
    {
      employeeId: 'EMP109',
      employeeName: 'Shalini Nair',
      state: 'Kerala',
      city: 'Trivandrum',
      pincode: '695001',
      vendor: 'Federal Bank',
      personalMobileNo: '9443210987',
      addressLine1: 'TC 4/122, Kowdiar Gardens',
      addressLine2: 'Kowdiar',
      bookLanguage: 'English',
      trainingLanguage: 'Malayalam',
      examCenter: 'Trivandrum Zonal Office',
      activeStatus: 'Active',
      phase: 'Phase 1'
    },
    {
      employeeId: 'EMP110',
      employeeName: 'Deepak Reddy',
      state: 'Andhra Pradesh',
      city: 'Vijayawada',
      pincode: '520001',
      vendor: 'Union Bank',
      personalMobileNo: '9343210987',
      addressLine1: 'Flat 101, Srinivasa Residency',
      addressLine2: 'Benz Circle',
      bookLanguage: 'English',
      trainingLanguage: 'Telugu',
      examCenter: 'Vijayawada Regional Office',
      activeStatus: 'Active',
      phase: 'Phase 1'
    }
  ]

  // Clean up any existing demo employee records that have employeeId like 'EMP10%'
  // to avoid key conflicts or duplicate/mismatched client entries.
  console.log('Cleaning up old EMP101-EMP110 records...')
  const deleteResult = await prisma.masterEmployee.deleteMany({
    where: {
      employeeId: {
        in: demoEmployees.map(e => e.employeeId)
      }
    }
  })
  console.log(`Deleted ${deleteResult.count} old demo records.`)

  for (const emp of demoEmployees) {
    const seedData = { ...emp, clientId, uploadMonth: "Demo" }
    await prisma.masterEmployee.create({
      data: seedData
    })
  }

  console.log('Successfully seeded 10 demo employees (EMP101-EMP110)')
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

