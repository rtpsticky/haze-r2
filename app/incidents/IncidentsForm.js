'use client'

'use client'

import { useActionState, useEffect } from 'react'
import { createIncident } from '@/app/actions/incidents'

const initialState = {
    message: '',
    success: false
}

export default function IncidentsForm() {
    const [state, formAction, isPending] = useActionState(createIncident, initialState)

    useEffect(() => {
        if (state.success) {
            alert('บันทึกข้อมูลสำเร็จ')
            // Option: Reset form here if needed, or redirect
        }
    }, [state.success])

    return (
        <form action={formAction} className="space-y-6 font-sarabun text-slate-900">
            {/* Header Text */}
            <h2 className="text-lg font-bold mb-4">• รายงานผลกระทบต่อสุขภาพของเจ้าหน้าที่และจิตอาสาดับไฟ</h2>

            {state.message && (
                <div className={`p-4 rounded-md ${state.success ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                    {state.message}
                </div>
            )}

            {/* Location & Date - Standard Style */}
            <div className="grid grid-cols-1 gap-6">
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">จังหวัด อำเภอ ตำบล</label>
                    <div className="grid grid-cols-3 gap-2">
                        <select disabled className="block w-full rounded-md border-gray-300 bg-gray-100 shadow-sm focus:border-red-500 focus:ring-red-500 text-sm">
                            <option>ตามหน่วยงานผู้ใช้</option>
                        </select>
                        <select disabled className="block w-full rounded-md border-gray-300 bg-gray-100 shadow-sm focus:border-red-500 focus:ring-red-500 text-sm">
                            <option>-</option>
                        </select>
                        <select disabled className="block w-full rounded-md border-gray-300 bg-gray-100 shadow-sm focus:border-red-500 focus:ring-red-500 text-sm">
                            <option>-</option>
                        </select>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">* ระบบจะบันทึกข้อมูลตามพื้นที่ของหน่วยงานท่านอัตโนมัติ</p>
                </div>

                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">วันที่บันทึกข้อมูล</label>
                    <input type="date" name="recordDate" required className="block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 text-sm" />
                </div>
            </div>

            {/* Victim Information - Red Style as per image */}
            <div className="space-y-4 pt-4">
                <div>
                    <label className="block text-md font-bold text-red-600 mb-2">
                        ชื่อ-นามสกุล (เจ้าหน้าที่/จิตอาสา ดับไฟป่า)
                    </label>
                    <input type="text" name="staffName" required className="block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500" placeholder="ระบุชื่อ-นามสกุล" />
                </div>

                <div>
                    <label className="block text-md font-bold text-red-600 mb-2">
                        สถานะ: บาดเจ็บ เสียชีวิต (สามารถเลือกได้)
                    </label>
                    <div className="flex gap-6 mt-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="radio" name="status" value="บาดเจ็บ" className="w-5 h-5 text-red-600 border-gray-300 focus:ring-red-500" required />
                            <span>บาดเจ็บ</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="radio" name="status" value="เสียชีวิต" className="w-5 h-5 text-red-600 border-gray-300 focus:ring-red-500" />
                            <span>เสียชีวิต</span>
                        </label>
                    </div>
                </div>

                <div>
                    <label className="block text-md font-bold text-red-600 mb-2">
                        รายละเอียดเหตุการณ์
                    </label>
                    <textarea name="incidentDetails" required rows={4} className="block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500" placeholder="ระบุรายละเอียดเหตุการณ์..." />
                </div>
            </div>

            <div className="flex justify-end pt-6 border-t border-slate-200">
                <button
                    type="submit"
                    disabled={isPending}
                    className="rounded-xl bg-emerald-600 px-8 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:bg-gray-400"
                >
                    {isPending ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
                </button>
            </div>
        </form>
    )
}

