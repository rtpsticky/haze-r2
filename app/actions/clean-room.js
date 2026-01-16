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
        select: { id: true, locationId: true, role: true }
    })

    if (!user) return []

    const where = user.role === 'ADMIN' ? {} : { locationId: user.locationId }

    const data = await prisma.cleanRoomReport.findMany({
        where,
        orderBy: {
            recordDate: 'desc'
        },
        include: {
            location: true
        }
    })

    // Group by date and location
    const history = {}

    data.forEach(record => {
        const dateStr = record.recordDate.toISOString().split('T')[0]
        const locationKey = record.locationId
        const key = `${dateStr}-${locationKey}`

        if (!history[key]) {
            history[key] = {
                recordDate: record.recordDate, // Keep as Date object or string? Original returned object with recordDate
                dateStr: dateStr,
                locationId: record.locationId,
                locationName: record.location?.districtName || record.location?.provinceName || '',
                totalPassed: 0,
                totalTarget: 0,
                totalPlaces: 0
            }
        }

        history[key].totalPassed += (record.passedStandard || 0)
        history[key].totalTarget += (record.targetRoomCount || 0)
        history[key].totalPlaces += (record.placeCount || 0)
    })

    return Object.values(history).sort((a, b) => new Date(b.dateStr) - new Date(a.dateStr))
}

export async function deleteCleanRoomReport(dateStr, targetLocationId) {
    const session = await getSession()
    if (!session) {
        return { success: false, message: 'Unauthorized' }
    }

    const user = await prisma.user.findUnique({
        where: { id: session.userId },
        select: { id: true, locationId: true, role: true }
    })

    if (!user) {
        return { success: false, message: 'User not found' }
    }

    try {
        const date = new Date(dateStr)
        date.setHours(0, 0, 0, 0)

        // Determine location to delete
        let deleteLocationId = user.locationId

        if (targetLocationId && user.role === 'ADMIN') {
            deleteLocationId = targetLocationId
        }

        await prisma.cleanRoomReport.deleteMany({
            where: {
                locationId: deleteLocationId,
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
