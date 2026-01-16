import { getSession } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { redirect } from 'next/navigation'
import InventoryForm from './InventoryForm'
import InventoryHistory from './InventoryHistory'
import { getInventoryHistory } from '@/app/actions/inventory'

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
    const history = await getInventoryHistory()

    return (
        <>
            <InventoryForm user={user} />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
                <InventoryHistory history={history} isAdmin={user?.role === 'ADMIN'} />
            </div>
        </>
    )
}
