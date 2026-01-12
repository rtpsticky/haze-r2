'use server'

import prisma from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

async function checkAdmin() {
    const session = await getSession()
    if (!session) throw new Error('Unauthorized')

    const user = await prisma.user.findUnique({
        where: { id: session.userId }
    })

    if (!user || user.role !== 'ADMIN') {
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

export async function rejectUser(userId) {
    try {
        await checkAdmin()
        await prisma.user.delete({
            where: { id: userId }
        })
        revalidatePath('/admin/users')
        return { success: true }
    } catch (error) {
        console.error('Error rejecting user:', error)
        return { success: false, message: error.message }
    }
}
