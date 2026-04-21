'use server'

import prisma from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export async function getOperationData(dateString, requestedLocationId) {
    const session = await getSession()
    if (!session) return { success: false, error: 'Unauthorized' }

    const user = await prisma.user.findUnique({
        where: { id: session.userId },
        include: { location: true }
    })
    if (!user) return { success: false, error: 'User not found' }

    let locationId
    let location

    if (requestedLocationId) {
        locationId = parseInt(requestedLocationId)

        // Permission Check
        if (user.role !== 'ADMIN' && user.role !== 'HEALTH_REGION' && locationId !== user.locationId) {
            return { success: false, error: 'Unauthorized location access' }
        }

        location = await prisma.location.findUnique({ where: { id: locationId } })
        if (!location) return { success: false, error: 'Location not found' }
    } else {
        locationId = user.locationId
        location = user.location
    }

    const date = new Date(dateString)

    // Fetch Data
    const [operations, localSupport, vulnerables] = await Promise.all([
        prisma.operationLog.findMany({
            where: {
                locationId: locationId,
                recordDate: date,
                // Filter by organization for isolation
                recordedBy: (user.role === 'PCU' || user.role === 'HOSPITAL' || user.role === 'SSO') 
                    ? user.orgName 
                    : undefined
            }
        }),
        prisma.localAdminSupport.findFirst({
            where: {
                locationId: locationId,
                recordDate: date
            }
        }),
        prisma.vulnerableData.findMany({
            where: {
                locationId: locationId,
                recordDate: date
            }
        })
    ])

    // Fetch Accumulated Data
    const accumulated = await prisma.operationLog.groupBy({
        by: ['targetGroup', 'itemName'],
        _sum: {
            amount: true
        },
        where: {
            locationId: locationId,
            recordDate: {
                lte: date
            },
            // Filter by organization for isolation
            recordedBy: (user.role === 'PCU' || user.role === 'HOSPITAL' || user.role === 'SSO') 
                ? user.orgName 
                : undefined
        }
    })

    // Use clean activityType
    const processedOperations = operations.map(op => ({
        ...op,
        activityType: op.activityType
    }))

    const processedAccumulated = accumulated.map(acc => ({
        ...acc,
        activityType: acc.itemName ? 'PPE' : 'DUST_NET' // itemName exists only for PPE
    }))

    return {
        success: true,
        data: {
            operations: processedOperations,
            localSupport,
            vulnerables,
            location: location,
            accumulated: processedAccumulated
        }
    }
}

export async function getOperationHistory(locationId = null) {
    const session = await getSession()
    if (!session) return { success: false, error: 'Unauthorized' }

    const user = await prisma.user.findUnique({
        where: { id: session.userId },
        select: { locationId: true, role: true, orgName: true, location: { select: { provinceName: true } } }
    })
    if (!user) return { success: false, error: 'User not found' }

    let where = {}
    if (locationId) {
        const id = parseInt(locationId)
        // Permission Check
        let hasAccess = false
        if (user.role === 'ADMIN' || user.role === 'HEALTH_REGION') {
            hasAccess = true
        } else if (user.role === 'SSJ') {
            const targetLoc = await prisma.location.findUnique({ where: { id: id } })
            if (targetLoc && targetLoc.provinceName === user.location.provinceName) {
                hasAccess = true
            }
        } else if (id === user.locationId) {
            hasAccess = true
        }

        if (!hasAccess) {
            return { success: false, error: 'Unauthorized location access' }
        }
        where = { locationId: id }
    } else {
        // No locationId provided, use role-based default
        if (user.role === 'ADMIN' || user.role === 'HEALTH_REGION') {
            where = {}
        } else if (user.role === 'SSJ') {
            where = { location: { provinceName: user.location.provinceName } }
        } else {
            where = { locationId: user.locationId }
        }
    }

    // Fetch distinct dates from all relevant tables
    const [opsDates, vulnDates, supportDates] = await Promise.all([
        prisma.operationLog.findMany({
            where: {
                ...where,
                // If special roles, only show their own
                recordedBy: (user.role === 'PCU' || user.role === 'HOSPITAL' || user.role === 'SSO') 
                    ? user.orgName 
                    : undefined
            },
            select: { recordDate: true },
            distinct: ['recordDate']
        }),
        prisma.vulnerableData.findMany({
            where: { ...where, groupType: 'BEDRIDDEN_OP' },
            select: { recordDate: true },
            distinct: ['recordDate']
        }),
        prisma.localAdminSupport.findMany({
            where,
            select: { recordDate: true },
            distinct: ['recordDate']
        })
    ])

    // Combine and Deduplicate
    const allDates = new Set([
        ...opsDates.map(d => d.recordDate.toISOString().split('T')[0]),
        ...vulnDates.map(d => d.recordDate.toISOString().split('T')[0]),
        ...supportDates.map(d => d.recordDate.toISOString().split('T')[0])
    ])

    const sortedDates = Array.from(allDates).sort((a, b) => new Date(b) - new Date(a))

    return { success: true, data: sortedDates }
}

