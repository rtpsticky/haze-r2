'use client'

import { useState } from 'react'
import { getActiveCareExportData } from '@/app/actions/active-care'
import * as XLSX from 'xlsx'

export default function ExportActiveCareButton() {
    const [isExporting, setIsExporting] = useState(false)

    const handleExport = async () => {
        try {
            setIsExporting(true)
            const data = await getActiveCareExportData()
            if (!data || (!data.activeCares?.length && !data.adminSupport?.length)) {
                alert('ไม่พบข้อมูลสำหรับส่งออก')
                return
            }

            const grouped = {}
            const initGroup = (dateRaw, locationObj, locationId) => {
                const dateKey = `${dateRaw.toISOString().split('T')[0]}_${locationId}`
                if (!grouped[dateKey]) {
                    grouped[dateKey] = {
                        'วันที่บันทึก': dateRaw.toLocaleDateString('th-TH'),
                        'จังหวัด': locationObj?.provinceName || '-',
                        'อำเภอ': locationObj?.districtName || '-',
                        'ตำบล': locationObj?.subDistrict || '-',

                        'อปท_จัดตั้งศูนย์(แห่ง)': 0,
                        'อปท_สนับสนุนหน้ากาก(ชิ้น)': 0,
                        'อปท_สนับสนุนมุ้ง(หลัง)': 0,
                        'อปท_สนับสนุนห้องปลอดฝุ่น(แห่ง)': 0,

                        'สอบสวนโรค_ครัวเรือน': 0,
                        'สอบสวนโรค_ราย': 0,
                        'สอบสวนโรค_กลุ่มเสี่ยง': 0,

                        'ดูแลสุขภาพจิต_ครัวเรือน': 0,
                        'ดูแลสุขภาพจิต_ราย': 0,
                        'ดูแลสุขภาพจิต_กลุ่มเสี่ยง': 0,

                        'รักษาพยาบาลเบื้องต้น_ครัวเรือน': 0,
                        'รักษาพยาบาลเบื้องต้น_ราย': 0,
                        'รักษาพยาบาลเบื้องต้น_กลุ่มเสี่ยง': 0,
                    }
                }
                return dateKey
            }

            data.adminSupport.forEach(s => {
                const key = initGroup(new Date(s.recordDate), s.location, s.locationId)
                grouped[key]['อปท_จัดตั้งศูนย์(แห่ง)'] = s.orgCount || 0
                grouped[key]['อปท_สนับสนุนหน้ากาก(ชิ้น)'] = s.maskSupport || 0
                grouped[key]['อปท_สนับสนุนมุ้ง(หลัง)'] = s.dustNetSupport || 0
                grouped[key]['อปท_สนับสนุนห้องปลอดฝุ่น(แห่ง)'] = s.cleanRoomSupport || 0
            })

            data.activeCares.forEach(c => {
                const key = initGroup(new Date(c.recordDate), c.location, c.locationId)
                let prefix = ''
                if (c.activity === 'การสอบสวนโรค') prefix = 'สอบสวนโรค'
                else if (c.activity === 'การดูแลสุขภาพจิต') prefix = 'ดูแลสุขภาพจิต'
                else if (c.activity === 'การรักษาพยาบาลเบื้องต้น') prefix = 'รักษาพยาบาลเบื้องต้น'

                if (prefix) {
                    grouped[key][`${prefix}_ครัวเรือน`] = c.households || 0
                    grouped[key][`${prefix}_ราย`] = c.people || 0
                    grouped[key][`${prefix}_กลุ่มเสี่ยง`] = c.riskGroups || 0
                }
            })

            const exportData = Object.values(grouped).sort((a, b) => {
                const [dayA, monthA, yearA] = a['วันที่บันทึก'].split('/')
                const dateA = new Date(yearA - 543, monthA - 1, dayA)
                const [dayB, monthB, yearB] = b['วันที่บันทึก'].split('/')
                const dateB = new Date(yearB - 543, monthB - 1, dayB)
                return dateB - dateA
            })

            const worksheet = XLSX.utils.json_to_sheet(exportData)
            const workbook = XLSX.utils.book_new()
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Active_Care')
            XLSX.writeFile(workbook, `Active_Care_Report_${new Date().getTime()}.xlsx`)
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
