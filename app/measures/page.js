import { getSession } from '@/lib/auth'
import prisma from '@/lib/prisma'
import Link from 'next/link'
import MeasureForm from './MeasureForm'
import { redirect } from 'next/navigation'

async function getTodayMeasures(locationId) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const measures = await prisma.measureLog.findMany({
        where: {
            locationId: locationId,
            createdAt: {
                gte: today,
                lt: tomorrow
            }
        }
    });

    return measures;
}

export default async function MeasuresPage() {
    const session = await getSession()
    if (!session) {
        redirect('/login')
    }

    const user = await prisma.user.findUnique({
        where: { id: session.userId },
        select: { locationId: true }
    })

    if (!user) {
        // Handle edge case where user is in session but not found in DB
        redirect('/login')
    }

    const existingData = await getTodayMeasures(user.locationId);

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
                        <h1 className="text-2xl font-bold text-slate-800">บันทึกมาตรการ</h1>
                        <p className="text-slate-500 text-sm">รายงานผลการดำเนินงานตามมาตรการ 1 - 4</p>
                    </div>
                </div>

                <MeasureForm existingData={existingData} />
            </div>
        </div>
    )
}
