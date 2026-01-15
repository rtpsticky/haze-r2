const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

const prisma = new PrismaClient()

async function main() {
    console.log('Start seeding locations...')

    const filePath = path.join(process.cwd(), 'public', 'location.json')
    const rawData = fs.readFileSync(filePath, 'utf-8')
    const locations = JSON.parse(rawData)

    console.log(`Found ${locations.length} locations in JSON file.`)

    // 1. Fetch existing locations to avoid duplicates
    // Since there is no unique constraint on (province, district, subdistrict), 
    // we must check manually.
    console.log('Fetching existing locations...')
    const existingLocations = await prisma.location.findMany({
        select: {
            provinceName: true,
            districtName: true,
            subDistrict: true
        }
    })

    const existingSet = new Set(
        existingLocations.map(l => `${l.provinceName}|${l.districtName}|${l.subDistrict}`)
    )

    console.log(`Found ${existingLocations.length} existing locations in database.`)

    // 2. Filter new locations
    const newLocations = locations.filter(l => {
        // JSON keys: province, district, subdistrict
        // DB keys: provinceName, districtName, subDistrict
        const key = `${l.province}|${l.district}|${l.subdistrict}`
        return !existingSet.has(key)
    }).map(l => ({
        provinceName: l.province,
        districtName: l.district,
        subDistrict: l.subdistrict
    }))

    if (newLocations.length === 0) {
        console.log('No new locations to add.')
        return
    }

    console.log(`Preparing to add ${newLocations.length} new locations...`)

    // 3. Bulk Insert
    // Split into chunks if too large (Prisma createMany can handle large arrays but safety first)
    const BATCH_SIZE = 1000
    for (let i = 0; i < newLocations.length; i += BATCH_SIZE) {
        const batch = newLocations.slice(i, i + BATCH_SIZE)
        console.log(`Inserting batch ${Math.floor(i / BATCH_SIZE) + 1}...`)
        await prisma.location.createMany({
            data: batch
        })
    }

    console.log('Seeding locations finished successfully.')
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
