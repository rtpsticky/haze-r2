import { getSession } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { redirect } from 'next/navigation'
import InventoryForm from './InventoryForm'

async function getUser(userId) {
    return await prisma.user.findUnique({
        where: { id: userId },
        include: { location: true },
    })
}

export default async function Page() {
    const session = await getSession()
    if (!session) {
        redirect('/login')
    }

    const user = await getUser(session.userId)

    return <InventoryForm user={user} />
}
