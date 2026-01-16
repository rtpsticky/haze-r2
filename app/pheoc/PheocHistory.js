'use client'

import { deletePheocReport } from "@/app/actions/pheoc"
import { useTransition } from "react"
import Swal from 'sweetalert2'

export default function PheocHistory({ reports, onEdit }) {
    const [isPending, startTransition] = useTransition()

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: 'ยืนยันการลบ?',
            text: "คุณต้องการลบรายงานนี้ใช่หรือไม่? ข้อมูลจะไม่สามารถกู้คืนได้",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'ใช่, ลบเลย',
            cancelButtonText: 'ยกเลิก'
        })

        if (result.isConfirmed) {
            startTransition(async () => {
                const res = await deletePheocReport(id)
                if (res.success) {
                    Swal.fire({
                        title: 'ลบสำเร็จ!',
                        text: res.message,
                        icon: 'success',
                        confirmButtonText: 'ตกลง',
                        confirmButtonColor: '#059669'
                    })
                } else {
                    Swal.fire({
                        title: 'เกิดข้อผิดพลาด',
                        text: res.message,
                        icon: 'error',
                        confirmButtonText: 'ตกลง',
                        confirmButtonColor: '#dc2626'
                    })
                }
            })
        }
    }

    if (reports.length === 0) {
        return <div className="text-center text-slate-500 py-8">ไม่มีประวัติการรายงาน</div>
    }

    return (
        <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-800">ประวัติการรายงาน</h2>
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">วันที่</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">สถานะ</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">ระดับตอบโต้</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">ไฟล์แนบ</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">จัดการ</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {reports.map((report) => (
                                <tr key={report.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                                        {new Date(report.reportDate).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium
                                            ${report.status === 'เปิด PHEOC' ? 'bg-amber-100 text-amber-800' :
                                                report.status === 'ปิดศูนย์' ? 'bg-slate-100 text-slate-800' : 'bg-emerald-100 text-emerald-800'}
                                        `}>
                                            {report.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                        {report.responseLevel || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                        {report.pdfUrl ? (
                                            <a href={report.pdfUrl} target="_blank" className="text-emerald-600 hover:text-emerald-800 underline">
                                                ดูไฟล์
                                            </a>
                                        ) : '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button
                                            onClick={() => onEdit(report)}
                                            className="text-indigo-600 hover:text-indigo-900 mr-4"
                                        >
                                            แก้ไข
                                        </button>
                                        <button
                                            disabled={isPending}
                                            onClick={() => handleDelete(report.id)}
                                            className="text-red-600 hover:text-red-900 disabled:opacity-50"
                                        >
                                            {isPending ? '...' : 'ลบ'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
