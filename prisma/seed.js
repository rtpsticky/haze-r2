const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
    console.log('Start seeding...')

    // 1. Create Default Location
    const location = await prisma.location.upsert({
        where: { id: 1 },
        update: {},
        create: {
            provinceName: 'พิษณุโลก',
            districtName: 'เมือง',
            subDistrict: 'ในเมือง',
        },
    })

    console.log('Created Location:', location)

    const password = await bcrypt.hash('123456', 10)

    // 2. Create Users for each Role
    const users = [
        {
            username: 'admin',
            name: 'Admin User',
            role: 'ADMIN',
            orgName: 'Haze-r2 Admin',
        },
        {
            username: 'ssj_user',
            name: 'SSJ User',
            role: 'SSJ',
            orgName: 'สสจ. พิษณุโลก',
        },
        {
            username: 'sso_user',
            name: 'SSO User',
            role: 'SSO',
            orgName: 'สสอ. เมือง',
        },
        {
            username: 'hospital_user',
            name: 'Hospital User',
            role: 'HOSPITAL',
            orgName: 'รพ.สต. ในเมือง',
        },
    ]

    for (const u of users) {
        const user = await prisma.user.upsert({
            where: { username: u.username },
            update: {},
            create: {
                username: u.username,
                password: password,
                name: u.name,
                role: u.role,
                orgName: u.orgName,
                locationId: location.id,
            },
        })
        console.log(`Created user with id: ${user.id} and role: ${user.role}`)
    }

    console.log('Seeding finished.')
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
