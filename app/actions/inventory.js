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
        { key: 'surgical_mask', label: 'หน้ากาก Surgical Mask (ชิ้น)' },
        { key: 'n95', label: 'หน้ากาก N95 (ชิ้น)' },
        { key: 'carbon_mask', label: 'หน้ากากคาร์บอน (ชิ้น)' },
        { key: 'cloth_mask', label: 'หน้ากากผ้า (ชิ้น)' },
        { key: 'dust_net', label: 'มุ้งสู้ฝุ่น (หลัง)' },
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

// อัปเดตข้อมูลโดยใช้ record ID โดยตรง (สำหรับ modal แก้ไขใน history)
export async function updateInventoryRecords(prevState, formData) {
    const session = await getSession()
    if (!session) return { message: 'Unauthorized', success: false }

    const user = await prisma.user.findUnique({ where: { id: session.userId } })
    if (!user) return { message: 'User not found', success: false }

    // รับ record IDs จาก formData: record_id_{id} = count
    const updates = []
    for (const [key, value] of formData.entries()) {
        if (key.startsWith('record_id_')) {
            const id = parseInt(key.replace('record_id_', ''))
            const count = parseInt(value) || 0
            if (!isNaN(id)) updates.push({ id, count })
        }
    }

    if (updates.length === 0) {
        return { message: 'ไม่มีข้อมูลที่จะแก้ไข', success: false }
    }

    try {
        for (const { id, count } of updates) {
            const record = await prisma.inventoryLog.findUnique({ where: { id } })
            if (!record) continue

            // ตรวจสอบสิทธิ์ (ยกเว้น ADMIN และ HEALTH_REGION)
            if (user.role !== 'ADMIN' && user.role !== 'HEALTH_REGION' && record.locationId !== user.locationId) {
                return { message: 'ไม่มีสิทธิ์แก้ไขข้อมูลของหน่วยงานอื่น', success: false }
            }

            await prisma.inventoryLog.update({
                where: { id },
                data: { stockCount: count }
            })
        }

        revalidatePath('/inventory')
        return { message: 'แก้ไขข้อมูลเรียบร้อยแล้ว', success: true }

    } catch (error) {
        console.error('Error updating inventory records:', error)
        return { message: 'เกิดข้อผิดพลาดในการแก้ไขข้อมูล', success: false }
    }
}

export async function getInventoryHistory() {
    const session = await getSession()
    if (!session) return []

    const user = await prisma.user.findUnique({
        where: { id: session.userId },
        select: { id: true, locationId: true, role: true }
    })

    if (!user) return []

    const where = (user.role === 'ADMIN' || user.role === 'HEALTH_REGION') ? {} : { locationId: user.locationId }

    const data = await prisma.inventoryLog.findMany({
        where,
        orderBy: {
            recordDate: 'desc',
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
                date: dateStr,
                locationId: record.locationId,
                locationName: record.location?.districtName || record.location?.provinceName || '',
                totalItems: 0,
                records: []
            }
        }
        history[key].totalItems += record.stockCount
        history[key].records.push(record)
    })

    return Object.values(history).sort((a, b) => new Date(b.date) - new Date(a.date))
}

export async function deleteInventoryReport(dateStr, targetLocationId) {
    const session = await getSession()
    if (!session) return { success: false, message: 'Unauthorized' }

    const user = await prisma.user.findUnique({
        where: { id: session.userId },
        select: { id: true, locationId: true, role: true }
    })

    if (!user) return { success: false, message: 'User not found' }

    const targetDate = new Date(dateStr)
    const startOfDay = new Date(targetDate)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(targetDate)
    endOfDay.setHours(23, 59, 59, 999)

    // Determine location to delete
    let deleteLocationId = user.locationId

    if (targetLocationId && (user.role === 'ADMIN' || user.role === 'HEALTH_REGION')) {
        deleteLocationId = targetLocationId
    }

    try {
        await prisma.inventoryLog.deleteMany({
            where: {
                locationId: deleteLocationId,
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

export async function getInventoryExportData() {
    const session = await getSession()
    if (!session) {
        return null
    }

    const user = await prisma.user.findUnique({
        where: { id: session.userId },
        select: { role: true, locationId: true }
    })

    if (!user) {
        return null
    }

    let whereClause = {}
    if (user.role === 'ADMIN' || user.role === 'HEALTH_REGION') {
        whereClause = {}
    } else {
        whereClause = { locationId: user.locationId }
    }

    const records = await prisma.inventoryLog.findMany({
        where: whereClause,
        orderBy: { recordDate: 'desc' },
        include: {
            location: true
        }
    })

    return records
}
