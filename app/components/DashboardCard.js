import Link from 'next/link'

export default function DashboardCard({ title, description, href, icon, colorClass = "bg-white" }) {
    return (
        <Link href={href} className={`block group relative overflow-hidden rounded-2xl border border-slate-200 p-6 transition-all hover:shadow-lg hover:-translate-y-1 ${colorClass}`}>
            <div className="flex items-center gap-4">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition-colors group-hover:bg-emerald-600 group-hover:text-white`}>
                    {icon}
                </div>
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500 mt-1">{description}</p>
                </div>
            </div>
            <div className="absolute right-4 top-4 opacity-0 transition-opacity group-hover:opacity-100">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5 text-emerald-500">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                </svg>
            </div>
        </Link>
    )
}