export async function deleteOperationData(dateString, locationId) {
    const session = await getSession()
    if (!session) return { success: false, message: 'Unauthorized' }

    if (!dateString || !locationId) return { success: false, message: 'Invalid arguments' }

    const user = await prisma.user.findUnique({
        where: { id: session.userId },
        select: { locationId: true, role: true, orgName: true }
    })
    if (!user) return { success: false, message: 'User not found' }

    const date = new Date(dateString)
    const id = parseInt(locationId)

    // Permission Check
    if (user.role !== 'ADMIN' && user.role !== 'HEALTH_REGION' && id !== user.locationId) {
        return { success: false, message: 'Unauthorized location delete' }
    }

    try {
        await prisma.$transaction(async (tx) => {
            await tx.operationLog.deleteMany({
                where: { 
                    locationId: id, 
                    recordDate: date,
                    recordedBy: (user.role !== 'ADMIN' && user.role !== 'HEALTH_REGION') 
                        ? user.orgName 
                        : undefined
                }
            })
            await tx.vulnerableData.deleteMany({
                where: { locationId: id, recordDate: date }
            })
            await tx.localAdminSupport.deleteMany({
                where: { locationId: id, recordDate: date }
            })
        })

        revalidatePath('/operations')
        return { success: true, message: 'ลบข้อมูลสำเร็จ' }
    } catch (error) {
        console.error('Delete error:', error)
        return { success: false, message: 'เกิดข้อผิดพลาดในการลบข้อมูล' }
    }
}

