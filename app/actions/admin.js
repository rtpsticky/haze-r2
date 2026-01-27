'use server'
// Admin Server Actions

import prisma from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

async function checkAdmin() {
    const session = await getSession()
    if (!session) throw new Error('Unauthorized')

    const user = await prisma.user.findUnique({
        where: { id: session.userId }
    })

    if (!user || (user.role !== 'ADMIN' && user.role !== 'HEALTH_REGION')) {
        throw new Error('Forbidden')
    }
    return user
}

export async function getPendingUsers() {
    try {
        await checkAdmin()
        return await prisma.user.findMany({
            where: { isApproved: false },
            include: { location: true },
            orderBy: { createdAt: 'desc' }
        })
    } catch (error) {
        console.error('Error fetching pending users:', error)
        return []
    }
}

export async function approveUser(userId) {
    try {
        await checkAdmin()
        await prisma.user.update({
            where: { id: userId },
            data: { isApproved: true }
        })
        revalidatePath('/admin/users')
        return { success: true }
    } catch (error) {
        console.error('Error approving user:', error)
        return { success: false, message: error.message }
    }
}



export async function updateUserStatus(userId, isApproved) {
    try {
        await checkAdmin()
        await prisma.user.update({
            where: { id: userId },
            data: { isApproved }
        })
        revalidatePath('/admin/users')
        return { success: true }
    } catch (error) {
        console.error('Error updating user status:', error)
        return { success: false, message: error.message }
    }
}

export async function updateUser(userId, data) {
    try {
        await checkAdmin()
        // Validate password if provided
        let updateData = {
            name: data.name,
            orgName: data.orgName,
            role: data.role,
        }

        if (data.password && data.password.trim() !== '') {
            // We need to import hashPassword here if we want to support password updates
            // But for now, let's skip password update in this quick action or import it.
            // Given imports, I need to check if hashPassword is exported from lib/auth.
            // It is.
            const { hashPassword } = await import('@/lib/auth')
            updateData.password = await hashPassword(data.password)
        }

        await prisma.user.update({
            where: { id: userId },
            data: updateData
        })
        revalidatePath('/admin/users')
        return { success: true }

    } catch (error) {
        console.error('Error updating user:', error)
        return { success: false, message: error.message }
    }
}


export async function deleteUser(userId) {
    try {
        await checkAdmin()
        await prisma.user.delete({
            where: { id: userId }
        })
        revalidatePath('/admin/users')
        return { success: true }
    } catch (error) {
        console.error('Error deleting user:', error)
        return { success: false, message: error.message }
    }
}

const ITEMS_PER_PAGE = 20

export async function getAllUsers({ page = 1, query = '', filter = 'all' } = {}) {
    try {
        await checkAdmin()

        const skip = (page - 1) * ITEMS_PER_PAGE

        let where = {}

        // Filter Logic
        if (filter === 'pending') {
            where.isApproved = false
        } else if (filter === 'approved') {
            where.isApproved = true
        }

        // Search Logic
        if (query) {
            where.AND = [
                {
                    OR: [
                        { name: { contains: query, mode: 'insensitive' } },
                        { username: { contains: query, mode: 'insensitive' } },
                        { orgName: { contains: query, mode: 'insensitive' } },
                        { location: { provinceName: { contains: query, mode: 'insensitive' } } },
                        { location: { districtName: { contains: query, mode: 'insensitive' } } }
                    ]
                }
            ]
        }

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
                include: { location: true },
                orderBy: [
                    { isApproved: 'asc' }, // Pending first
                    { createdAt: 'desc' }
                ],
                skip,
                take: ITEMS_PER_PAGE
            }),
            prisma.user.count({ where })
        ])

        return {
            users,
            totalPages: Math.ceil(total / ITEMS_PER_PAGE),
            currentPage: page,
            totalUsers: total
        }
    } catch (error) {
        console.error('Error fetching users:', error)
        return { users: [], totalPages: 0, currentPage: 1, totalUsers: 0 }
    }
}
