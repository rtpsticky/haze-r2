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

        const normalizeItemName = (name) => {
            if (!name) return name;
            const n = name.toLowerCase();
            if (n.includes('คาร์บอน') || n.includes('carbon mask')) return 'หน้ากากคาร์บอน (ชิ้น)';
            if (n.includes('หน้ากากผ้า') || n.includes('cloth mask')) return 'หน้ากากผ้า (ชิ้น)';
            if (n.includes('n95')) return 'หน้ากาก N95 (ชิ้น)';
            if (n.includes('surgical') || n.includes('หน้ากากอนามัย')) return 'หน้ากาก Surgical Mask (ชิ้น)';
            return name;
        };

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
        // Group by province and take the latest report for each unique province name
        const allLocations = await prisma.location.findMany({
            include: {
                pheocReports: {
                    where: {
                        recordedByRole: 'SSJ'
                    },
                    orderBy: { reportDate: 'desc' },
                    take: 1
                }
            }
        });

        // Map to store latest report per province
        const provinceLatestMap = {};

        allLocations.forEach(loc => {
            const latest = loc.pheocReports[0];
            const pName = loc.provinceName;
            const dName = loc.districtName;

            if (latest) {
                const latestDate = new Date(latest.reportDate);
                const currentStored = provinceLatestMap[pName];

                if (!currentStored || latestDate > new Date(currentStored.reportDate)) {
                    provinceLatestMap[pName] = {
                        ...latest,
                        districtName: dName
                    };
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

        Object.keys(provinceLatestMap).forEach(name => {
            const latest = provinceLatestMap[name];
            const dateStr = latest.reportDate.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });
            const item = `${name} (${dateStr})`;

            if (latest.status === 'เฝ้าระวังปกติ') {
                normalCount++;
                normalList.push(item);
            } else if (latest.status === 'เฝ้าระวังใกล้ชิด') {
                alertCount++;
                alertList.push(item);
            } else if (latest.status === 'เปิด PHEOC') {
                // If Open PHEOC with a responseLevel, show ONLY in the response level bucket (not in alert)
                if (latest.responseLevel === 'ระดับตอบโต้ 1') {
                    level1Count++;
                    level1List.push(item);
                } else if (latest.responseLevel === 'ระดับตอบโต้ 2') {
                    level2Count++;
                    level2List.push(item);
                } else if (latest.responseLevel === 'ระดับตอบโต้ 3') {
                    level3Count++;
                    level3List.push(item);
                } else {
                    // เปิด PHEOC but no responseLevel set — fall back to alert
                    alertCount++;
                    alertList.push(item);
                }
            }
        });

        // 3. VulnerableData Stats (Total Targets by Group) - Merged with ByPass province-level priority
        const [normalVulnerable, bypassVulnerable, locationsData] = await Promise.all([
            prisma.vulnerableData.findMany({
                where: whereClause,
                include: { location: true }
            }),
            prisma.vulnerableDataByPass.findMany({
                where: whereClause,
                include: { location: true }
            }),
            prisma.location.findMany()
        ]);

        // Map locationId to provinceName for easy lookup
        const locMap = {};
        locationsData.forEach(l => locMap[l.id] = l.provinceName);

        // Identify which provinces have ANY bypass data
        const provincesWithByPass = new Set();
        bypassVulnerable.forEach(r => {
            const pName = r.location?.provinceName || locMap[r.locationId];
            if (pName) provincesWithByPass.add(pName);
        });

        // Filter normal data: Ignore any record from a province that has bypass data
        const filteredNormal = normalVulnerable.filter(r => {
            const pName = r.location?.provinceName || locMap[r.locationId];
            return !provincesWithByPass.has(pName);
        });

        // Combine: All ByPass records + Normal records from provinces without ByPass
        const combinedData = [...bypassVulnerable, ...filteredNormal];

        const vulnerableGroupSums = {};
        combinedData.forEach(record => {
            if (!vulnerableGroupSums[record.groupType]) vulnerableGroupSums[record.groupType] = 0;
            vulnerableGroupSums[record.groupType] += record.targetCount;
        });

        const vulnerableStats = Object.entries(vulnerableGroupSums).map(([groupType, sum]) => ({
            groupType,
            _sum: { targetCount: sum }
        }));

        const totalVulnerable = Object.values(vulnerableGroupSums).reduce((acc, cur) => acc + cur, 0);

        // 4. InventoryLog Stats (Latest Snapshot by Location + Item) - FILTERED
        // We need the latest record for each (locationId, itemName) pair
        const allInventoryRecords = await prisma.inventoryLog.findMany({
            where: whereClause,
            orderBy: [
                { recordDate: 'desc' },
                { id: 'desc' }
            ]
        });

        // Use a map to keep only the latest record for each (locationId, itemName)
        const latestInventoryMap = new Map();
        allInventoryRecords.forEach(record => {
            const key = `${record.locationId}|${normalizeItemName(record.itemName)}`;
            if (!latestInventoryMap.has(key)) {
                latestInventoryMap.set(key, { name: normalizeItemName(record.itemName), count: record.stockCount });
            }
        });

        // Group by itemName and sum up the latest counts from all locations
        const inventoryByItemMap = {};
        latestInventoryMap.forEach((data) => {
            if (!inventoryByItemMap[data.name]) inventoryByItemMap[data.name] = 0;
            inventoryByItemMap[data.name] += data.count;
        });

        const inventoryStats = Object.entries(inventoryByItemMap).map(([name, count]) => ({
            itemName: name,
            _sum: { stockCount: count }
        }));

        const totalInventoryStock = Object.values(inventoryByItemMap).reduce((acc, count) => acc + count, 0);

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

        // 10. Supply Snapshot (By Province and Item) - NEW
        const operationByProvinceAndItem = await prisma.operationLog.groupBy({
            where: {
                ...whereClause,
                itemName: { not: null },
                activityType: { not: 'DUST_NET' }
            },
            by: ['itemName', 'locationId'],
            _sum: {
                amount: true
            }
        });

        // Get Locations to map locationId to province
        const locations = await prisma.location.findMany();
        const locationMap = new Map(locations.map(l => [l.id, l]));

        // Final Supply Snapshot Structure
        // We need to sum the latest counts per location into province/item buckets
        const itemsSet = new Set();
        const provincesSet = new Set();
        const provinceItemStockMap = {}; // key: "province|item"

        // Use the latestInventoryMap we already built (which is latest per location/item)
        latestInventoryMap.forEach((data, key) => {
            const [locationId, itemName] = key.split('|');
            const loc = locationMap.get(parseInt(locationId));
            if (!loc) return;

            const province = loc.provinceName;
            const item = data.name;
            const piKey = `${province}|${item}`;

            if (!provinceItemStockMap[piKey]) provinceItemStockMap[piKey] = 0;
            provinceItemStockMap[piKey] += data.count;

            itemsSet.add(item);
            provincesSet.add(province);
        });

        // Process Operation (Distribution) sum
        const provinceOperationMap = {};
        operationByProvinceAndItem.forEach(record => {
            const loc = locationMap.get(record.locationId);
            if (!loc) return;
            const province = loc.provinceName;
            const item = normalizeItemName(record.itemName);
            const key = `${province}|${item}`;
            if (!provinceOperationMap[key]) provinceOperationMap[key] = 0;
            provinceOperationMap[key] += record._sum.amount || 0;
            itemsSet.add(item);
            provincesSet.add(province);
        });

        const supplySnapshot = Array.from(itemsSet).map(item => {
            const provinces = Array.from(provincesSet).map(province => {
                const key = `${province}|${item}`;
                return {
                    province,
                    stock: provinceItemStockMap[key] || 0,
                    dispatched: provinceOperationMap[key] || 0
                };
            });
            return { item, provinces };
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
                },
                latestByProvince: Object.keys(provinceLatestMap).map(name => ({
                    province: name,
                    district: provinceLatestMap[name].districtName,
                    status: provinceLatestMap[name].status,
                    responseLevel: provinceLatestMap[name].responseLevel,
                    reportDate: provinceLatestMap[name].reportDate.toISOString()
                }))
            },
            vulnerable: {
                total: totalVulnerable,
                byGroup: vulnerableStats.map(v => ({ name: v.groupType, count: v._sum.targetCount || 0 })),
            },
            inventory: {
                totalStock: totalInventoryStock,
                byItem: inventoryStats.map(i => ({ name: i.itemName, count: i._sum.stockCount || 0 })),
            },
            supplySnapshot, // NEW
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
                    item: normalizeItemName(o.itemName),
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
