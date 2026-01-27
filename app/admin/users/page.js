import { getAllUsers } from '@/app/actions/admin'
import UsersTable from './UsersTable'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function AdminUsersPage({ searchParams }) {
    const params = await searchParams
    const page = Number(params?.page) || 1
    const query = params?.q || ''
    const filter = params?.filter || 'all'

    const { users, totalPages, currentPage, totalUsers } = await getAllUsers({ page, query, filter })

    return (
        <div className="min-h-screen bg-slate-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">จัดการผู้ใช้งาน (User Management)</h1>
                        <p className="text-slate-500">ตรวจสอบ อนุมัติ และจัดการบัญชีผู้ใช้งานในระบบ</p>
                    </div>
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-white text-slate-600 rounded-lg border border-slate-200 hover:bg-slate-50 hover:text-emerald-600 transition-colors shadow-sm font-medium text-sm"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                        </svg>
                        กลับสู่หน้าหลัก
                    </Link>
                </div>

                <UsersTable
                    initialUsers={users}
                    totalPages={totalPages}
                    currentPage={currentPage}
                    totalUsers={totalUsers}
                    currentFilter={filter}
                    currentQuery={query}
                />
            </div>
        </div>
    )
}
