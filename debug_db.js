const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany({
        where: { role: 'SSJ' },
        include: { location: true }
    });
    console.log('SSJ Users:', JSON.stringify(users, null, 2));

    const locations = await prisma.location.findMany({
        take: 5
    });
    console.log('Sample Locations:', JSON.stringify(locations, null, 2));
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
