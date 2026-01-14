import { getSession } from '@/lib/auth'
import prisma from '@/lib/prisma'
import Link from 'next/link'
import PheocManager from './PheocManager'
import { redirect } from 'next/navigation'

export default async function PheocPage() {
    const session = await getSession()
    if (!session) {
        redirect('/login')
    }

    const user = await prisma.user.findUnique({
        where: { id: session.userId },
        select: { locationId: true }
    })

    if (!user) {
        redirect('/login')
    }

    // Fetch history
    const reports = await prisma.pheocReport.findMany({
        where: { locationId: user.locationId },
        orderBy: { reportDate: 'desc' },
        take: 50 // Limit to last 50 reports
    })

    return (
        <div className="min-h-screen bg-slate-50 py-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-8 flex items-center gap-4">
                    <Link href="/" className="p-2 rounded-lg bg-white shadow-sm text-slate-500 hover:text-emerald-600 hover:shadow transition-all">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                        </svg>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">รายงาน PHEOC</h1>
                        <p className="text-slate-500 text-sm">บันทึกสถานะศูนย์ปฏิบัติการฉุกเฉิน</p>
                    </div>
                </div>

                <PheocManager reports={reports} />
            </div>
        </div>
    )
}
