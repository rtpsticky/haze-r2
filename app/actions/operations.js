'use server'

import prisma from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export async function getOperationData(dateString, requestedLocationId) {
    const session = await getSession()
    if (!session) return { success: false, error: 'Unauthorized' }

    let locationId
    let location

    if (requestedLocationId) {
        locationId = parseInt(requestedLocationId)
        location = await prisma.location.findUnique({ where: { id: locationId } })
        if (!location) return { success: false, error: 'Location not found' }
    } else {
        const user = await prisma.user.findUnique({
            where: { id: session.userId },
            include: { location: true }
        })
        if (!user) return { success: false, error: 'User not found' }
        locationId = user.locationId
        location = user.location
    }

    const date = new Date(dateString)

    // Fetch Data
    const [operations, localSupport, vulnerables] = await Promise.all([
        prisma.operationLog.findMany({
            where: {
                locationId: locationId,
                recordDate: date
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
            }
        }
    })

    return {
        success: true,
        data: {
            operations,
            localSupport,
            vulnerables,
            location: location,
            accumulated
        }
    }

}

export async function getOperationHistory(locationId) {
    const session = await getSession()
    if (!session) return { success: false, error: 'Unauthorized' }

    if (!locationId) return { success: true, data: [] }

    const id = parseInt(locationId)

    // Fetch distinct dates from all relevant tables
    const [opsDates, vulnDates, supportDates] = await Promise.all([
        prisma.operationLog.findMany({
            where: { locationId: id },
            select: { recordDate: true },
            distinct: ['recordDate']
        }),
        prisma.vulnerableData.findMany({
            where: { locationId: id },
            select: { recordDate: true },
            distinct: ['recordDate']
        }),
        prisma.localAdminSupport.findMany({
            where: { locationId: id },
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

    const date = new Date(dateString)
    const id = parseInt(locationId)

    try {
        await prisma.$transaction(async (tx) => {
            await tx.operationLog.deleteMany({
                where: { locationId: id, recordDate: date }
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

    let targetLocationId = user.locationId
    const submittedLocationId = formData.get('locationId')
    if (submittedLocationId) {
        targetLocationId = parseInt(submittedLocationId)
    }

    if (!user) return { success: false, message: 'User not found' }

    const dateString = formData.get('date')
    if (!dateString) return { success: false, message: 'กรุณาระบุวันที่' }

    const date = new Date(dateString)

    // Data Extraction
    // 1. Bedridden Patients (VulnerableData)
    const bedriddenCount = parseInt(formData.get('bedriddenCount') || '0')

    // 2. Nets Given (OperationLog)
    const netsGiven = parseInt(formData.get('netsGiven') || '0')

    // 3. Nets from LAO (LocalAdminSupport)
    const netsLao = parseInt(formData.get('netsLao') || '0')

    // 4. PPE General
    const ppeGeneral = {
        'Surgical Mask': parseInt(formData.get('ppeGeneral_Surgical Mask') || '0'),
        'N95': parseInt(formData.get('ppeGeneral_N95') || '0'),
        'Carbon Mask': parseInt(formData.get('ppeGeneral_Carbon Mask') || '0'),
        'Cloth Mask': parseInt(formData.get('ppeGeneral_Cloth Mask') || '0'),
    }

    // 5. PPE Children
    const ppeChildren = {
        'Surgical Mask': parseInt(formData.get('ppeChildren_Surgical Mask') || '0'),
        'N95': parseInt(formData.get('ppeChildren_N95') || '0'),
        'Carbon Mask': parseInt(formData.get('ppeChildren_Carbon Mask') || '0'),
        'Cloth Mask': parseInt(formData.get('ppeChildren_Cloth Mask') || '0'),
    }

    // 6. PPE Pregnant
    const ppePregnant = {
        'Surgical Mask': parseInt(formData.get('ppePregnant_Surgical Mask') || '0'),
        'N95': parseInt(formData.get('ppePregnant_N95') || '0'),
        'Carbon Mask': parseInt(formData.get('ppePregnant_Carbon Mask') || '0'),
        'Cloth Mask': parseInt(formData.get('ppePregnant_Cloth Mask') || '0'),
    }

    try {
        await prisma.$transaction(async (tx) => {
            // 1. Update VulnerableData (Bedridden)
            // Clean up existing focused record for Bedridden on that day to avoid dupes if logic changes
            // But since table is generic, assuming only one 'BEDRIDDEN' per day per location
            await tx.vulnerableData.deleteMany({
                where: {
                    locationId: targetLocationId,
                    recordDate: date,
                    groupType: 'BEDRIDDEN_OP' // Special tag or just 'ติดเตียง'
                }
            })
            if (bedriddenCount > 0) {
                await tx.vulnerableData.create({
                    data: {
                        locationId: targetLocationId,
                        recordDate: date,
                        groupType: 'BEDRIDDEN_OP',
                        targetCount: bedriddenCount
                    }
                })
            }

            // 2. Update LocalAdminSupport (Nets from LAO)
            // Upsert doesn't work well without unique constraint on (location, date). 
            // So we check first or delete-create.
            const existingSupport = await tx.localAdminSupport.findFirst({
                where: { locationId: targetLocationId, recordDate: date }
            })
            if (existingSupport) {
                await tx.localAdminSupport.update({
                    where: { id: existingSupport.id },
                    data: { dustNetSupport: netsLao }
                })
            } else if (netsLao > 0) { // Only create if data exists? Or create 0?
                await tx.localAdminSupport.create({
                    data: {
                        locationId: targetLocationId,
                        recordDate: date,
                        orgCount: 0, // Default or need input? Form doesn't have it.
                        maskSupport: 0,
                        dustNetSupport: netsLao,
                        cleanRoomSupport: 0
                    }
                })
            }

            // 3. Operation Logs (Nets Given + PPE)
            // Delete existing for this date
            await tx.operationLog.deleteMany({
                where: {
                    locationId: targetLocationId,
                    recordDate: date,
                    // activityType: { in: ['DUST_NET', 'PPE'] } // Optional safety
                }
            })

            // Operations - Data to insert
            const opsToInsert = []

            // Nets Given
            if (netsGiven > 0) {
                opsToInsert.push({
                    locationId: targetLocationId,
                    recordDate: date,
                    activityType: 'DUST_NET',
                    amount: netsGiven,
                    targetGroup: 'PATIENTS'
                })
            }

            // PPE General
            for (const [item, count] of Object.entries(ppeGeneral)) {
                if (count > 0) {
                    opsToInsert.push({
                        locationId: targetLocationId,
                        recordDate: date,
                        activityType: 'PPE',
                        targetGroup: 'GENERAL_PUBLIC',
                        itemName: item,
                        amount: count
                    })
                }
            }

            // PPE Children
            for (const [item, count] of Object.entries(ppeChildren)) {
                if (count > 0) {
                    opsToInsert.push({
                        locationId: targetLocationId,
                        recordDate: date,
                        activityType: 'PPE',
                        targetGroup: 'SMALL_CHILDREN',
                        itemName: item,
                        amount: count
                    })
                }
            }

            // PPE Pregnant
            for (const [item, count] of Object.entries(ppePregnant)) {
                if (count > 0) {
                    opsToInsert.push({
                        locationId: targetLocationId,
                        recordDate: date,
                        activityType: 'PPE',
                        targetGroup: 'PREGNANT_WOMEN',
                        itemName: item,
                        amount: count
                    })
                }
            }

            if (opsToInsert.length > 0) {
                await tx.operationLog.createMany({
                    data: opsToInsert
                })
            }
        })

        revalidatePath('/operations')
        return { success: true, message: 'บันทึกข้อมูลสำเร็จ' }

    } catch (e) {
        console.error(e)
        return { success: false, message: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล' }
    }
}
