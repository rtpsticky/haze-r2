'use server'

import prisma from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export async function getIncidentData(dateString, requestedLocationId = null) {
    const session = await getSession()
    if (!session) return { success: false, error: 'Unauthorized' }

    const user = await prisma.user.findUnique({
        where: { id: session.userId },
        select: { locationId: true, role: true, orgName: true, location: true }
    })

    const date = new Date(dateString)

    try {
        let incidents = []
        let location = null

        if (user?.role === 'SSJ') {
            const requestedLocId = requestedLocationId ? parseInt(requestedLocationId) : null
            if (requestedLocId) {
                const requestedLoc = await prisma.location.findUnique({ where: { id: requestedLocId } })
                if (requestedLoc && requestedLoc.provinceName === user.location.provinceName) {
                    incidents = await prisma.staffIncident.findMany({
                        where: { locationId: requestedLocId, recordDate: date },
                        orderBy: { id: 'desc' }
                    })
                    location = requestedLoc
                }
            } else {
                incidents = await prisma.staffIncident.findMany({
                    where: { location: { provinceName: user.location.provinceName }, recordDate: date },
                    orderBy: { id: 'desc' }
                })
                location = user.location
            }
        } else if (user?.role === 'ADMIN' || user?.role === 'HEALTH_REGION') {
            const requestedLocId = requestedLocationId ? parseInt(requestedLocationId) : null
            if (requestedLocId) {
                const requestedLoc = await prisma.location.findUnique({ where: { id: requestedLocId } })
                if (requestedLoc) {
                    incidents = await prisma.staffIncident.findMany({
                        where: { locationId: requestedLocId, recordDate: date },
                        orderBy: { id: 'desc' }
                    })
                    location = requestedLoc
                }
            } else {
                incidents = await prisma.staffIncident.findMany({
                    where: { recordDate: date },
                    orderBy: { id: 'desc' }
                })
                location = user.location
            }
        } else {
            const locationIdToUse = requestedLocationId ? parseInt(requestedLocationId) : user.locationId
            if (locationIdToUse !== user.locationId) {
                return { success: false, error: 'Unauthorized location access' }
            }
            incidents = await prisma.staffIncident.findMany({
                where: { 
                    locationId: locationIdToUse, 
                    recordDate: date,
                    staffName: (user.role === 'PCU' || user.role === 'HOSPITAL') 
                        ? { contains: `[${user.orgName}]` } 
                        : undefined
                },
                orderBy: { id: 'desc' }
            })
            location = await prisma.location.findUnique({ where: { id: locationIdToUse } })
        }

        const processedIncidents = incidents.map(inc => ({
            ...inc,
            staffName: inc.staffName.split(' [')[0]
        }))

        return {
            success: true,
            data: { location, incidents: processedIncidents }
        }
    } catch (error) {
        console.error('Error fetching incident data:', error)
        return { success: false, error: 'Failed to fetch data' }
    }
}

