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

    let locationId = formData.get('locationId')
    const provinceName = formData.get('provinceName')
    const districtName = formData.get('districtName')

    // Handle case where locationId is missing but province is selected (Partial Location)
    if (!locationId && provinceName) {
        // Construct search/create criteria for placeholder location
        // Schema requires both districtName and subDistrict (nullable or string)
        // If districtName is provided but user stopped there: subDistrict = '-'
        // If only provinceName provided: districtName = '-', subDistrict = '-'

        const targetDistrict = districtName || '-'
        const targetSubDistrict = '-'

        try {
            // Find existing placeholder location
            let placeholderLoc = await prisma.location.findFirst({
                where: {
                    provinceName: provinceName,
                    districtName: targetDistrict,
                    subDistrict: targetSubDistrict
                }
            })

            // If not found, create it
            if (!placeholderLoc) {
                placeholderLoc = await prisma.location.create({
                    data: {
                        provinceName: provinceName,
                        districtName: targetDistrict,
                        subDistrict: targetSubDistrict
                    }
                })
            }

            locationId = placeholderLoc.id
        } catch (err) {
            console.error('Error handling placeholder location:', err)
            return { message: 'เกิดข้อผิดพลาดในการระบุสถานที่' }
        }
    }

    if (!name || !username || !password || !orgName || !locationId) {
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

    // Verify location exists
    const location = await prisma.location.findUnique({
        where: { id: parseInt(locationId) }
    })

    if (!location) {
        return { message: 'ไม่พบข้อมูลสถานที่ที่เลือก' }
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
                isApproved: false, // Default to false
            },
        })

        // await createSession(user.id) // Do not auto-login
        return { success: true, message: 'ลงทะเบียนสำเร็จ โปรดรอการอนุมัติจากผู้ดูแลระบบ' }
    } catch (error) {
        console.error('Registration Error:', error)
        return { message: 'เกิดข้อผิดพลาดในการสมัครสมาชิก' }
    }

    // redirect('/') // Do not redirect
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

    if (user.isApproved === false) {
        return { message: 'บัญชีของท่านอยู่ระหว่างรอการอนุมัติ กรุณาติดต่อผู้ดูแลระบบ' }
    }

    await createSession(user.id)
    redirect('/')
}

export async function logout() {
    await deleteSession()
    redirect('/login')
}
