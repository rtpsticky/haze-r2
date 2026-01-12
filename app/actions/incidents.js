'use server'

import prisma from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createIncident(prevState, formData) {
    const session = await getSession()
    if (!session) {
        return { message: 'Unauthorized' }
    }

    const staffName = formData.get('staffName')
    const status = formData.get('status')
    const incidentDetails = formData.get('incidentDetails')
    const recordDate = formData.get('recordDate')

    // Validate required fields
    if (!staffName || !status || !incidentDetails || !recordDate) {
        return { message: 'กรุณากรอกข้อมูลให้ครบถ้วนในส่วนที่มีหัวข้อสีแดง' }
    }

    try {
        // Get user's location to link the report
        const user = await prisma.user.findUnique({
            where: { id: session.userId },
            include: { location: true }
        })

        await prisma.staffIncident.create({
            data: {
                staffName,
                status,
                incidentDetails,
                recordDate: new Date(recordDate),
                locationId: user.locationId // Creates link to user's location
            }
        })

        revalidatePath('/incidents')
        return { success: true, message: 'บันทึกข้อมูลสำเร็จ' }
    } catch (error) {
        console.error('Create Incident Error:', error)
        return { message: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล' }
    }
}
