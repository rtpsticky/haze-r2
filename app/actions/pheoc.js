'use server'

import prisma from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import fs from 'fs/promises'
import path from 'path'

export async function savePheocReport(prevState, formData) {
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

    const reportDate = formData.get('reportDate')
    const status = formData.get('status') // 'NOT_OPEN', 'OPEN', 'CLOSED'
    let dbStatus = ''
    let responseLevel = null

    // Map form values to DB schema
    if (status === 'NOT_OPEN') {
        const subStatus = formData.get('subStatusNotOpen')
        if (subStatus === 'WATCH') dbStatus = 'เฝ้าระวังปกติ'
        else if (subStatus === 'ALERT') dbStatus = 'เฝ้าระวังใกล้ชิด'
        else dbStatus = 'ยังไม่เปิด' // Fallback
    } else if (status === 'OPEN') {
        dbStatus = 'เปิด PHEOC'
        const subStatus = formData.get('subStatusOpen')
        if (subStatus === 'RESPONSE_1') responseLevel = 'ระดับตอบโต้ 1'
        else if (subStatus === 'RESPONSE_2') responseLevel = 'ระดับตอบโต้ 2'
    } else if (status === 'CLOSED') {
        dbStatus = 'ปิดศูนย์'
    }

    // Handle File Upload
    const file = formData.get('file')
    let pdfUrl = null

    if (file && file.size > 0) {
        if (file.type !== 'application/pdf') {
            return { message: 'กรุณาอัปโหลดไฟล์ PDF เท่านั้น', success: false }
        }

        try {
            const date = new Date()
            const year = date.getFullYear()
            const month = String(date.getMonth() + 1).padStart(2, '0')
            const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'pheoc', String(year), month)

            await fs.mkdir(uploadDir, { recursive: true })

            const timestamp = Date.now()
            const filename = `${timestamp}-${file.name}`
            const filepath = path.join(uploadDir, filename)

            const buffer = Buffer.from(await file.arrayBuffer())
            await fs.writeFile(filepath, buffer)

            pdfUrl = `/uploads/pheoc/${year}/${month}/${filename}`
        } catch (error) {
            console.error('File upload error:', error)
            return { message: 'เกิดข้อผิดพลาดในการอัปโหลดไฟล์', success: false }
        }
    }

    try {
        await prisma.pheocReport.create({
            data: {
                reportDate: new Date(reportDate),
                status: dbStatus,
                responseLevel: responseLevel,
                pdfUrl: pdfUrl,
                locationId: user.locationId,
                recordedAt: new Date()
            }
        })

        revalidatePath('/pheoc')
        return { message: 'บันทึกรายงาน PHEOC เรียบร้อยแล้ว', success: true }
    } catch (error) {
        console.error('Database error:', error)
        return { message: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล', success: false }
    }
}
