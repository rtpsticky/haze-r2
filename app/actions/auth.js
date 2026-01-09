'use server'

import prisma from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { createSession, deleteSession, hashPassword, verifyPassword } from '@/lib/auth'

export async function register(prevState, formData) {
    const name = formData.get('name')
    const username = formData.get('username')
    const password = formData.get('password')
    const confirmPassword = formData.get('confirmPassword')
    const orgName = formData.get('orgName')

    if (!name || !username || !password || !orgName) {
        return { message: 'กรุณากรอกข้อมูลให้ครบถ้วน' }
    }

    if (password !== confirmPassword) {
        return { message: 'รหัสผ่านไม่ตรงกัน' }
    }

    const existingUser = await prisma.user.findUnique({
        where: { username },
    })

    if (existingUser) {
        return { message: 'ชื่อผู้ใช้นี้ถูกใช้งานแล้ว' }
    }

    const hashedPassword = await hashPassword(password)

    // Find or create default location
    let location = await prisma.location.findFirst()
    if (!location) {
        location = await prisma.location.create({
            data: {
                provinceName: '-',
                districtName: '-',
                subDistrict: '-',
            },
        })
    }

    try {
        const user = await prisma.user.create({
            data: {
                name,
                username,
                password: hashedPassword,
                orgName,
                role: 'HOSPITAL',
                locationId: location.id,
            },
        })

        await createSession(user.id)
    } catch (error) {
        console.error('Registration Error:', error)
        return { message: 'เกิดข้อผิดพลาดในการสมัครสมาชิก' }
    }

    redirect('/')
}

export async function login(prevState, formData) {
    const username = formData.get('username')
    const password = formData.get('password')

    if (!username || !password) {
        return { message: 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน' }
    }

    const user = await prisma.user.findUnique({
        where: { username },
    })

    if (!user || !(await verifyPassword(password, user.password))) {
        return { message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' }
    }

    await createSession(user.id)
    redirect('/')
}

export async function logout() {
    await deleteSession()
    redirect('/login')
}
