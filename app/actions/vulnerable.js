'use server'

import prisma from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export async function getVulnerableData(dateStr, targetLocationId = null) {
    const session = await getSession()
    if (!session) return []

    const user = await prisma.user.findUnique({
        where: { id: session.userId },
    })

    if (!user || !['SSJ', 'SSO', 'ADMIN', 'HEALTH_REGION', 'HOSPITAL', 'RPS', 'PCU'].includes(user.role)) return []

    const targetDate = new Date(dateStr)
    const startOfDay = new Date(targetDate)
    startOfDay.setHours(0, 0, 0, 0)

    const endOfDay = new Date(targetDate)
    endOfDay.setHours(23, 59, 59, 999)

    // Determine target location: use user's location or the one provided (if authorized)
    let locationId = user.locationId
    if (targetLocationId && (user.role === 'ADMIN' || user.role === 'HEALTH_REGION' || user.role === 'SSJ')) {
        locationId = parseInt(targetLocationId)
        
        // Security check for SSJ
        if (user.role === 'SSJ') {
            const targetLoc = await prisma.location.findUnique({ where: { id: locationId } })
            const userLoc = await prisma.location.findUnique({ where: { id: user.locationId } })
            if (!targetLoc || targetLoc.provinceName !== userLoc.provinceName) {
                return [] // Forbidden access to other provinces
            }
        }
    }

    // Check ByPass table first
    const bypassData = await prisma.vulnerableDataByPass.findMany({
        where: {
            locationId: locationId,
            recordDate: {
                gte: startOfDay,
                lte: endOfDay
            }
        }
    })

    if (bypassData.length > 0) return bypassData

    const data = await prisma.vulnerableData.findMany({
        where: {
            locationId: locationId,
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

    // Only authorized roles can save this data
    if (!['SSJ', 'SSO', 'ADMIN', 'HOSPITAL', 'RPS', 'PCU'].includes(user.role)) {
        return { message: 'ไม่มีสิทธิ์ในการบันทึกข้อมูล', success: false }
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
        const isByPass = user.role === 'SSJ' || user.role === 'ADMIN'
        const targetTable = isByPass ? prisma.vulnerableDataByPass : prisma.vulnerableData
        
        let targetLocationId = user.locationId
        const formLocationId = formData.get('locationId')
        
        if (isByPass && formLocationId) {
            targetLocationId = parseInt(formLocationId)
            
            // Security check for SSJ: must be in same province
            if (user.role === 'SSJ') {
                const targetLoc = await prisma.location.findUnique({ where: { id: targetLocationId } })
                const userLoc = await prisma.location.findUnique({ where: { id: user.locationId } })
                if (!targetLoc || targetLoc.provinceName !== userLoc.provinceName) {
                    return { message: 'ไม่มีสิทธิ์จัดการข้อมูลข้ามจังหวัด', success: false }
                }
            }
        }

        for (const group of groups) {
            const countStr = formData.get(group.key)
            const count = parseInt(countStr) || 0

            // Check if record exists for this day/location/group
            const existing = await targetTable.findFirst({
                where: {
                    locationId: targetLocationId,
                    groupType: group.label,
                    recordDate: recordDate
                }
            })

            if (existing) {
                await targetTable.update({
                    where: { id: existing.id },
                    data: { targetCount: count }
                })
            } else {
                await targetTable.create({
                    data: {
                        groupType: group.label,
                        targetCount: count,
                        recordDate: recordDate,
                        locationId: targetLocationId
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

// อัปเดตข้อมูลโดยใช้ record ID โดยตรง (สำหรับ modal แก้ไขใน history)
export async function updateVulnerableRecords(prevState, formData) {
    const session = await getSession()
    if (!session) return { message: 'Unauthorized', success: false }

    const user = await prisma.user.findUnique({ where: { id: session.userId } })
    if (!user) return { message: 'User not found', success: false }

    if (!['SSJ', 'SSO', 'ADMIN', 'HOSPITAL', 'RPS', 'PCU'].includes(user.role)) {
        return { message: 'ไม่มีสิทธิ์ในการแก้ไขข้อมูล', success: false }
    }

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
            // Check both tables
            let record = await prisma.vulnerableData.findUnique({ where: { id } })
            let isByPass = false
            
            if (!record) {
                record = await prisma.vulnerableDataByPass.findUnique({ where: { id } })
                isByPass = true
            }
            
            if (!record) continue

            // ตรวจสอบสิทธิ์
            if (user.role !== 'ADMIN' && user.role !== 'HEALTH_REGION') {
                if (user.role === 'SSJ') {
                    // SSJ check: province must match
                    const targetLoc = await prisma.location.findUnique({ where: { id: record.locationId } })
                    const userLoc = await prisma.location.findUnique({ where: { id: user.locationId } })
                    if (!targetLoc || targetLoc.provinceName !== userLoc.provinceName) {
                        return { message: 'ไม่มีสิทธิ์แก้ไขข้อมูลของจังหวัดอื่น', success: false }
                    }
                } else if (record.locationId !== user.locationId) {
                    return { message: 'ไม่มีสิทธิ์แก้ไขข้อมูลของหน่วยงานอื่น', success: false }
                }
            }

            const targetTable = isByPass ? prisma.vulnerableDataByPass : prisma.vulnerableData
            await targetTable.update({
                where: { id },
                data: { targetCount: count }
            })
        }

        revalidatePath('/vulnerable')
        return { message: 'แก้ไขข้อมูลเรียบร้อยแล้ว', success: true }

    } catch (error) {
        console.error('Error updating vulnerable records:', error)
        return { message: 'เกิดข้อผิดพลาดในการแก้ไขข้อมูล', success: false }
    }
}

export async function getVulnerableHistory() {
    const session = await getSession()
    if (!session) return []

    const user = await prisma.user.findUnique({
        where: { id: session.userId },
        select: { id: true, locationId: true, role: true, location: { select: { provinceName: true } } }
    })

    if (!user || !['SSJ', 'SSO', 'ADMIN', 'HEALTH_REGION', 'HOSPITAL', 'RPS', 'PCU'].includes(user.role)) return []

    let where = { locationId: user.locationId }
    if (user.role === 'ADMIN' || user.role === 'HEALTH_REGION') {
        where = {}
    } else if (user.role === 'SSJ') {
        where = { location: { provinceName: user.location.provinceName } }
    }

    const [normalData, bypassData] = await Promise.all([
        prisma.vulnerableData.findMany({
            where,
            orderBy: { recordDate: 'desc' },
            include: { location: true }
        }),
        prisma.vulnerableDataByPass.findMany({
            where,
            orderBy: { recordDate: 'desc' },
            include: { location: true }
        })
    ])

    // Group ByPass data first for easy lookup
    const bypassMap = new Map()
    bypassData.forEach(r => {
        const key = `${r.recordDate.toISOString().split('T')[0]}-${r.locationId}-${r.groupType}`
        bypassMap.set(key, r)
    })

    // Combine data: use bypass if exists for (date, location, groupType)
    const combinedData = [...bypassData]
    normalData.forEach(r => {
        const key = `${r.recordDate.toISOString().split('T')[0]}-${r.locationId}-${r.groupType}`
        if (!bypassMap.has(key)) {
            combinedData.push(r)
        }
    })

    // Group by date and location
    const history = {}
    combinedData.forEach(record => {
        const dateStr = record.recordDate.toISOString().split('T')[0]
        const locationKey = record.locationId
        const key = `${dateStr}-${locationKey}`

        if (!history[key]) {
            history[key] = {
                date: dateStr,
                locationId: record.locationId,
                locationName: record.location?.districtName || record.location?.provinceName || '',
                totalCount: 0,
                records: [],
                isByPass: bypassData.some(b => b.locationId === record.locationId && b.recordDate.toISOString().split('T')[0] === dateStr)
            }
        }
        history[key].totalCount += record.targetCount
        history[key].records.push(record)
    })

    return Object.values(history).sort((a, b) => new Date(b.date) - new Date(a.date))
}

export async function deleteVulnerableReport(dateStr, targetLocationId) {
    const session = await getSession()
    if (!session) return { success: false, message: 'Unauthorized' }

    const user = await prisma.user.findUnique({
        where: { id: session.userId },
        select: { id: true, locationId: true, role: true }
    })

    if (!user || !['SSJ', 'SSO', 'ADMIN', 'HEALTH_REGION', 'HOSPITAL', 'RPS', 'PCU'].includes(user.role)) {
        return { success: false, message: 'Forbidden: Only authorized roles can delete reports' }
    }

    const targetDate = new Date(dateStr)
    const startOfDay = new Date(targetDate)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(targetDate)
    endOfDay.setHours(23, 59, 59, 999)

    // Determine location to delete
    let deleteLocationId = user.locationId

    if (targetLocationId && (user.role === 'ADMIN' || user.role === 'HEALTH_REGION' || user.role === 'SSJ')) {
        deleteLocationId = targetLocationId
        
        // Security check for SSJ
        if (user.role === 'SSJ') {
            const targetLoc = await prisma.location.findUnique({ where: { id: deleteLocationId } })
            const userLoc = await prisma.location.findUnique({ where: { id: user.locationId } })
            if (!targetLoc || targetLoc.provinceName !== userLoc.provinceName) {
                return { success: false, message: 'ไม่มีสิทธิ์ลบข้อมูลข้ามจังหวัด' }
            }
        }
    }

    try {
        await Promise.all([
            prisma.vulnerableData.deleteMany({
                where: {
                    locationId: deleteLocationId,
                    recordDate: {
                        gte: startOfDay,
                        lte: endOfDay
                    }
                }
            }),
            prisma.vulnerableDataByPass.deleteMany({
                where: {
                    locationId: deleteLocationId,
                    recordDate: {
                        gte: startOfDay,
                        lte: endOfDay
                    }
                }
            })
        ])
        revalidatePath('/vulnerable')
        return { success: true, message: 'ลบข้อมูลเรียบร้อยแล้ว' }
    } catch (error) {
        console.error('Error deleting vulnerable data:', error)
        return { success: false, message: 'เกิดข้อผิดพลาดในการลบข้อมูล' }
    }
}

export async function getVulnerableExportData() {
    const session = await getSession()
    if (!session) {
        return null
    }

    const user = await prisma.user.findUnique({
        where: { id: session.userId },
        select: { role: true, locationId: true, location: { select: { provinceName: true } } }
    })

    if (!user || !['SSJ', 'SSO', 'ADMIN', 'HEALTH_REGION', 'HOSPITAL', 'RPS', 'PCU'].includes(user.role)) {
        return null
    }

    let whereClause = { locationId: user.locationId }
    if (user.role === 'ADMIN' || user.role === 'HEALTH_REGION') {
        whereClause = {}
    } else if (user.role === 'SSJ') {
        whereClause = { location: { provinceName: user.location.provinceName } }
    }

    const [normalRecords, bypassRecords] = await Promise.all([
        prisma.vulnerableData.findMany({
            where: whereClause,
            orderBy: { recordDate: 'desc' },
            include: { location: true }
        }),
        prisma.vulnerableDataByPass.findMany({
            where: whereClause,
            orderBy: { recordDate: 'desc' },
            include: { location: true }
        })
    ])

    const bypassMap = new Map()
    bypassRecords.forEach(r => {
        const key = `${r.recordDate.toISOString().split('T')[0]}-${r.locationId}-${r.groupType}`
        bypassMap.set(key, r)
    })

    const records = [...bypassRecords]
    normalRecords.forEach(r => {
        const key = `${r.recordDate.toISOString().split('T')[0]}-${r.locationId}-${r.groupType}`
        if (!bypassMap.has(key)) {
            records.push(r)
        }
    })

    const locationIds = [...new Set(records.map(r => r.locationId).filter(Boolean))]
    
    let users = []
    if (locationIds.length > 0) {
        users = await prisma.user.findMany({
            where: {
                locationId: { in: locationIds }
            },
            select: { locationId: true, orgName: true, role: true }
        })
    }

    const locToOrgMap = {}
    users.forEach(u => {
        // Prioritize SSO or PCU/HOSPITAL if there are multiple
        if (!locToOrgMap[u.locationId]) {
            locToOrgMap[u.locationId] = u.orgName
        }
    })

    return records.map(r => ({
        ...r,
        orgName: locToOrgMap[r.locationId] || '-'
    }))
}