export async function saveOperationData(prevState, formData) {
    const session = await getSession()
    if (!session) return { success: false, message: 'Unauthorized' }

    const user = await prisma.user.findUnique({
        where: { id: session.userId }
    })

    if (!user) return { success: false, message: 'User not found' }

    // All roles can save operation data for their location
    if (!user.role) {
        return { success: false, message: 'Unauthorized: User role not found' }
    }

    const recordBy = user.orgName

    let targetLocationId = user.locationId
    const submittedLocationId = formData.get('locationId')
    if (submittedLocationId) {
        targetLocationId = parseInt(submittedLocationId)
    }

    const dateString = formData.get('date')
    if (!dateString) return { success: false, message: 'กรุณาระบุวันที่' }

    const date = new Date(dateString)

    // Data Extraction
    const bedriddenCount = parseInt(formData.get('bedriddenCount') || '0')
    const netsGiven = parseInt(formData.get('netsGiven') || '0')
    const netsLao = parseInt(formData.get('netsLao') || '0')

    const ppeGeneral = {
        'Surgical Mask': parseInt(formData.get('ppeGeneral_Surgical Mask') || '0'),
        'N95': parseInt(formData.get('ppeGeneral_N95') || '0'),
        'Carbon Mask': parseInt(formData.get('ppeGeneral_Carbon Mask') || '0'),
        'Cloth Mask': parseInt(formData.get('ppeGeneral_Cloth Mask') || '0'),
    }

    const ppeChildren = {
        'Surgical Mask': parseInt(formData.get('ppeChildren_Surgical Mask') || '0'),
        'N95': parseInt(formData.get('ppeChildren_N95') || '0'),
        'Carbon Mask': parseInt(formData.get('ppeChildren_Carbon Mask') || '0'),
        'Cloth Mask': parseInt(formData.get('ppeChildren_Cloth Mask') || '0'),
    }

    const ppePregnant = {
        'Surgical Mask': parseInt(formData.get('ppePregnant_Surgical Mask') || '0'),
        'N95': parseInt(formData.get('ppePregnant_N95') || '0'),
        'Carbon Mask': parseInt(formData.get('ppePregnant_Carbon Mask') || '0'),
        'Cloth Mask': parseInt(formData.get('ppePregnant_Cloth Mask') || '0'),
    }

    const ppeElderly = {
        'Surgical Mask': parseInt(formData.get('ppeElderly_Surgical Mask') || '0'),
        'N95': parseInt(formData.get('ppeElderly_N95') || '0'),
        'Carbon Mask': parseInt(formData.get('ppeElderly_Carbon Mask') || '0'),
        'Cloth Mask': parseInt(formData.get('ppeElderly_Cloth Mask') || '0'),
    }

    const ppeBedridden = {
        'Surgical Mask': parseInt(formData.get('ppeBedridden_Surgical Mask') || '0'),
        'N95': parseInt(formData.get('ppeBedridden_N95') || '0'),
        'Carbon Mask': parseInt(formData.get('ppeBedridden_Carbon Mask') || '0'),
        'Cloth Mask': parseInt(formData.get('ppeBedridden_Cloth Mask') || '0'),
    }

    const ppeHeart = {
        'Surgical Mask': parseInt(formData.get('ppeHeart_Surgical Mask') || '0'),
        'N95': parseInt(formData.get('ppeHeart_N95') || '0'),
        'Carbon Mask': parseInt(formData.get('ppeHeart_Carbon Mask') || '0'),
        'Cloth Mask': parseInt(formData.get('ppeHeart_Cloth Mask') || '0'),
    }

    const ppeRespiratory = {
        'Surgical Mask': parseInt(formData.get('ppeRespiratory_Surgical Mask') || '0'),
        'N95': parseInt(formData.get('ppeRespiratory_N95') || '0'),
        'Carbon Mask': parseInt(formData.get('ppeRespiratory_Carbon Mask') || '0'),
        'Cloth Mask': parseInt(formData.get('ppeRespiratory_Cloth Mask') || '0'),
    }

    try {
        await prisma.$transaction(async (tx) => {
            // 1. Bedridden
            await tx.vulnerableData.deleteMany({
                where: { locationId: targetLocationId, recordDate: date, groupType: 'BEDRIDDEN_OP' }
            })
            if (bedriddenCount > 0) {
                await tx.vulnerableData.create({
                    data: { locationId: targetLocationId, recordDate: date, groupType: 'BEDRIDDEN_OP', targetCount: bedriddenCount }
                })
            }

            // 2. Local Admin Support
            const existingSupport = await tx.localAdminSupport.findFirst({
                where: { locationId: targetLocationId, recordDate: date }
            })
            if (existingSupport) {
                await tx.localAdminSupport.update({
                    where: { id: existingSupport.id },
                    data: { dustNetSupport: netsLao }
                })
            } else if (netsLao > 0) {
                await tx.localAdminSupport.create({
                    data: { locationId: targetLocationId, recordDate: date, orgCount: 0, maskSupport: 0, dustNetSupport: netsLao, cleanRoomSupport: 0 }
                })
            }

            // 3. Operation Logs
            await tx.operationLog.deleteMany({
                where: { locationId: targetLocationId, recordDate: date, recordedBy: recordBy }
            })

            const opsToInsert = []
            if (netsGiven > 0) {
                opsToInsert.push({ locationId: targetLocationId, recordDate: date, activityType: 'DUST_NET', amount: netsGiven, targetGroup: 'PATIENTS', recordedBy: recordBy })
            }

            const ppeGroups = [
                { data: ppeGeneral, group: 'GENERAL_PUBLIC' },
                { data: ppeChildren, group: 'SMALL_CHILDREN' },
                { data: ppePregnant, group: 'PREGNANT_WOMEN' },
                { data: ppeElderly, group: 'ELDERLY' },
                { data: ppeBedridden, group: 'BEDRIDDEN' },
                { data: ppeHeart, group: 'HEART_DISEASE' },
                { data: ppeRespiratory, group: 'RESPIRATORY_DISEASE' }
            ]

            ppeGroups.forEach(({ data, group }) => {
                Object.entries(data).forEach(([item, count]) => {
                    if (count > 0) {
                        opsToInsert.push({ 
                            locationId: targetLocationId, 
                            recordDate: date, 
                            activityType: 'PPE', 
                            targetGroup: group, 
                            itemName: item, 
                            amount: count,
                            recordedBy: recordBy
                        })
                    }
                })
            })

            if (opsToInsert.length > 0) {
                await tx.operationLog.createMany({ data: opsToInsert })
            }
        })

        revalidatePath('/operations')
        return { success: true, message: 'บันทึกข้อมูลสำเร็จ' }
    } catch (e) {
        console.error(e)
        return { success: false, message: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล' }
    }
}

export async function getOperationsExportData() {
    const session = await getSession()
    if (!session) return null

    const user = await prisma.user.findUnique({
        where: { id: session.userId },
        select: { role: true, locationId: true, orgName: true, location: { select: { provinceName: true } } }
    })
    if (!user) return null

    let whereClause = { locationId: user.locationId }
    if (user.role === 'ADMIN' || user.role === 'HEALTH_REGION') {
        whereClause = {}
    } else if (user.role === 'SSJ') {
        whereClause = { location: { provinceName: user.location.provinceName } }
    }

    const [operations, localSupport, vulnerables] = await Promise.all([
        prisma.operationLog.findMany({
            where: {
                ...whereClause,
                recordedBy: (user.role === 'PCU' || user.role === 'HOSPITAL' || user.role === 'SSO') 
                    ? user.orgName 
                    : undefined
            },
            include: { location: true },
            orderBy: { recordDate: 'desc' },
        }),
        prisma.localAdminSupport.findMany({
            where: whereClause,
            include: { location: true },
        }),
        prisma.vulnerableData.findMany({
            where: { ...whereClause, groupType: 'BEDRIDDEN_OP' },
            include: { location: true },
        }),
    ])

    const locationIds = [...new Set([
        ...operations.map(o => o.locationId),
        ...localSupport.map(l => l.locationId),
        ...vulnerables.map(v => v.locationId)
    ].filter(Boolean))]

    const usersForMap = await prisma.user.findMany({
        where: { locationId: { in: locationIds } },
        select: { locationId: true, orgName: true }
    })

    const orgNameMap = {}
    usersForMap.forEach(u => {
        if (!orgNameMap[u.locationId]) orgNameMap[u.locationId] = u.orgName
    })

    const processedOperations = operations.map(op => {
        return { 
            ...op, 
            activityType: op.activityType, 
            orgName: op.recordedBy || orgNameMap[op.locationId] || op.location?.districtName || '-' 
        }
    })

    return { operations: processedOperations, localSupport, vulnerables, orgNameMap }
}
