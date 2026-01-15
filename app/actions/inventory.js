'use server'

import prisma from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export async function getInventoryData(dateStr) {
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

    const data = await prisma.inventoryLog.findMany({
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

export async function saveInventoryData(prevState, formData) {
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

    const items = [
        { key: 'surgical_mask', label: 'หน้ากาก Surgical Mask (ชิ้น) (รายวัน)' },
        { key: 'n95', label: 'หน้ากาก N95 (ชิ้น) (รายวัน)' },
        { key: 'carbon_mask', label: 'หน้ากากคาร์บอน' },
        { key: 'cloth_mask', label: 'หน้ากากผ้า' },
        { key: 'dust_net', label: 'มุ้งสู้ฝุ่น' },
    ]

    try {
        for (const item of items) {
            const countStr = formData.get(item.key)
            const count = parseInt(countStr) || 0

            const existing = await prisma.inventoryLog.findFirst({
                where: {
                    locationId: user.locationId,
                    itemName: item.label,
                    recordDate: recordDate
                }
            })

            if (existing) {
                await prisma.inventoryLog.update({
                    where: { id: existing.id },
                    data: { stockCount: count }
                })
            } else {
                await prisma.inventoryLog.create({
                    data: {
                        itemName: item.label,
                        stockCount: count,
                        recordDate: recordDate,
                        locationId: user.locationId
                    }
                })
            }
        }

        revalidatePath('/inventory')
        return { message: 'บันทึกข้อมูลเรียบร้อยแล้ว', success: true }

    } catch (error) {
        console.error('Error saving inventory data:', error)
        return { message: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล', success: false }
    }
}

export async function getInventoryHistory() {
    const session = await getSession()
    if (!session) return []

    const user = await prisma.user.findUnique({
        where: { id: session.userId },
    })

    if (!user) return []

    const data = await prisma.inventoryLog.findMany({
        where: {
            locationId: user.locationId,
        },
        orderBy: {
            recordDate: 'desc',
        },
    })

    // Group by date
    const history = {}
    data.forEach(record => {
        const dateStr = record.recordDate.toISOString().split('T')[0]
        if (!history[dateStr]) {
            history[dateStr] = {
                date: dateStr,
                totalItems: 0,
                records: []
            }
        }
        // Count distinct items or sum stock? 
        // Let's sum stock count for a rough "total items" metric, or just count records.
        // Summing stock count might be weird if units differ (but here it's mostly 'pieces').
        // Let's just sum stockCount.
        history[dateStr].totalItems += record.stockCount
        history[dateStr].records.push(record)
    })

    return Object.values(history).sort((a, b) => new Date(b.date) - new Date(a.date))
}

export async function deleteInventoryReport(dateStr) {
    const session = await getSession()
    if (!session) return { success: false, message: 'Unauthorized' }

    const user = await prisma.user.findUnique({
        where: { id: session.userId },
    })

    if (!user) return { success: false, message: 'User not found' }

    const targetDate = new Date(dateStr)
    const startOfDay = new Date(targetDate)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(targetDate)
    endOfDay.setHours(23, 59, 59, 999)

    try {
        await prisma.inventoryLog.deleteMany({
            where: {
                locationId: user.locationId,
                recordDate: {
                    gte: startOfDay,
                    lte: endOfDay
                }
            }
        })
        revalidatePath('/inventory')
        return { success: true, message: 'ลบข้อมูลเรียบร้อยแล้ว' }
    } catch (error) {
        console.error('Error deleting inventory data:', error)
        return { success: false, message: 'เกิดข้อผิดพลาดในการลบข้อมูล' }
    }
}
