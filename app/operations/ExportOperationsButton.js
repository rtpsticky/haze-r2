'use client'

import { useState } from 'react'
import { getOperationsExportData } from '@/app/actions/operations'
import * as XLSX from 'xlsx'

export default function ExportOperationsButton({ role }) {
    const [isExporting, setIsExporting] = useState(false)

    const handleExport = async () => {
        try {
            setIsExporting(true)
            const data = await getOperationsExportData()
            if (!data || (!data.operations?.length && !data.vulnerables?.length && !data.localSupport?.length)) {
                alert('ไม่พบข้อมูลสำหรับส่งออก')
                return
            }

            // Group by Date and Location
            const grouped = {}

            const initGroup = (dateRaw, locationObj, locationId) => {
                const dateKey = `${dateRaw.toISOString().split('T')[0]}_${locationId}`
                if (!grouped[dateKey]) {
                    grouped[dateKey] = {
                        'วันที่บันทึก': dateRaw.toLocaleDateString('th-TH'),
                        'จังหวัด': locationObj?.provinceName || '-',
                        'อำเภอ': locationObj?.districtName || '-',
                        'ตำบล': locationObj?.subDistrict || '-',

                        // Part 1
                        'ผู้ป่วยติดเตียงรวม(คน)': 0,
                        'สนับสนุนมุ้ง(หลัง)': 0,
                        'อปท.สนับสนุนมุ้ง(หลัง)': 0,

                        // Part 2 PPE General
                        'ปชชท_Surgical Mask': 0,
                        'ปชชท_N95': 0,
                        'ปชชท_Carbon Mask': 0,
                        'ปชชท_Cloth Mask': 0,

                        // Part 2 PPE Children
                        'เด็กเล็ก_Surgical Mask': 0,
                        'เด็กเล็ก_N95': 0,
                        'เด็กเล็ก_Carbon Mask': 0,
                        'เด็กเล็ก_Cloth Mask': 0,

                        // Part 2 PPE Pregnant
                        'หญิงตั้งครรภ์_Surgical Mask': 0,
                        'หญิงตั้งครรภ์_N95': 0,
                        'หญิงตั้งครรภ์_Carbon Mask': 0,
                        'หญิงตั้งครรภ์_Cloth Mask': 0,

                        // Part 2 PPE Elderly
                        'ผู้สูงอายุ_Surgical Mask': 0,
                        'ผู้สูงอายุ_N95': 0,
                        'ผู้สูงอายุ_Carbon Mask': 0,
                        'ผู้สูงอายุ_Cloth Mask': 0,

                        // Part 2 PPE Bedridden
                        'ติดเตียง_Surgical Mask': 0,
                        'ติดเตียง_N95': 0,
                        'ติดเตียง_Carbon Mask': 0,
                        'ติดเตียง_Cloth Mask': 0,

                        // Part 2 PPE Heart
                        'โรคหัวใจ_Surgical Mask': 0,
                        'โรคหัวใจ_N95': 0,
                        'โรคหัวใจ_Carbon Mask': 0,
                        'โรคหัวใจ_Cloth Mask': 0,

                        // Part 2 PPE Respiratory
                        'โรคทางเดินหายใจ_Surgical Mask': 0,
                        'โรคทางเดินหายใจ_N95': 0,
                        'โรคทางเดินหายใจ_Carbon Mask': 0,
                        'โรคทางเดินหายใจ_Cloth Mask': 0,
                    }
                }
                return dateKey
            }

            data.vulnerables.forEach(v => {
                const key = initGroup(new Date(v.recordDate), v.location, v.locationId)
                grouped[key]['ผู้ป่วยติดเตียงรวม(คน)'] += v.targetCount || 0
            })

            data.localSupport.forEach(l => {
                const key = initGroup(new Date(l.recordDate), l.location, l.locationId)
                grouped[key]['อปท.สนับสนุนมุ้ง(หลัง)'] += l.dustNetSupport || 0
            })

            data.operations.forEach(op => {
                const key = initGroup(new Date(op.recordDate), op.location, op.locationId)

                if (op.activityType === 'DUST_NET' && op.targetGroup === 'PATIENTS') {
                    grouped[key]['สนับสนุนมุ้ง(หลัง)'] += op.amount || 0
                }

                if (op.activityType === 'PPE') {
                    let prefix = ''
                    if (op.targetGroup === 'GENERAL_PUBLIC') prefix = 'ปชชท_'
                    else if (op.targetGroup === 'SMALL_CHILDREN') prefix = 'เด็กเล็ก_'
                    else if (op.targetGroup === 'PREGNANT_WOMEN') prefix = 'หญิงตั้งครรภ์_'
                    else if (op.targetGroup === 'ELDERLY') prefix = 'ผู้สูงอายุ_'
                    else if (op.targetGroup === 'BEDRIDDEN') prefix = 'ติดเตียง_'
                    else if (op.targetGroup === 'HEART_DISEASE') prefix = 'โรคหัวใจ_'
                    else if (op.targetGroup === 'RESPIRATORY_DISEASE') prefix = 'โรคทางเดินหายใจ_'

                    if (prefix && grouped[key][`${prefix}${op.itemName}`] !== undefined) {
                        grouped[key][`${prefix}${op.itemName}`] += op.amount || 0
                    }
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
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Operations')

            XLSX.writeFile(workbook, `Operations_Report_${new Date().getTime()}.xlsx`)
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
