'use client'

import { useState } from 'react'
import { deleteVulnerableReport } from '@/app/actions/vulnerable'
import EditVulnerableModal from './EditVulnerableModal'

export default function VulnerableHistory({ history, isAdmin, userRole }) {
    const [editData, setEditData] = useState(null)
    const [isEditOpen, setIsEditOpen] = useState(false)
    const [isDeleting, setIsDeleting] = useState(null)

    const handleEdit = (date, records) => {
        setEditData({ date, records })
        setIsEditOpen(true)
    }

    const handleDelete = async (dateStr, locationId) => {
        if (!confirm('ยืนยันการลบข้อมูลของวันที่นี้? ข้อมูลทั้งหมดของวันนี้จะหายไป')) return

        setIsDeleting(dateStr)
        try {
            // Pass locationId if it exists (for admin)
            const res = await deleteVulnerableReport(dateStr, locationId)
            if (!res.success) {
                alert(res.message)
            }
        } catch (error) {
            console.error(error)
            alert('เกิดข้อผิดพลาด')
        } finally {
            setIsDeleting(null)
        }
    }

    const handleCloseModal = (shouldRefresh) => {
        setIsEditOpen(false)
        setEditData(null)
    }

    if (!history || history.length === 0) {
        return (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 text-center text-slate-500 mt-8">
                ยังไม่มีประวัติการบันทึกข้อมูล
            </div>
        )
    }

    return (
        <>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mt-8">
                <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
                    <h3 className="text-lg font-semibold text-slate-800">ประวัติการบันทึกข้อมูล</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-sm font-semibold text-slate-600">วันที่</th>
                                {isAdmin && <th scope="col" className="px-6 py-3 text-left text-sm font-semibold text-slate-600">หน่วยงาน</th>}
                                <th scope="col" className="px-6 py-3 text-center text-sm font-semibold text-slate-600">จำนวนรวม (คน)</th>
                                <th scope="col" className="px-6 py-3 text-right text-sm font-semibold text-slate-600">จัดการ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 bg-white">
                            {history.map((item) => (
                                <tr key={item.date} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                                        {new Date(item.date).toLocaleDateString('th-TH', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </td>
                                    {isAdmin && (
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                            {item.locationName || '-'}
                                        </td>
                                    )}
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 text-center">
                                        <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-1 text-sm font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                                            {item.totalCount.toLocaleString()}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => handleEdit(item.date, item.records)}
                                                disabled={isDeleting === item.date}
                                                // Disable edit for admin if not clear ownership, or just allow view. 
                                                // Assuming admin usually just views history here. 
                                                // But let's keep it enabled if they want to view details.
                                                className="text-indigo-600 hover:text-indigo-900 px-3 py-1.5 rounded hover:bg-indigo-50 transition-colors disabled:opacity-50"
                                            >
                                                ดู/แก้ไข
                                            </button>
                                            <button
                                                onClick={() => handleDelete(item.date, item.locationId)}
                                                disabled={isDeleting === item.date}
                                                className="text-red-600 hover:text-red-900 px-3 py-1.5 rounded hover:bg-red-50 transition-colors disabled:opacity-50"
                                            >
                                                {isDeleting === item.date ? 'กำลังลบ...' : 'ลบ'}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {isEditOpen && editData && (
                <EditVulnerableModal
                    isOpen={isEditOpen}
                    onClose={handleCloseModal}
                    date={editData.date}
                    initialRecords={editData.records}
                />
            )}
        </>
    )
}
