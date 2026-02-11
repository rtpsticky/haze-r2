'use server';

import prisma from '@/lib/prisma';
import { unstable_noStore as noStore } from 'next/cache';

export async function getDashboardStats() {
    noStore();
    try {
        // 1. MeasureLog Stats (Group by Status)
        const measureStats = await prisma.measureLog.groupBy({
            by: ['status'],
            _count: {
                _all: true,
            },
        });

        const measureTotal = measureStats.reduce((acc, cur) => acc + cur._count._all, 0);
        const measureCompleted = measureStats.find((s) => s.status === true)?._count._all || 0;

        // 2. PheocReport Stats (Latest Report Status)
        const latestPheoc = await prisma.pheocReport.findFirst({
            orderBy: { reportDate: 'desc' },
        });

        // 3. VulnerableData Stats (Total Targets by Group)
        const vulnerableStats = await prisma.vulnerableData.groupBy({
            by: ['groupType'],
            _sum: {
                targetCount: true,
            },
        });

        const totalVulnerable = vulnerableStats.reduce((acc, cur) => acc + (cur._sum.targetCount || 0), 0);

        // 4. InventoryLog Stats (Total Stock by Item)
        const inventoryStats = await prisma.inventoryLog.groupBy({
            by: ['itemName'],
            _sum: {
                stockCount: true,
            },
        });

        const totalInventoryStock = inventoryStats.reduce((acc, cur) => acc + (cur._sum.stockCount || 0), 0);

        // 5. CleanRoomReport Stats (Total Rooms & Services)
        const cleanRoomStats = await prisma.cleanRoomReport.aggregate({
            _sum: {
                placeCount: true,
                targetRoomCount: true,
                passedStandard: true,
                serviceUserCount: true,
            },
        });

        // 6. OperationLog Stats (Detailed Grouping)
        const operationStats = await prisma.operationLog.groupBy({
            by: ['activityType', 'targetGroup', 'itemName'],
            _sum: {
                amount: true
            }
        });

        // 7. ActiveCareLog Stats
        const activeCareStats = await prisma.activeCareLog.aggregate({
            _sum: {
                households: true,
                people: true,
                riskGroups: true,
            },
        });

        // 8. LocalAdminSupport Stats
        const localAdminStats = await prisma.localAdminSupport.aggregate({
            _sum: {
                orgCount: true,
                maskSupport: true,
                dustNetSupport: true,
                cleanRoomSupport: true,
            },
        });

        // 9. Staff Incident Stats
        const staffIncidentStats = await prisma.staffIncident.groupBy({
            by: ['status'],
            _count: {
                _all: true
            }
        });

        return {
            measure: {
                total: measureTotal,
                completed: measureCompleted,
                pending: measureTotal - measureCompleted,
            },
            pheoc: latestPheoc,
            vulnerable: {
                total: totalVulnerable,
                byGroup: vulnerableStats.map(v => ({ name: v.groupType, count: v._sum.targetCount || 0 })),
            },
            inventory: {
                totalStock: totalInventoryStock,
                byItem: inventoryStats.map(i => ({ name: i.itemName, count: i._sum.stockCount || 0 })),
            },
            cleanRoom: cleanRoomStats._sum,
            operation: {
                detailed: operationStats.map(o => ({
                    activity: o.activityType,
                    target: o.targetGroup,
                    item: o.itemName,
                    amount: o._sum.amount || 0
                })),
                // Keep backward compatibility for summary if needed, or calculate from detailed
                byActivity: Object.values(operationStats.reduce((acc, curr) => {
                    const key = curr.activityType;
                    if (!acc[key]) acc[key] = { name: key, count: 0, amount: 0 };
                    acc[key].count += 1; // logical count approximation
                    acc[key].amount += curr._sum.amount || 0;
                    return acc;
                }, {})),
            },
            activeCare: activeCareStats._sum,
            localAdmin: localAdminStats._sum,
            staffIncident: staffIncidentStats.map(s => ({ status: s.status, count: s._count._all })),
        };
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        return null;
    }
}
