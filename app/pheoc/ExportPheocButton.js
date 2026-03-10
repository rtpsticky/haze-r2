'use client'

import { useState } from 'react'
import { getPheocExportData } from '@/app/actions/pheoc'
import * as XLSX from 'xlsx'

export default function ExportPheocButton({ role }) {
    const [isExporting, setIsExporting] = useState(false)

    const handleExport = async () => {
        try {
            setIsExporting(true)
            const data = await getPheocExportData()
            if (!data || data.length === 0) {
                alert('ไม่พบข้อมูลสำหรับส่งออก')
                return
            }

            // Map data to Excel format
            const exportData = data.map((item) => ({
                'วันที่รายงาน': new Date(item.reportDate).toLocaleDateString('th-TH'),
                'สถานะศูนย์': item.status || '-',
                'ระดับการตอบโต้': item.responseLevel || '-',
                'จังหวัด': item.location?.provinceName || '-',
                'อำเภอ': item.location?.districtName || '-',
                'ตำบล': item.location?.subDistrict || '-',
                'ตำแหน่งผู้รายงาน': item.recordedByRole || '-',
                'วันที่บันทึกข้อมูล': new Date(item.recordedAt).toLocaleString('th-TH'),
            }))

            const worksheet = XLSX.utils.json_to_sheet(exportData)
            const workbook = XLSX.utils.book_new()
            XLSX.utils.book_append_sheet(workbook, worksheet, 'PHEOC_Reports')

            XLSX.writeFile(workbook, `PHEOC_Report_${new Date().getTime()}.xlsx`)
        } catch (error) {
            console.error('Export failed:', error)
            alert('เกิดข้อผิดพลาดในการส่งออกข้อมูล')
        } finally {
            setIsExporting(false)
        }
    }

    return (
        <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 hover:text-emerald-600 transition-colors shadow-sm disabled:opacity-50 font-medium text-sm sm:text-base cursor-pointer"
        >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            {isExporting ? 'กำลังส่งออก...' : 'Export Excel'}
        </button>
    )
}
