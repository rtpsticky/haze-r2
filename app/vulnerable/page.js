import { getSession } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { redirect } from 'next/navigation'
import VulnerableForm from './VulnerableForm'
import VulnerableHistory from './VulnerableHistory'
import { getVulnerableHistory } from '@/app/actions/vulnerable'

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
    const history = await getVulnerableHistory()

    return (
        <>
            <VulnerableForm user={user} />
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
                <VulnerableHistory history={history} />
            </div>
        </>
    )
}
