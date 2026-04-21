'use server'

import prisma from '@/lib/prisma'
import { getSession } from '@/lib/auth'

async function checkAdmin() {
    const session = await getSession()
    if (!session) throw new Error('Unauthorized')

    const user = await prisma.user.findUnique({
        where: { id: session.userId }
    })

    if (!user || (user.role !== 'ADMIN' && user.role !== 'HEALTH_REGION')) {
        throw new Error('Forbidden')
    }
    return user
}

const ITEMS_PER_PAGE = 20

// Helper to check if a user has reported in a specific category using the item-postfix isolation logic
const hasReported = (user, typeData, fieldName) => {
    const orgToken = `[${user.orgName}]`
    return typeData.some(item => 
        item.locationId === user.locationId && 
        (item[fieldName]?.includes(orgToken) || item.recordedBy === user.orgName)
    )
}

export async function getWeeklyStaffTracking({ page = 1, filterStatus = 'all', refDate = null, filterProvince = 'all', filterDistrict = 'all' } = {}) {
    try {
        await checkAdmin()

        const skip = (page - 1) * ITEMS_PER_PAGE

        // Get the date range for the selected week (Monday to Sunday)
        const now = refDate ? new Date(refDate) : new Date()
        const day = now.getDay() || 7 // Monday = 1, ..., Sunday = 7
        const firstDay = new Date(now)
        firstDay.setDate(now.getDate() - day + 1)
        firstDay.setHours(0, 0, 0, 0)
        
        const lastDay = new Date(firstDay)
        lastDay.setDate(firstDay.getDate() + 6)
        lastDay.setHours(23, 59, 59, 999)

        const where = {
            role: { in: ['PCU', 'HOSPITAL', 'SSO'] },
            isApproved: true
        }

        // Apply Location Filters to the 'where' clause for users
        if (filterProvince !== 'all') {
            where.location = { provinceName: filterProvince }
            if (filterDistrict !== 'all') {
                where.location.districtName = filterDistrict
            }
        }

        // Fetch all reporting users matching the location filters to calculate global statuses
        const allReportingUsers = await prisma.user.findMany({
            where,
            include: { location: true },
            orderBy: [
                { location: { provinceName: 'asc' } },
                { location: { districtName: 'asc' } },
                { orgName: 'asc' }
            ]
        })

        // Fetch all reports for the current week to check who has filed what
        const [inventory, cleanRoom, operations, activeCare, incidents, vulnerable, vulnerableByPass, measures] = await Promise.all([
            prisma.inventoryLog.findMany({ where: { recordDate: { gte: firstDay, lte: lastDay } }, select: { locationId: true, itemName: true } }),
            prisma.cleanRoomReport.findMany({ where: { recordDate: { gte: firstDay, lte: lastDay } }, select: { locationId: true, placeType: true } }),
            prisma.operationLog.findMany({ where: { recordDate: { gte: firstDay, lte: lastDay } }, select: { locationId: true, activityType: true } }),
            prisma.activeCareLog.findMany({ where: { recordDate: { gte: firstDay, lte: lastDay } }, select: { locationId: true, activity: true } }),
            prisma.staffIncident.findMany({ where: { recordDate: { gte: firstDay, lte: lastDay } }, select: { locationId: true, staffName: true } }),
            prisma.vulnerableData.findMany({ where: { recordDate: { gte: firstDay, lte: lastDay } }, select: { locationId: true, groupType: true } }),
            prisma.vulnerableDataByPass.findMany({ where: { recordDate: { gte: firstDay, lte: lastDay } }, select: { locationId: true, groupType: true } }),
            prisma.measureLog.findMany({ where: { createdAt: { gte: firstDay, lte: lastDay } }, select: { locationId: true, recordedBy: true } })
        ])

        // Calculate Global Statuses and Apply Status Filter
        const reportStatusAll = allReportingUsers.map(user => {
            const reports = {
                inventory: hasReported(user, inventory, 'itemName'),
                cleanRoom: hasReported(user, cleanRoom, 'placeType'),
                operations: hasReported(user, operations, 'activityType'),
                activeCare: hasReported(user, activeCare, 'activity'),
                incidents: hasReported(user, incidents, 'staffName'),
                vulnerable: vulnerable.some(v => v.locationId === user.locationId) || vulnerableByPass.some(v => v.locationId === user.locationId),
                measures: measures.some(m => m.locationId === user.locationId && m.recordedBy === user.orgName)
            }
            const completedCount = Object.values(reports).filter(Boolean).length
            
            return {
                id: user.id,
                name: user.name,
                orgName: user.orgName,
                role: user.role,
                province: user.location.provinceName,
                district: user.location.districtName,
                subDistrict: user.location.subDistrict,
                reports,
                completionRate: Math.round((completedCount / 7) * 100),
                isRecorded: completedCount >= 1
            }
        })

        // Global stats for dashboard cards (respecting location filters)
        const globalAtLeastOne = reportStatusAll.filter(r => r.isRecorded).length
        const globalNotStarted = reportStatusAll.filter(r => !r.isRecorded).length

        // Apply Status Filter for Pagination
        let filteredData = reportStatusAll
        if (filterStatus === 'recorded') {
            filteredData = reportStatusAll.filter(r => r.isRecorded)
        } else if (filterStatus === 'pending') {
            filteredData = reportStatusAll.filter(r => !r.isRecorded)
        }

        const totalItemsFiltered = filteredData.length
        const reportStatusPage = filteredData.slice(skip, skip + ITEMS_PER_PAGE)

        return {
            success: true,
            data: reportStatusPage,
            allData: reportStatusAll, // Required for full excel export if needed
            globalStats: {
                totalAtLeastOne: globalAtLeastOne,
                totalNotStarted: globalNotStarted
            },
            totalPages: Math.ceil(totalItemsFiltered / ITEMS_PER_PAGE),
            currentPage: page,
            totalItems: totalItemsFiltered,
            weekRange: {
                start: firstDay.toISOString(),
                end: lastDay.toISOString()
            }
        }

    } catch (error) {
        console.error('Error fetching weekly tracking:', error)
        return { success: false, message: error.message }
    }
}

