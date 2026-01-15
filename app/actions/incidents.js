'use server'

import prisma from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export async function getIncidentData(dateString, requestedLocationId = null) {
    const session = await getSession()
    if (!session) return { success: false, error: 'Unauthorized' }

    let locationIdToUse = requestedLocationId

    // If no specific location requested, default to user's home location
    if (!locationIdToUse) {
        const user = await prisma.user.findUnique({
            where: { id: session.userId },
            select: { locationId: true }
        })
        if (user) locationIdToUse = user.locationId
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

    try {
        await prisma.staffIncident.create({
            data: {
                staffName,
                status,
                incidentDetails,
                recordDate: new Date(recordDate),
                locationId: locationId
            }
        })

        revalidatePath('/incidents')
        return { success: true, message: 'บันทึกข้อมูลสำเร็จ' }
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

export async function deleteIncident(id) {
    const session = await getSession()
    if (!session) return { success: false, message: 'Unauthorized' }

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
