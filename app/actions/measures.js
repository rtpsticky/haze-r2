'use server'

import prisma from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function saveMeasures(prevState, formData) {
    const session = await getSession()
    if (!session) {
        return { message: 'Unauthorized' }
    }

    const user = await prisma.user.findUnique({
        where: { id: session.userId },
    })

    if (!user) {
        return { message: 'User not found' }
    }

    if (user.role !== 'SSJ' && user.role !== 'ADMIN') {
        return { message: 'ไม่มีสิทธิ์เข้าถึง (Unauthorized)' }
    }

    const measureIds = [
        '1.1', '1.2',
        '2.1', '2.2',
        '3.1', '3.2', '3.3', '3.4',
        '4.1', '4.2'
    ]

    try {
        // Create timestamps for today start/end to check for existing records
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const timestamp = new Date()

        for (const id of measureIds) {
            const statusValue = formData.get(`status_${id}`)
            const detail = formData.get(`detail_${id}`)

            // statusValue will be 'true' or 'false' string
            const status = statusValue === 'true'

            // Only save if status is explicitly set
            if (statusValue !== null) {
                // Check for existing record today
                const existing = await prisma.measureLog.findFirst({
                    where: {
                        measureId: id,
                        locationId: user.locationId,
                        createdAt: {
                            gte: today
                        }
                    }
                })

                if (existing) {
                    // Update existing
                    await prisma.measureLog.update({
                        where: { id: existing.id },
                        data: {
                            status: status,
                            detail: status ? detail : null,
                        }
                    })
                } else {
                    // Create new
                    await prisma.measureLog.create({
                        data: {
                            measureId: id,
                            status: status,
                            detail: status ? detail : null,
                            locationId: user.locationId,
                            recordedBy: user.username,
                            createdAt: timestamp
                        }
                    })
                }
            }
        }

        revalidatePath('/measures')
        return { message: 'บันทึกข้อมูลเรียบร้อยแล้ว', success: true }
    } catch (error) {
        console.error('Error saving measures:', error)
        return { message: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล' }
    }
}
