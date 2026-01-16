'use server'

import prisma from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export async function getActiveCareData(dateString, requestedLocationId = null) {
    const session = await getSession()
    if (!session) return { success: false, error: 'Unauthorized' }

    // If a specific location is requested, use it (after verifying access if needed, 
    // but for now we trust the ID or rely on the fact that any logged-in user can view any location)
    // If NOT requested, default to user's assigned location.

    const user = await prisma.user.findUnique({
        where: { id: session.userId },
        select: { locationId: true, role: true }
    })

    let locationIdToUse = requestedLocationId

    if (!locationIdToUse) {
        if (user) locationIdToUse = user.locationId
    } else {
        // Enforce permission for requested location
        if (user?.role !== 'ADMIN' && parseInt(locationIdToUse) !== user.locationId) {
            return { success: false, error: 'Unauthorized location access' }
        }
    }

    if (!locationIdToUse) return { success: false, error: 'Location not determined' }

    // Ensure it's an integer
    const locationId = parseInt(locationIdToUse)

    const date = new Date(dateString)

    try {
        const [activeCares, adminSupport, location] = await Promise.all([
            prisma.activeCareLog.findMany({
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
            prisma.location.findUnique({
                where: { id: locationId }
            })
        ])

        return {
            success: true,
            data: {
                activeCares,
                adminSupport,
                location
            }
        }
    } catch (error) {
        console.error('Error fetching active care data:', error)
        return { success: false, error: 'Failed to fetch data' }
    }
}

export async function getActiveCareHistory(locationId) {
    const session = await getSession()
    if (!session) return { success: false, error: 'Unauthorized' }

    if (!locationId) return { success: true, data: [] }

    const user = await prisma.user.findUnique({
        where: { id: session.userId },
        select: { locationId: true, role: true }
    })
    if (!user) return { success: false, error: 'User not found' }

    const id = parseInt(locationId)

    // Permission Check
    if (user.role !== 'ADMIN' && id !== user.locationId) {
        return { success: false, error: 'Unauthorized location access' }
    }

    // Fetch distinct dates from active care logs and local admin support
    const [activeDates, supportDates] = await Promise.all([
        prisma.activeCareLog.findMany({
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
        ...activeDates.map(d => d.recordDate.toISOString().split('T')[0]),
        ...supportDates.map(d => d.recordDate.toISOString().split('T')[0])
    ])

    const sortedDates = Array.from(allDates).sort((a, b) => new Date(b) - new Date(a))

    return { success: true, data: sortedDates }
}

export async function deleteActiveCareData(dateString, locationId) {
    const session = await getSession()
    if (!session) return { success: false, message: 'Unauthorized' }

    if (!dateString || !locationId) return { success: false, message: 'Invalid arguments' }

    const user = await prisma.user.findUnique({
        where: { id: session.userId },
        select: { locationId: true, role: true }
    })
    if (!user) return { success: false, message: 'User not found' }

    const date = new Date(dateString)
    const id = parseInt(locationId)

    // Permission Check
    if (user.role !== 'ADMIN' && id !== user.locationId) {
        return { success: false, message: 'Unauthorized location delete' }
    }

    try {
        await prisma.$transaction(async (tx) => {
            await tx.activeCareLog.deleteMany({
                where: { locationId: id, recordDate: date }
            })
            await tx.localAdminSupport.deleteMany({
                where: { locationId: id, recordDate: date }
            })
        })

        revalidatePath('/active-care')
        return { success: true, message: 'ลบข้อมูลสำเร็จ' }
    } catch (error) {
        console.error('Delete error:', error)
        return { success: false, message: 'เกิดข้อผิดพลาดในการลบข้อมูล' }
    }
}

export async function saveActiveCareData(prevState, formData) {
    const session = await getSession()
    if (!session) return { success: false, message: 'Unauthorized' }

    const locationId = parseInt(formData.get('locationId'))
    if (!locationId) return { success: false, message: 'Location ID missing' }

    const dateString = formData.get('date')
    if (!dateString) return { success: false, message: 'กรุณาระบุวันที่' }
    const date = new Date(dateString)

    // Data Extraction
    // 1. Proactive Care Logs
    const activities = [
        "การสอบสวนโรค",
        "การดูแลสุขภาพจิต",
        "การรักษาพยาบาลเบื้องต้น"
    ]

    // 2. Local Admin Support
    const orgCount = parseInt(formData.get('orgCount') || '0')
    const maskSupport = parseInt(formData.get('maskSupport') || '0')
    const dustNetSupport = parseInt(formData.get('dustNetSupport') || '0')
    const cleanRoomSupport = parseInt(formData.get('cleanRoomSupport') || '0')

    try {
        await prisma.$transaction(async (tx) => {
            // 1. Update ActiveCareLog
            // Delete existing logic for this date first (simplest way to handle updates)
            await tx.activeCareLog.deleteMany({
                where: {
                    locationId: locationId,
                    recordDate: date,
                    activity: { in: activities }
                }
            })

            const careLogsToInsert = []
            for (const act of activities) {
                const households = parseInt(formData.get(`households_${act}`) || '0')
                const people = parseInt(formData.get(`people_${act}`) || '0')
                const riskGroups = parseInt(formData.get(`riskGroups_${act}`) || '0')

                if (households > 0 || people > 0 || riskGroups > 0) {
                    careLogsToInsert.push({
                        locationId: locationId,
                        recordDate: date,
                        activity: act,
                        households,
                        people,
                        riskGroups
                    })
                }
            }

            if (careLogsToInsert.length > 0) {
                await tx.activeCareLog.createMany({
                    data: careLogsToInsert
                })
            }

            // 2. Update LocalAdminSupport
            const existingSupport = await tx.localAdminSupport.findFirst({
                where: { locationId: locationId, recordDate: date }
            })

            // If we have data to save OR existing data to update
            const hasSupportData = orgCount > 0 || maskSupport > 0 || dustNetSupport > 0 || cleanRoomSupport > 0

            if (existingSupport) {
                // If we have data, update. If not, and we are updating other things, maybe we should keep it?
                // Or if all zeros, maybe we want to zero it out? Yes, update with new values (even if 0).
                await tx.localAdminSupport.update({
                    where: { id: existingSupport.id },
                    data: {
                        orgCount,
                        maskSupport,
                        dustNetSupport,
                        cleanRoomSupport
                    }
                })
            } else if (hasSupportData) {
                await tx.localAdminSupport.create({
                    data: {
                        locationId: locationId,
                        recordDate: date,
                        orgCount,
                        maskSupport,
                        dustNetSupport,
                        cleanRoomSupport
                    }
                })
            }
        })

        revalidatePath('/active-care')
        return { success: true, message: 'บันทึกข้อมูลสำเร็จ' }
    } catch (error) {
        console.error('Error saving active care data:', error)
        return { success: false, message: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล' }
    }
}