export async function getOverallTrackingExport() {
    try {
        await checkAdmin()

        const where = {
            role: { in: ['PCU', 'HOSPITAL', 'SSO'] },
            isApproved: true
        }

        const [users, inventory, cleanRoom, operations, activeCare, incidents, vulnerable, vulnerableByPass, measures] = await Promise.all([
            prisma.user.findMany({ where, include: { location: true }, orderBy: [{ location: { provinceName: 'asc' } }, { orgName: 'asc' }] }),
            prisma.inventoryLog.findMany({ select: { locationId: true, itemName: true } }),
            prisma.cleanRoomReport.findMany({ select: { locationId: true, placeType: true } }),
            prisma.operationLog.findMany({ select: { locationId: true, activityType: true } }),
            prisma.activeCareLog.findMany({ select: { locationId: true, activity: true } }),
            prisma.staffIncident.findMany({ select: { locationId: true, staffName: true } }),
            prisma.vulnerableData.findMany({ select: { locationId: true, groupType: true } }),
            prisma.vulnerableDataByPass.findMany({ select: { locationId: true, groupType: true } }),
            prisma.measureLog.findMany({ select: { locationId: true, recordedBy: true } })
        ])

        return users.map(user => {
            const reports = {
                inventory: hasReported(user, inventory, 'itemName'),
                cleanRoom: hasReported(user, cleanRoom, 'placeType'),
                operations: hasReported(user, operations, 'activityType'),
                activeCare: hasReported(user, activeCare, 'activity'),
                incidents: hasReported(user, incidents, 'staffName'),
                vulnerable: vulnerable.some(v => v.locationId === user.locationId) || vulnerableByPass.some(v => v.locationId === user.locationId),
                measures: measures.some(m => m.locationId === user.locationId && m.recordedBy === user.orgName)
            }
            const hasEverReported = Object.values(reports).some(Boolean)

            return {
                orgName: user.orgName,
                province: user.location.provinceName,
                district: user.location.districtName,
                subDistrict: user.location.subDistrict,
                hasEverReported: hasEverReported ? 'เคยบันทึก' : 'ยังไม่เคยบันทึกเลย',
                status: hasEverReported ? 'Active' : 'Inactive'
            }
        })

    } catch (error) {
        console.error('Error fetching overall export:', error)
        return []
    }
}
