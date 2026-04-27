'use server'

import prisma from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export async function getActiveCareData(dateString, requestedLocationId = null) {
    const session = await getSession()
    if (!session) return { success: false, error: 'Unauthorized' }

    const user = await prisma.user.findUnique({
        where: { id: session.userId },
        select: { locationId: true, role: true, orgName: true }
    })

    let locationIdToUse = requestedLocationId

    if (!locationIdToUse) {
        if (user) locationIdToUse = user.locationId
    } else {
        if (user?.role !== 'ADMIN' && user?.role !== 'HEALTH_REGION' && parseInt(locationIdToUse) !== user.locationId) {
            return { success: false, error: 'Unauthorized location access' }
        }
    }

    if (!locationIdToUse) return { success: false, error: 'Location not determined' }
    const locationId = parseInt(locationIdToUse)
    const date = new Date(dateString)

    try {
        const [activeCares, adminSupport, location] = await Promise.all([
            prisma.activeCareLog.findMany({
                where: {
                    locationId: locationId,
                    recordDate: date,
                    // Filter by organization for isolation
                    recordedBy: (user.role === 'PCU' || user.role === 'HOSPITAL') 
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
            prisma.location.findUnique({
                where: { id: locationId }
            })
        ])

        const processedActiveCares = activeCares.map(care => ({
            ...care,
            activity: care.activity
        }))

        return {
            success: true,
            data: {
                activeCares: processedActiveCares,
                adminSupport,
                location
            }
        }
    } catch (error) {
        console.error('Error fetching active care data:', error)
        return { success: false, error: 'Failed to fetch data' }
    }
}

export async function getActiveCareHistory(locationId = null) {
    const session = await getSession()
    if (!session) return { success: false, error: 'Unauthorized' }

    const user = await prisma.user.findUnique({
        where: { id: session.userId },
        select: { 
            locationId: true, 
            role: true, 
            orgName: true, 
            location: { 
                select: { 
                    provinceName: true, 
                    districtName: true 
                } 
            } 
        }
    })
    if (!user) return { success: false, error: 'User not found' }

    let where = {}
    if (locationId) {
        const id = parseInt(locationId)
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

        if (!hasAccess) return { success: false, error: 'Unauthorized location access' }
        where = { locationId: id }
    } else {
        if (user.role === 'ADMIN' || user.role === 'HEALTH_REGION') {
            where = {}
        } else if (user.role === 'SSJ') {
            where = { location: { provinceName: user.location.provinceName } }
        } else if (user.role === 'SSO') {
            where = { 
                location: { 
                    provinceName: user.location.provinceName,
                    districtName: user.location.districtName
                } 
            }
        } else {
            where = { locationId: user.locationId }
        }
    }

    // Fetch distinct records from all relevant tables to build history
    const [activeRecords, supportRecords] = await Promise.all([
        prisma.activeCareLog.findMany({
            where: {
                ...where,
                recordedBy: (user.role === 'PCU' || user.role === 'HOSPITAL') ? user.orgName : undefined
            },
            include: { location: true }
        }),
        prisma.localAdminSupport.findMany({
            where,
            include: { location: true }
        })
    ])

    // Fetch users to map orgName to role
    const allRecords = [...activeRecords, ...supportRecords]
    const locationIds = [...new Set(allRecords.map(r => r.locationId))]
    const users = await prisma.user.findMany({
        where: { locationId: { in: locationIds } },
        select: { orgName: true, role: true, locationId: true }
    })

    const roleMap = {}
    users.forEach(u => {
        roleMap[`${u.locationId}-${u.orgName}`] = u.role
    })

    // Combine and Group by date, location AND recordedBy
    const historyMap = {}
    const processRecords = (records, type) => {
        records.forEach(r => {
            const dateStr = r.recordDate.toISOString().split('T')[0]
            const orgName = r.recordedBy || ''
            const key = `${dateStr}-${r.locationId}-${orgName}`
            if (!historyMap[key]) {
                historyMap[key] = {
                    date: dateStr,
                    locationId: r.locationId,
                    recordedBy: orgName,
                    recordedByRole: roleMap[`${r.locationId}-${orgName}`] || '',
                    provinceName: r.location?.provinceName || '',
                    districtName: r.location?.districtName || '',
                    subDistrict: r.location?.subDistrict || '',
                    locationName: orgName || r.location?.districtName || '',
                    totalCount: 0
                }
            }

            if (type === 'active') {
                historyMap[key].totalCount += (r.households || 0) + (r.people || 0) + (r.riskGroups || 0)
            } else if (type === 'support') {
                historyMap[key].totalCount += (r.orgCount || 0) + (r.maskSupport || 0) + (r.dustNetSupport || 0) + (r.cleanRoomSupport || 0)
            }
        })
    }

    processRecords(activeRecords, 'active')
    processRecords(supportRecords, 'support')

    const sortedHistory = Object.values(historyMap)
        .filter(h => h.totalCount > 0)
        .sort((a, b) => new Date(b.date) - new Date(a.date))

    return { success: true, data: sortedHistory }
}

export async function deleteActiveCareData(dateString, locationId) {
    const session = await getSession()
    if (!session) return { success: false, message: 'Unauthorized' }

    const user = await prisma.user.findUnique({
        where: { id: session.userId },
        select: { locationId: true, role: true, orgName: true }
    })
    if (!user) return { success: false, message: 'User not found' }

    const date = new Date(dateString)
    const id = parseInt(locationId)

    if (user.role !== 'ADMIN' && user.role !== 'HEALTH_REGION' && id !== user.locationId) {
        return { success: false, message: 'Unauthorized location delete' }
    }

    try {
        await prisma.$transaction(async (tx) => {
            await tx.activeCareLog.deleteMany({
                where: { 
                    locationId: id, 
                    recordDate: date,
                    recordedBy: (user.role === 'PCU' || user.role === 'HOSPITAL') 
                        ? user.orgName 
                        : undefined
                }
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

    const user = await prisma.user.findUnique({
        where: { id: session.userId },
        select: { id: true, locationId: true, role: true, orgName: true }
    })

    const locationId = parseInt(formData.get('locationId'))
    if (!locationId) return { success: false, message: 'Location ID missing' }

    const dateString = formData.get('date')
    if (!dateString) return { success: false, message: 'กรุณาระบุวันที่' }
    const date = new Date(dateString)

    const activities = ["การสอบสวนโรค", "การดูแลสุขภาพจิต", "การรักษาพยาบาลเบื้องต้น"]
    const orgCount = parseInt(formData.get('orgCount') || '0')
    const maskSupport = parseInt(formData.get('maskSupport') || '0')
    const dustNetSupport = parseInt(formData.get('dustNetSupport') || '0')
    const cleanRoomSupport = parseInt(formData.get('cleanRoomSupport') || '0')

    try {
        await prisma.$transaction(async (tx) => {
            const recordedBy = user.orgName
            await tx.activeCareLog.deleteMany({
                where: { locationId: locationId, recordDate: date, recordedBy: recordedBy }
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
                        riskGroups,
                        recordedBy: recordedBy
                    })
                }
            }

            if (careLogsToInsert.length > 0) {
                await tx.activeCareLog.createMany({ data: careLogsToInsert })
            }

            const existingSupport = await tx.localAdminSupport.findFirst({
                where: { locationId: locationId, recordDate: date }
            })

            if (existingSupport) {
                await tx.localAdminSupport.update({
                    where: { id: existingSupport.id },
                    data: { orgCount, maskSupport, dustNetSupport, cleanRoomSupport }
                })
            } else if (orgCount > 0 || maskSupport > 0 || dustNetSupport > 0 || cleanRoomSupport > 0) {
                await tx.localAdminSupport.create({
                    data: { locationId: locationId, recordDate: date, orgCount, maskSupport, dustNetSupport, cleanRoomSupport }
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

export async function getActiveCareExportData() {
    const session = await getSession()
    if (!session) return null

    const user = await prisma.user.findUnique({
        where: { id: session.userId },
        select: { 
            role: true, 
            locationId: true, 
            orgName: true, 
            location: { 
                select: { 
                    provinceName: true, 
                    districtName: true 
                } 
            } 
        }
    })
    if (!user) return null

    let whereClause = { locationId: user.locationId }
    if (user.role === 'ADMIN' || user.role === 'HEALTH_REGION') {
        whereClause = {}
    } else if (user.role === 'SSJ') {
        whereClause = { location: { provinceName: user.location.provinceName } }
    }

    const [activeCares, adminSupport] = await Promise.all([
        prisma.activeCareLog.findMany({
            where: {
                ...whereClause,
                recordedBy: (user.role === 'PCU' || user.role === 'HOSPITAL') 
                    ? user.orgName 
                    : undefined
            },
            include: { location: true },
            orderBy: { recordDate: 'desc' }
        }),
        prisma.localAdminSupport.findMany({
            where: whereClause,
            include: { location: true }
        })
    ])

    const locationIds = [...new Set([
        ...activeCares.map(a => a.locationId),
        ...adminSupport.map(a => a.locationId)
    ].filter(Boolean))]

    const usersForMap = await prisma.user.findMany({
        where: { locationId: { in: locationIds } },
        select: { locationId: true, orgName: true }
    })

    const orgNameMap = {}
    usersForMap.forEach(u => {
        if (!orgNameMap[u.locationId]) orgNameMap[u.locationId] = u.orgName
    })

    const processedActiveCares = activeCares.map(care => {
        return { 
            ...care, 
            activity: care.activity, 
            orgName: care.recordedBy || orgNameMap[care.locationId] || care.location?.districtName || '-' 
        }
    })

    return { activeCares: processedActiveCares, adminSupport, orgNameMap }
}
