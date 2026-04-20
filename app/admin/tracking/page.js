import { getSession } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { redirect } from 'next/navigation'
import TrackingPage from './TrackingPage'

export const dynamic = 'force-dynamic'

async function getUser(userId) {
    return await prisma.user.findUnique({
        where: { id: userId },
    })
}

export default async function Page() {
    const session = await getSession()
    if (!session) {
        redirect('/login')
    }

    const user = await getUser(session.userId)
    
    // Check if user is ADMIN or HEALTH_REGION
    if (user.role !== 'ADMIN' && user.role !== 'HEALTH_REGION') {
        redirect('/')
    }

    return <TrackingPage user={user} />
}
