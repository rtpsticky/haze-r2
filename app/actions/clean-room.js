'use server'

import prisma from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export async function getCleanRoomData(dateStr) {
    const session = await getSession()
    if (!session) return []

    const user = await prisma.user.findUnique({
        where: { id: session.userId },
    })

    if (!user) return []

    const targetDate = new Date(dateStr)
    const startOfDay = new Date(targetDate)
    startOfDay.setHours(0, 0, 0, 0)

    const endOfDay = new Date(targetDate)
    endOfDay.setHours(23, 59, 59, 999)

    const data = await prisma.cleanRoomReport.findMany({
        where: {
            locationId: user.locationId,
            recordDate: {
                gte: startOfDay,
                lte: endOfDay
            }
        }
    })

    return data
}

export async function saveCleanRoomData(prevState, formData) {
    const session = await getSession()
    if (!session) {
        return { message: 'Unauthorized', success: false }
    }

    const user = await prisma.user.findUnique({
        where: { id: session.userId },
    })

    if (!user) {
        return { message: 'User not found', success: false }
    }

    const recordDate = new Date(formData.get('recordDate'))
    recordDate.setHours(0, 0, 0, 0)

    const placeTypes = [
        'โรงพยาบาลศูนย์',
        'โรงพยาบาลทั่วไป',
        'โรงพยาบาลชุมชน',
        'โรงพยาบาลส่งเสริมสุขภาพตำบล',
        'โรงพยาบาลเอกชน',
        'โรงพยาบาลสังกัดกระทรวงกลาโหม',
        'โรงพยาบาลมหาวิทยาลัย',
        'สสจ./สสอ.',
        'หน่วยงานภาครัฐ (อบจ/อบต./สนง.ต่างๆ)',
        'ศูนย์ดูแลผู้สูงอายุ',
    ]

    try {
        for (const placeType of placeTypes) {
            const placeCount = parseInt(formData.get(`${placeType}_placeCount`)) || 0
            const targetRoomCount = parseInt(formData.get(`${placeType}_targetRoomCount`)) || 0
            const passedStandard = parseInt(formData.get(`${placeType}_passedStandard`)) || 0
            const standard1Count = parseInt(formData.get(`${placeType}_standard1Count`)) || 0
            const standard2Count = parseInt(formData.get(`${placeType}_standard2Count`)) || 0
            const standard3Count = parseInt(formData.get(`${placeType}_standard3Count`)) || 0
            const serviceUserCount = parseInt(formData.get(`${placeType}_serviceUserCount`)) || 0

            const existing = await prisma.cleanRoomReport.findFirst({
                where: {
                    locationId: user.locationId,
                    placeType: placeType,
                    recordDate: recordDate
                }
            })

            const data = {
                placeType,
                placeCount,
                targetRoomCount,
                passedStandard,
                standard1Count,
                standard2Count,
                standard3Count,
                serviceUserCount,
                recordDate,
                locationId: user.locationId
            }

            if (existing) {
                await prisma.cleanRoomReport.update({
                    where: { id: existing.id },
                    data: {
                        placeCount,
                        targetRoomCount,
                        passedStandard,
                        standard1Count,
                        standard2Count,
                        standard3Count,
                        serviceUserCount
                    }
                })
            } else {
                await prisma.cleanRoomReport.create({
                    data: data
                })
            }
        }

        revalidatePath('/clean-room')
        return { message: 'บันทึกข้อมูลเรียบร้อยแล้ว', success: true }

    } catch (error) {
        console.error('Error saving clean room data:', error)
        return { message: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล', success: false }
    }
}

export async function getCleanRoomHistory() {
    const session = await getSession()
    if (!session) return []

    const user = await prisma.user.findUnique({
        where: { id: session.userId },
    })

    if (!user) return []

    const history = await prisma.cleanRoomReport.groupBy({
        by: ['recordDate'],
        where: { locationId: user.locationId },
        _sum: {
            passedStandard: true,
            targetRoomCount: true,
            placeCount: true
        },
        orderBy: {
            recordDate: 'desc'
        }
    })

    return history.map(item => ({
        recordDate: item.recordDate,
        totalPassed: item._sum.passedStandard || 0,
        totalTarget: item._sum.targetRoomCount || 0,
        totalPlaces: item._sum.placeCount || 0
    }))
}

export async function deleteCleanRoomReport(dateStr) {
    const session = await getSession()
    if (!session) {
        return { success: false, message: 'Unauthorized' }
    }

    const user = await prisma.user.findUnique({
        where: { id: session.userId },
    })

    if (!user) {
        return { success: false, message: 'User not found' }
    }

    try {
        const targetDate = new Date(dateStr)
        // Ensure assuming midnight if encoded in dateStr, but safer to query range or ensure exact match logic matches save
        // The save logic sets hours to 0,0,0,0.
        // If dateStr is "YYYY-MM-DD", `new Date(dateStr)` treats it as UTC usually?
        // Wait, `new Date("2023-01-01")` is UTC. `new Date(2023, 0, 1)` is local.
        // In `saveCleanRoomData`: `const recordDate = new Date(formData.get('recordDate'))` (input type=date returns YYYY-MM-DD)
        // `recordDate.setHours(0, 0, 0, 0)` -> This sets it to local midnight.

        // So here:
        const date = new Date(dateStr)
        date.setHours(0, 0, 0, 0) // Should match the saved format if running in same timezone env.

        // To be safe against timezone issues, maybe use a range?
        // But `save` sets it to specific timestamp.
        // Let's try matching with range covering the whole day just to be safe, or just exact match if we trust the object.
        // Prisma `DateTime` is UTC.
        // If `save` uses `setHours(0,0,0,0)` in system time, then saves to DB (converted to UTC).
        // Let's just use the exact same logic as `save` for constructing the date object.

        await prisma.cleanRoomReport.deleteMany({
            where: {
                locationId: user.locationId,
                recordDate: date
            }
        })

        revalidatePath('/clean-room')
        return { success: true }
    } catch (error) {
        console.error('Error deleting clean room report:', error)
        return { success: false, message: 'Failed to delete report' }
    }
}