export async function saveIncident(prevState, formData) {
    const session = await getSession()
    if (!session) return { success: false, message: 'Unauthorized' }

    const staffName = formData.get('staffName')
    const status = formData.get('status')
    const incidentDetails = formData.get('incidentDetails')
    const recordDate = formData.get('recordDate')
    const locationId = parseInt(formData.get('locationId'))

    if (!staffName || !status || !incidentDetails || !recordDate || !locationId) {
        return { success: false, message: 'กรุณากรอกข้อมูลให้ครบถ้วน' }
    }

    const user = await prisma.user.findUnique({
        where: { id: session.userId },
        select: { locationId: true, role: true, orgName: true }
    })

    if (!['HOSPITAL', 'PCU', 'RPS', 'ADMIN'].includes(user.role)) {
        return { success: false, message: 'สิทธิ์การบันทึกข้อมูลสำหรับ โรงพยาบาล และ รพ.สต. เท่านั้น' }
    }

    if (user.role !== 'ADMIN' && user.role !== 'HEALTH_REGION' && locationId !== user.locationId) {
        return { success: false, message: 'Unauthorized location save' }
    }

    try {
        await prisma.staffIncident.create({
            data: {
                staffName: `${staffName} [${user.orgName}]`,
                status,
                incidentDetails,
                recordDate: new Date(recordDate),
                locationId: locationId,
                isApproved: false
            }
        })

        revalidatePath('/incidents')
        return { success: true, message: 'บันทึกข้อมูลสำเร็จ (รอนุมัติจาก สสจ.)' }
    } catch (error) {
        console.error('Create Incident Error:', error)
        return { success: false, message: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล' }
    }
}

export async function updateIncident(prevState, formData) {
    const session = await getSession()
    if (!session) return { success: false, message: 'Unauthorized' }

    const id = parseInt(formData.get('id'))
    const staffName = formData.get('staffName')
    const status = formData.get('status')
    const incidentDetails = formData.get('incidentDetails')

    if (!id || !staffName || !status || !incidentDetails) {
        return { success: false, message: 'ข้อมูลไม่ครบถ้วน' }
    }

    const user = await prisma.user.findUnique({
        where: { id: session.userId },
        select: { locationId: true, role: true, orgName: true }
    })

    if (!['HOSPITAL', 'PCU', 'RPS', 'ADMIN'].includes(user.role)) {
        return { success: false, message: 'สิทธิ์การแก้ไขข้อมูลสำหรับ โรงพยาบาล และ รพ.สต. เท่านั้น' }
    }

    const existing = await prisma.staffIncident.findUnique({ where: { id } })
    if (!existing) return { success: false, message: 'Incident not found' }

    if (user.role !== 'ADMIN' && user.role !== 'HEALTH_REGION' && existing.locationId !== user.locationId) {
        return { success: false, message: 'Unauthorized update' }
    }

    try {
        await prisma.staffIncident.update({
            where: { id },
            data: {
                staffName: `${staffName} [${user.orgName}]`,
                status,
                incidentDetails
            }
        })

        revalidatePath('/incidents')
        return { success: true, message: 'แก้ไขข้อมูลสำเร็จ' }
    } catch (error) {
        console.error('Update Incident Error:', error)
        return { success: false, message: 'เกิดข้อผิดพลาดในการแก้ไขข้อมูล' }
    }
}

export async function approveIncident(id) {
    const session = await getSession()
    if (!session) return { success: false, message: 'Unauthorized' }

    const user = await prisma.user.findUnique({
        where: { id: session.userId },
        include: { location: true }
    })

    if (user.role !== 'SSJ' && user.role !== 'ADMIN') {
        return { success: false, message: 'สิทธิ์การอนุมัติสำหรับ สสจ. เท่านั้น' }
    }

    if (user.role === 'SSJ') {
        const incident = await prisma.staffIncident.findUnique({
            where: { id },
            include: { location: true }
        })
        if (!incident) return { success: false, message: 'Incident not found' }
        if (incident.location?.provinceName !== user.location?.provinceName) {
            return { success: false, message: 'ไม่สามารถอนุมัติรายการข้ามจังหวัดได้' }
        }
    }

    try {
        await prisma.staffIncident.update({
            where: { id },
            data: { isApproved: true }
        })

        revalidatePath('/incidents')
        return { success: true, message: 'อนุมัติรายการเรียบร้อยแล้ว' }
    } catch (error) {
        console.error('Approve Incident Error:', error)
        return { success: false, message: 'เกิดข้อผิดพลาดในการอนุมัติ' }
    }
}

export async function deleteIncident(id) {
    const session = await getSession()
    if (!session) return { success: false, message: 'Unauthorized' }

    const user = await prisma.user.findUnique({
        where: { id: session.userId },
        select: { locationId: true, role: true, orgName: true }
    })

    if (!['HOSPITAL', 'PCU', 'RPS', 'ADMIN'].includes(user.role)) {
        return { success: false, message: 'สิทธิ์การลบข้อมูลสำหรับ โรงพยาบาล และ รพ.สต. เท่านั้น' }
    }

    const existing = await prisma.staffIncident.findUnique({ where: { id } })
    if (!existing) return { success: false, message: 'Incident not found' }

    if (user.role !== 'ADMIN' && user.role !== 'HEALTH_REGION') {
        if (existing.locationId !== user.locationId) {
            return { success: false, message: 'ไม่มีสิทธิ์เข้าถึงข้อมูลข้ามพื้นที่' }
        }
        if ((user.role === 'PCU' || user.role === 'HOSPITAL') && !existing.staffName.includes(`[${user.orgName}]`)) {
            return { success: false, message: 'ไม่มีสิทธิ์ลบข้อมูลของหน่วยงานอื่น' }
        }
    }

    try {
        await prisma.staffIncident.delete({ where: { id } })
        revalidatePath('/incidents')
        return { success: true, message: 'ลบข้อมูลสำเร็จ' }
    } catch (error) {
        console.error('Delete Incident Error:', error)
        return { success: false, message: 'เกิดข้อผิดพลาดในการลบข้อมูล' }
    }
}

export async function getIncidentsExportData() {
    const session = await getSession()
    if (!session) return null

    const user = await prisma.user.findUnique({
        where: { id: session.userId },
        select: { role: true, locationId: true, orgName: true }
    })
    if (!user) return null

    let whereClause = {}
    if (!['SSJ', 'ADMIN', 'HEALTH_REGION', 'HOSPITAL', 'PCU', 'RPS'].includes(user.role)) {
        return null
    }
    
    if (user.role === 'SSJ') {
        const userWithLocation = await prisma.user.findUnique({
            where: { id: session.userId },
            include: { location: true }
        })
        whereClause = { location: { provinceName: userWithLocation.location.provinceName } }
    } else if (user.role === 'PCU' || user.role === 'HOSPITAL') {
        whereClause = { 
            locationId: user.locationId,
            staffName: { contains: `[${user.orgName}]` }
        }
    } else if (user.role === 'SSO') {
        whereClause = { locationId: user.locationId }
    }

    const records = await prisma.staffIncident.findMany({
        where: whereClause,
        include: { location: true },
        orderBy: { recordDate: 'desc' }
    })

    return records.map(r => {
        const parts = r.staffName.split(' [')
        const staffName = parts[0]
        const orgName = parts[1] ? parts[1].replace(']', '') : '-'

        return { ...r, staffName, orgName }
    })
}
