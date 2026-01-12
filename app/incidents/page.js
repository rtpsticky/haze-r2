import IncidentsForm from './IncidentsForm'
import Link from 'next/link'

export default function IncidentsPage() {
    return (
        <div className="min-h-screen bg-slate-50 py-8">
            <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-8 flex items-center gap-4">
                    <Link href="/" className="p-2 rounded-lg bg-white shadow-sm text-slate-500 hover:text-emerald-600 hover:shadow transition-all">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                        </svg>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">รายงานเหตุการณ์</h1>
                        <p className="text-slate-500 text-sm">รายงานผลกระทบต่อสุขภาพของเจ้าหน้าที่และจิตอาสาดับไฟ</p>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-6">
                        <IncidentsForm />
                    </div>
                </div>
            </div>
        </div>
    )
}
