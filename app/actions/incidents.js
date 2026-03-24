'use server'

import prisma from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export async function getIncidentData(dateString, requestedLocationId = null) {
    const session = await getSession()
    if (!session) return { success: false, error: 'Unauthorized' }

    let locationIdToUse = requestedLocationId

    const user = await prisma.user.findUnique({
        where: { id: session.userId },
        select: { locationId: true, role: true, location: true }
    })

    // If no specific location requested, default to user's home location
    if (!locationIdToUse) {
        if (user) locationIdToUse = user.locationId
    } else {
        // Permission Check
        const locationIdAsInt = parseInt(locationIdToUse)
        if (user?.role !== 'ADMIN' && locationIdAsInt !== user.locationId) {
            // Check if user is SSJ and accessing a location in their province
            if (user?.role === 'SSJ') {
                const targetLoc = await prisma.location.findUnique({ where: { id: locationIdAsInt } })
                if (targetLoc?.provinceName !== user.location?.provinceName) {
                    return { success: false, error: 'Unauthorized location access' }
                }
            } else {
                return { success: false, error: 'Unauthorized location access' }
            }
        }
    }

    if (!locationIdToUse) return { success: false, error: 'Location not determined' }

    const locationId = parseInt(locationIdToUse)
    const date = new Date(dateString)

    try {
        const [incidents, location] = await Promise.all([
            prisma.staffIncident.findMany({
                where: {
                    locationId: locationId,
                    recordDate: date
                },
                orderBy: {
                    id: 'desc'
                }
            }),
            prisma.location.findUnique({
                where: { id: locationId }
            })
        ])

        return {
            success: true,
            data: {
                location,
                incidents
            }
        }
    } catch (error) {
        console.error('Error fetching incident data:', error)
        return { success: false, error: 'Failed to fetch data' }
    }
}

export async function saveIncident(prevState, formData) {
    const session = await getSession()
    if (!session) {
        return { success: false, message: 'Unauthorized' }
    }

    const staffName = formData.get('staffName')
    const status = formData.get('status')
    const incidentDetails = formData.get('incidentDetails')
    const recordDate = formData.get('recordDate')
    const locationId = parseInt(formData.get('locationId'))

    // Validate required fields
    if (!staffName || !status || !incidentDetails || !recordDate || !locationId) {
        return { success: false, message: 'กรุณากรอกข้อมูลให้ครบถ้วน' }
    }

    const user = await prisma.user.findUnique({
        where: { id: session.userId },
        select: { locationId: true, role: true }
    })

    // Only HOSPITAL and PCU (and ADMIN) can save incidents
    if (user.role !== 'HOSPITAL' && user.role !== 'PCU' && user.role !== 'ADMIN') {
        return { success: false, message: 'สิทธิ์การบันทึกข้อมูลสำหรับ โรงพยาบาล และ รพ.สต. เท่านั้น' }
    }

    // Permission Check
    if (user.role !== 'ADMIN' && locationId !== user.locationId) {
        return { success: false, message: 'Unauthorized location save' }
    }

    try {
        await prisma.staffIncident.create({
            data: {
                staffName,
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
        select: { locationId: true, role: true }
    })

    if (user.role !== 'HOSPITAL' && user.role !== 'PCU' && user.role !== 'ADMIN') {
        return { success: false, message: 'สิทธิ์การแก้ไขข้อมูลสำหรับ โรงพยาบาล และ รพ.สต. เท่านั้น' }
    }

    // Verify existing incident
    const existing = await prisma.staffIncident.findUnique({ where: { id } })
    if (!existing) return { success: false, message: 'Incident not found' }

    // Permission Check
    if (user.role !== 'ADMIN' && existing.locationId !== user.locationId) {
        return { success: false, message: 'Unauthorized update' }
    }

    try {
        await prisma.staffIncident.update({
            where: { id },
            data: {
                staffName,
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
        select: { locationId: true, role: true }
    })

    if (user.role !== 'HOSPITAL' && user.role !== 'PCU' && user.role !== 'ADMIN') {
        // Allow ADMIN to delete approved, but if it's SSJ, wait SSJ is not allowed to delete initially.
        // Actually, in the UI ADMIN has delete button.
        // What about SSJ deleting? UI only shows delete for ADMIN if approved, and HOSPITAL/PCU/ADMIN if not approved.
        return { success: false, message: 'สิทธิ์การลบข้อมูลสำหรับ โรงพยาบาล และ รพ.สต. เท่านั้น' }
    }

    // Verify existing incident
    const existing = await prisma.staffIncident.findUnique({ where: { id } })
    if (!existing) return { success: false, message: 'Incident not found' }

    // Permission Check
    if (user.role !== 'ADMIN' && existing.locationId !== user.locationId) {
        return { success: false, message: 'Unauthorized delete' }
    }

    try {
        await prisma.staffIncident.delete({
            where: { id }
        })

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
        select: { role: true, locationId: true }
    })
    if (!user) return null

    let whereClause = {}
    if (user.role !== 'ADMIN') {
        whereClause = { locationId: user.locationId }
    }

    const records = await prisma.staffIncident.findMany({
        where: whereClause,
        include: { location: true },
        orderBy: { recordDate: 'desc' }
    })

    return records
}
