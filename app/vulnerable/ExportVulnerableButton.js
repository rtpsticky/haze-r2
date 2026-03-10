'use client'

import { useState } from 'react'
import { getVulnerableExportData } from '@/app/actions/vulnerable'
import * as XLSX from 'xlsx'

export default function ExportVulnerableButton({ role }) {
    const [isExporting, setIsExporting] = useState(false)

    const handleExport = async () => {
        try {
            setIsExporting(true)
            const data = await getVulnerableExportData()
            if (!data || data.length === 0) {
                alert('ไม่พบข้อมูลสำหรับส่งออก')
                return
            }

            // Group by Date and Location
            const grouped = {}
            data.forEach((item) => {
                const dateRaw = new Date(item.recordDate)
                const dateKey = `${dateRaw.toISOString().split('T')[0]}_${item.locationId}`

                if (!grouped[dateKey]) {
                    grouped[dateKey] = {
                        'วันที่บันทึก': dateRaw.toLocaleDateString('th-TH'),
                        'จังหวัด': item.location?.provinceName || '-',
                        'อำเภอ': item.location?.districtName || '-',
                        'ตำบล': item.location?.subDistrict || '-',
                        'กลุ่มเด็กเล็ก (0-5 ปี)': 0,
                        'กลุ่มหญิงตั้งครรภ์': 0,
                        'กลุ่มผู้สูงอายุ': 0,
                        'กลุ่มติดเตียง': 0,
                        'กลุ่มผู้ที่มีโรคหัวใจ': 0,
                        'กลุ่มผู้ที่มีโรคระบบทางเดินหายใจ': 0,
                        'รวมทั้งหมด (คน)': 0
                    }
                }

                // Map the groupType to the corresponding key (if matched)
                if (grouped[dateKey].hasOwnProperty(item.groupType)) {
                    grouped[dateKey][item.groupType] = item.targetCount
                }

                grouped[dateKey]['รวมทั้งหมด (คน)'] += item.targetCount
            })

            const exportData = Object.values(grouped).sort((a, b) => {
                // Sort by date descending
                const [dayA, monthA, yearA] = a['วันที่บันทึก'].split('/')
                const dateA = new Date(yearA - 543, monthA - 1, dayA)
                const [dayB, monthB, yearB] = b['วันที่บันทึก'].split('/')
                const dateB = new Date(yearB - 543, monthB - 1, dayB)
                return dateB - dateA
            })

            const worksheet = XLSX.utils.json_to_sheet(exportData)
            const workbook = XLSX.utils.book_new()
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Vulnerable_Groups')

            XLSX.writeFile(workbook, `Vulnerable_Groups_Report_${new Date().getTime()}.xlsx`)
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
