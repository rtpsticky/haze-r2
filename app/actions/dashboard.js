'use server';

import prisma from '@/lib/prisma';
import { unstable_noStore as noStore } from 'next/cache';

export async function getDashboardStats(filters = {}) {
    noStore();
    try {
        // Build Where Clause for filtering
        const whereClause = {};
        if (filters.province) {
            whereClause.location = {
                provinceName: filters.province
            };
            if (filters.district) {
                whereClause.location.districtName = filters.district;
                if (filters.subDistrict) {
                    whereClause.location.subDistrict = filters.subDistrict;
                }
            }
        }

        // 1. MeasureLog Stats (Group by Status) - FILTERED
        const measureStats = await prisma.measureLog.groupBy({
            by: ['status'],
            where: whereClause,
            _count: {
                _all: true,
            },
        });

        const measureTotal = measureStats.reduce((acc, cur) => acc + cur._count._all, 0);
        const measureCompleted = measureStats.find((s) => s.status === true)?._count._all || 0;

        // 2. PheocReport Stats (Latest Report Status) - FILTERED
        const latestPheoc = await prisma.pheocReport.findFirst({
            where: whereClause,
            orderBy: { reportDate: 'desc' },
        });

        // 2.1 Situation Stats (Measures and Management) - UNFILTERED (Global Counts)
        // Always fetch all locations for the summary card
        const allLocations = await prisma.location.findMany({
            include: {
                pheocReports: {
                    orderBy: { reportDate: 'desc' },
                    take: 1
                }
            }
        });

        let normalCount = 0;
        let alertCount = 0;
        let level1Count = 0;
        let level2Count = 0;
        let level3Count = 0;

        // Initialize lists
        let normalList = [];
        let alertList = [];
        let level1List = [];
        let level2List = [];
        let level3List = [];

        allLocations.forEach(loc => {
            const latest = loc.pheocReports[0];
            const name = loc.provinceName;

            if (latest) {
                if (latest.status === 'เฝ้าระวังปกติ') normalCount++;
                // Assuming 'เฝ้าระวังใกล้ชิด' or similar maps to "Alert"
                // Adjusting logic: Any status that isn't 'เฝ้าระวังปกติ' might be considered alert/abnormal, 
                // OR specifically 'เฝ้าระวังใกล้ชิด'. Let's stick to 'เฝ้าระวังใกล้ชิด' as Alert for now based on common patterns along with 'เปิด PHEOC'.
                // If the user meant "Alert" as general abnormal state, I might need to broader this. 
                // But specifically requested "alert กี่จังหวัด", I will map 'เฝ้าระวังใกล้ชิด' to it.
                if (latest.status === 'เฝ้าระวังใกล้ชิด' || latest.status === 'เปิด PHEOC') alertCount++;

                if (latest.responseLevel === '1') level1Count++;
                if (latest.responseLevel === '2') level2Count++;
                if (latest.responseLevel === '3') level3Count++;

                // Collect province names for lists
                if (latest.status === 'เฝ้าระวังปกติ') normalList.push(name);
                if (latest.status === 'เฝ้าระวังใกล้ชิด' || latest.status === 'เปิด PHEOC') alertList.push(name);

                if (latest.responseLevel === '1') level1List.push(name);
                if (latest.responseLevel === '2') level2List.push(name);
                if (latest.responseLevel === '3') level3List.push(name);
            } else {
                // No report -> Treat as Normal? Or Unknown? 
                // Usually default is normal if no data, or just ignore. 
                // Let's count them as Normal for now to not look empty, OR just ignore. 
                // Better to ignore to be accurate.
                // normalCount++; 
            }
        });

        // 3. VulnerableData Stats (Total Targets by Group) - FILTERED
        const vulnerableStats = await prisma.vulnerableData.groupBy({
            by: ['groupType'],
            where: whereClause,
            _sum: {
                targetCount: true,
            },
        });

        const totalVulnerable = vulnerableStats.reduce((acc, cur) => acc + (cur._sum.targetCount || 0), 0);

        // 4. InventoryLog Stats (Total Stock by Item) - FILTERED
        const inventoryStats = await prisma.inventoryLog.groupBy({
            by: ['itemName'],
            where: whereClause,
            _sum: {
                stockCount: true,
            },
        });

        const totalInventoryStock = inventoryStats.reduce((acc, cur) => acc + (cur._sum.stockCount || 0), 0);

        // 5. CleanRoomReport Stats (Total Rooms & Services) - FILTERED
        const cleanRoomStats = await prisma.cleanRoomReport.aggregate({
            where: whereClause,
            _sum: {
                placeCount: true,
                targetRoomCount: true,
                passedStandard: true,
                serviceUserCount: true,
            },
        });

        // 2.6 Clean Room Group by Type
        const cleanRoomByType = await prisma.cleanRoomReport.groupBy({
            by: ['placeType'],
            _sum: {
                targetRoomCount: true,
                passedStandard: true,
                standard1Count: true,
                standard2Count: true,
                standard3Count: true
            },
            where: whereClause
        });

        // 2.7 Operation Logs Stats (Detailed Grouping) - FILTERED
        const operationStats = await prisma.operationLog.groupBy({
            by: ['activityType', 'targetGroup', 'itemName'],
            where: whereClause,
            _sum: {
                amount: true
            }
        });

        // 7. ActiveCareLog Stats - FILTERED
        const activeCareStats = await prisma.activeCareLog.aggregate({
            where: whereClause,
            _sum: {
                households: true,
                people: true,
                riskGroups: true,
            },
        });

        // 8. LocalAdminSupport Stats - FILTERED
        const localAdminStats = await prisma.localAdminSupport.aggregate({
            where: whereClause,
            _sum: {
                orgCount: true,
                maskSupport: true,
                dustNetSupport: true,
                cleanRoomSupport: true,
            },
        });

        // 9. Staff Incident Stats - FILTERED
        const staffIncidentStats = await prisma.staffIncident.groupBy({
            by: ['status'],
            where: whereClause,
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
            pheoc: latestPheoc ? {
                ...latestPheoc,
                reportDate: latestPheoc.reportDate.toISOString(),
                recordedAt: latestPheoc.recordedAt.toISOString(),
            } : null,
            situation: {
                normal: normalCount,
                alert: alertCount,
                level1: level1Count,
                level2: level2Count,
                level3: level3Count,
                lists: {
                    normal: [...new Set(normalList)], // Ensure unique
                    alert: [...new Set(alertList)],
                    level1: [...new Set(level1List)],
                    level2: [...new Set(level2List)],
                    level3: [...new Set(level3List)]
                }
            },
            vulnerable: {
                total: totalVulnerable,
                byGroup: vulnerableStats.map(v => ({ name: v.groupType, count: v._sum.targetCount || 0 })),
            },
            inventory: {
                totalStock: totalInventoryStock,
                byItem: inventoryStats.map(i => ({ name: i.itemName, count: i._sum.stockCount || 0 })),
            },
            cleanRoom: {
                ...cleanRoomStats._sum,
                byType: cleanRoomByType.map(t => ({
                    name: t.placeType,
                    count: t._sum.passedStandard || 0,
                    total: t._sum.targetRoomCount || 0,
                    standard1: t._sum.standard1Count || 0,
                    standard2: t._sum.standard2Count || 0,
                    standard3: t._sum.standard3Count || 0
                }))
            },
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
