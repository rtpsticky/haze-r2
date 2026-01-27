'use client'

import { useState } from 'react'
import { updateUserStatus, deleteUser, approveUser } from '@/app/actions/admin'
import EditUserModal from './EditUserModal'
import { useRouter } from 'next/navigation'

export default function UsersTable({
    initialUsers,
    totalPages,
    currentPage,
    totalUsers,
    currentFilter = 'all',
    currentQuery = ''
}) {
    const router = useRouter()
    const [editingUser, setEditingUser] = useState(null)
    const [isLoading, setIsLoading] = useState(null) // userId being acted upon
    const [searchTerm, setSearchTerm] = useState(currentQuery)

    // Debounce search update
    const handleSearch = (term) => {
        setSearchTerm(term)
        const params = new URLSearchParams(window.location.search)
        if (term) {
            params.set('q', term)
        } else {
            params.delete('q')
        }
        params.set('page', '1') // Reset to page 1 on search
        router.push(`?${params.toString()}`)
    }

    const handleFilterChange = (newFilter) => {
        const params = new URLSearchParams(window.location.search)
        params.set('filter', newFilter)
        params.set('page', '1')
        router.push(`?${params.toString()}`)
    }

    const handlePageChange = (newPage) => {
        const params = new URLSearchParams(window.location.search)
        params.set('page', newPage)
        router.push(`?${params.toString()}`)
    }

    const handleApprove = async (id) => {
        if (!confirm('ยืนยันการอนุมัติผู้ใช้งาน?')) return
        setIsLoading(id)
        try {
            await approveUser(id)
            router.refresh()
        } finally {
            setIsLoading(null)
        }
    }

    const handleReject = async (id) => { // This is Delete
        if (!confirm('ยืนยันการลบ/ปฏิเสธผู้ใช้งาน? การกระทำนี้ไม่สามารถย้อนกลับได้')) return
        setIsLoading(id)
        try {
            await deleteUser(id)
            router.refresh()
        } finally {
            setIsLoading(null)
        }
    }

    const toggleStatus = async (user) => {
        const newStatus = !user.isApproved
        const action = newStatus ? 'เปิดใช้งาน' : 'ระงับการใช้งาน'
        if (!confirm(`ยืนยันการ${action}ผู้บัญชี ${user.name}?`)) return

        setIsLoading(user.id)
        try {
            await updateUserStatus(user.id, newStatus)
            router.refresh()
        } finally {
            setIsLoading(null)
        }
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Filters & Search */}
            <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-4 justify-between items-center">

                {/* Search Bar */}
                <div className="w-full md:w-1/3 relative">
                    <input
                        type="text"
                        placeholder="Search users..."
                        value={searchTerm}
                        onChange={(e) => {
                            const val = e.target.value
                            setSearchTerm(val)
                            // Debounce manually or use timeout
                            // Simple approach: triggers immediately on enter or delayed here?
                            // Let's rely on standard onchange for now but delay URL push is better.
                            // For simplicity in this step, I'll just push. Ideally debounce.
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSearch(searchTerm)
                        }}
                        onBlur={() => handleSearch(searchTerm)}
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                    />
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-slate-400 absolute left-3 top-2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                    </svg>
                </div>

                {/* Filter Tabs */}
                <div className="flex bg-slate-100 p-1 rounded-lg">
                    <button
                        onClick={() => handleFilterChange('all')}
                        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${currentFilter === 'all' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        ทั้งหมด
                    </button>
                    <button
                        onClick={() => handleFilterChange('pending')}
                        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${currentFilter === 'pending' ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        รออนุมัติ
                    </button>
                    <button
                        onClick={() => handleFilterChange('approved')}
                        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${currentFilter === 'approved' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        ใช้งานอยู่
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">สถานะ</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">ชื่อ-นามสกุล / ผู้ใช้</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">หน่วยงาน / ตำแหน่ง</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">พื้นที่</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">วันที่สมัคร</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">การจัดการ</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                        {initialUsers.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                                    ไม่พบข้อมูลผู้ใช้งาน
                                </td>
                            </tr>
                        ) : initialUsers.map((user) => (
                            <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {user.isApproved ? (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                                            อนุมัติแล้ว
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
                                            รออนุมัติ
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-slate-900">{user.name}</div>
                                    <div className="text-xs text-slate-500 font-mono">{user.username}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-slate-900">{user.orgName}</div>
                                    <div className="text-xs text-slate-500">{user.role}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                                    {user.location.provinceName}
                                    <span className="text-slate-400 mx-1">/</span>
                                    {user.location.districtName}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                    {new Date(user.createdAt).toLocaleDateString('th-TH', {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <div className="flex justify-end gap-2">
                                        {/* Edit Button - Always available */}
                                        <button
                                            onClick={() => setEditingUser(user)}
                                            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
                                            title="แก้ไขข้อมูล"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                                            </svg>
                                        </button>

                                        {/* Status Toggle */}
                                        {user.isApproved ? (
                                            <button
                                                onClick={() => toggleStatus(user)}
                                                disabled={isLoading === user.id}
                                                className="p-1.5 text-amber-500 hover:text-amber-700 hover:bg-amber-50 rounded-md transition-colors"
                                                title="ระงับการใช้งาน"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636" />
                                                </svg>
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleApprove(user.id)}
                                                disabled={isLoading === user.id}
                                                className="p-1.5 text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-md transition-colors"
                                                title="อนุมัติ"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                                </svg>
                                            </button>
                                        )}

                                        {/* Delete Button */}
                                        <button
                                            onClick={() => handleReject(user.id)}
                                            disabled={isLoading === user.id}
                                            className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                                            title="ลบผู้ใช้งาน"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                            </svg>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 sm:px-6">
                    <div className="flex flex-1 justify-between sm:hidden">
                        <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="relative inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                        >
                            ก่อนหน้า
                        </button>
                        <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="relative ml-3 inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                        >
                            ถัดไป
                        </button>
                    </div>
                    <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                        <div>
                            <p className="text-sm text-slate-700">
                                แสดง <span className="font-medium">{(currentPage - 1) * 20 + 1}</span> ถึง <span className="font-medium">{Math.min(currentPage * 20, totalUsers)}</span> จาก <span className="font-medium">{totalUsers}</span> รายการ
                            </p>
                        </div>
                        <div>
                            <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                                <button
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className="relative inline-flex items-center rounded-l-md px-2 py-2 text-slate-400 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                                >
                                    <span className="sr-only">Previous</span>
                                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                        <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                                    </svg>
                                </button>

                                {/* Page Numbers - Simple Implementation */}
                                {[...Array(totalPages)].map((_, i) => {
                                    const page = i + 1;
                                    // Show first, last, current, and adjacent pages
                                    if (
                                        page === 1 ||
                                        page === totalPages ||
                                        (page >= currentPage - 1 && page <= currentPage + 1)
                                    ) {
                                        return (
                                            <button
                                                key={page}
                                                onClick={() => handlePageChange(page)}
                                                className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ring-1 ring-inset ring-slate-300 focus:z-20 focus:outline-offset-0 ${currentPage === page
                                                        ? 'bg-emerald-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600'
                                                        : 'text-slate-900 hover:bg-slate-50'
                                                    }`}
                                            >
                                                {page}
                                            </button>
                                        );
                                    } else if (
                                        page === currentPage - 2 ||
                                        page === currentPage + 2
                                    ) {
                                        return <span key={page} className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-slate-700 ring-1 ring-inset ring-slate-300 focus:outline-offset-0">...</span>;
                                    }
                                    return null;
                                })}

                                <button
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className="relative inline-flex items-center rounded-r-md px-2 py-2 text-slate-400 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                                >
                                    <span className="sr-only">Next</span>
                                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                        <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </nav>
                        </div>
                    </div>
                </div>
            )}

            {editingUser && (
                <EditUserModal
                    user={editingUser}
                    onClose={() => setEditingUser(null)}
                    onSuccess={() => {
                        router.refresh()
                    }}
                />
            )}
        </div>
    )
}
