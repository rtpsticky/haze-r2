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

    const measureIds = [
        '1.1', '1.2',
        '2.1', '2.2',
        '3.1', '3.2', '3.3', '3.4',
        '4.1', '4.2'
    ]

    try {
        // We will save each measure as a new record for "today"
        // Or update if we want to support editing (for simplicity, let's just create new logs for now as per plan, 
        // but usually users might want to edit. I'll stick to creating new for history as per schema design typical for "Logs")

        // Actually, distinct logs per submission is safer for history.

        const timestamp = new Date()

        for (const id of measureIds) {
            const statusValue = formData.get(`status_${id}`)
            const detail = formData.get(`detail_${id}`)

            // statusValue will be 'true' or 'false' string
            const status = statusValue === 'true'

            // Only save if status is explicitly set (though radio buttons usually force one)
            if (statusValue !== null) {
                await prisma.measureLog.create({
                    data: {
                        measureId: id,
                        status: status,
                        detail: status ? detail : null, // Only save detail if done, or maybe always? Request says "Actions taken... details", "Not taken". Assume detail only relevant if taken.
                        locationId: user.locationId,
                        recordedBy: user.username,
                        createdAt: timestamp
                    }
                })
            }
        }

        revalidatePath('/measures')
        return { message: 'บันทึกข้อมูลเรียบร้อยแล้ว', success: true }
    } catch (error) {
        console.error('Error saving measures:', error)
        return { message: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล' }
    }
}
