const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    const pendingUsers = await prisma.user.findMany({
        where: { isApproved: false }
    })
    console.log('Pending Users:', pendingUsers.length)
    if (pendingUsers.length > 0) {
        console.log(JSON.stringify(pendingUsers, null, 2))
    }
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
