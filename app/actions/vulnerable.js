'use server'

import prisma from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export async function getVulnerableData(dateStr) {
    const session = await getSession()
    if (!session) return []

    const user = await prisma.user.findUnique({
        where: { id: session.userId },
    })

    if (!user) return []

    const targetDate = new Date(dateStr)
    // Create Date range for the whole day to be safe, or just match the exact date stored if we store specific time.
    // Schema says `recordDate DateTime`. Ideally we store YYYY-MM-DD 00:00:00.

    // For querying, let's look for records on that specific calendar date.
    // Since prisma DateTime is full timestamp, we need to compare range start/end of day.
    const startOfDay = new Date(targetDate)
    startOfDay.setHours(0, 0, 0, 0)

    const endOfDay = new Date(targetDate)
    endOfDay.setHours(23, 59, 59, 999)

    const data = await prisma.vulnerableData.findMany({
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

export async function saveVulnerableData(prevState, formData) {
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

    // Normalize date to 00:00:00 for consistency in querying "by date"
    recordDate.setHours(0, 0, 0, 0)

    const groups = [
        { key: 'child', label: 'กลุ่มเด็กเล็ก (0-5 ปี)' },
        { key: 'pregnant', label: 'กลุ่มหญิงตั้งครรภ์' },
        { key: 'elderly', label: 'กลุ่มผู้สูงอายุ' },
        { key: 'bedridden', label: 'กลุ่มติดเตียง' },
        { key: 'heart', label: 'กลุ่มผู้ที่มีโรคหัวใจ' },
        { key: 'respiratory', label: 'กลุ่มผู้ที่มีโรคระบบทางเดินหายใจ' },
    ]

    try {
        for (const group of groups) {
            const countStr = formData.get(group.key)
            const count = parseInt(countStr) || 0

            // Check if record exists for this day/location/group
            const existing = await prisma.vulnerableData.findFirst({
                where: {
                    locationId: user.locationId,
                    groupType: group.label,
                    recordDate: recordDate
                }
            })

            if (existing) {
                await prisma.vulnerableData.update({
                    where: { id: existing.id },
                    data: { targetCount: count }
                })
            } else {
                await prisma.vulnerableData.create({
                    data: {
                        groupType: group.label,
                        targetCount: count,
                        recordDate: recordDate,
                        locationId: user.locationId
                    }
                })
            }
        }

        revalidatePath('/vulnerable')
        return { message: 'บันทึกข้อมูลเรียบร้อยแล้ว', success: true }

    } catch (error) {
        console.error('Error saving vulnerable data:', error)
        return { message: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล', success: false }
    }
}
