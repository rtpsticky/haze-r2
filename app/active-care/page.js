import ProactiveCareForm from './ProactiveCareForm'
import Link from 'next/link'
import { getSession } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { redirect } from 'next/navigation'

async function getUser(userId) {
    return await prisma.user.findUnique({
        where: { id: userId },
        include: { location: true },
    })
}

export default async function ProactiveCarePage() {
    const session = await getSession()
    if (!session) {
        redirect('/login')
    }

    const user = await getUser(session.userId)

    return (
        <div className="min-h-screen bg-slate-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-8 flex items-center gap-4">
                    <Link href="/" className="p-2 rounded-lg bg-white shadow-sm text-slate-500 hover:text-emerald-600 hover:shadow transition-all">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                        </svg>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">การดูแลเชิงรุก</h1>
                        <p className="text-slate-500 text-sm">บันทึกข้อมูลการปฏิบัติการเชิงรุกในพื้นที่และการสนับสนุนของ อปท.</p>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-6">
                        <ProactiveCareForm user={user} />
                    </div>
                </div>
            </div>
        </div>
    )
}
