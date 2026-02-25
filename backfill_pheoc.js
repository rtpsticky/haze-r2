const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    // 1. Get all SSJ users and their locationIds
    const ssjUsers = await prisma.user.findMany({
        where: { role: 'SSJ' },
        select: { locationId: true }
    });

    const ssjLocationIds = [...new Set(ssjUsers.map(u => u.locationId))];
    console.log('SSJ Location IDs:', ssjLocationIds);

    // 2. Update existing PheocReports that have null role but belong to SSJ locations
    const result = await prisma.pheocReport.updateMany({
        where: {
            recordedByRole: null,
            locationId: { in: ssjLocationIds }
        },
        data: {
            recordedByRole: 'SSJ'
        }
    });

    console.log(`Updated ${result.count} reports to role SSJ.`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
