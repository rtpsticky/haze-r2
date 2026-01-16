'use client'

import { useActionState, useState, useEffect } from 'react'
import { savePheocReport } from '@/app/actions/pheoc'
import Swal from 'sweetalert2'

const initialState = {
    message: '',
    success: false
}

export default function PheocForm({ initialData, onCancel, onSuccess, idPrefix = '', className = '' }) {
    const [state, formAction, isPending] = useActionState(savePheocReport, initialState)
    const [mainStatus, setMainStatus] = useState('NOT_OPEN') // 'NOT_OPEN', 'OPEN', 'CLOSED'
    const [subStatusNotOpen, setSubStatusNotOpen] = useState('WATCH')
    const [subStatusOpen, setSubStatusOpen] = useState('RESPONSE_1')
    const [filename, setFilename] = useState('')

    useEffect(() => {
        if (state.success) {
            Swal.fire({
                title: 'บันทึกสำเร็จ',
                text: state.message,
                icon: 'success',
                confirmButtonText: 'ตกลง',
                confirmButtonColor: '#059669'
            }).then(() => {
                if (onSuccess) onSuccess();
            });
        } else if (state.message) {
            Swal.fire({
                title: 'พบข้อผิดพลาด',
                text: state.message,
                icon: 'error',
                confirmButtonText: 'ตกลง',
                confirmButtonColor: '#dc2626'
            });
        }
    }, [state, onSuccess]);

    useEffect(() => {
        if (initialData) {
            // Map initialData back to form state
            // DB Status: 'เฝ้าระวังปกติ', 'เฝ้าระวังใกล้ชิด', 'ยังไม่เปิด', 'เปิด PHEOC', 'ปิดศูนย์'
            // Response Level: 'ระดับตอบโต้ 1', 'ระดับตอบโต้ 2'

            if (initialData.status === 'เปิด PHEOC') {
                setMainStatus('OPEN')
                if (initialData.responseLevel === 'ระดับตอบโต้ 1') setSubStatusOpen('RESPONSE_1')
                else if (initialData.responseLevel === 'ระดับตอบโต้ 2') setSubStatusOpen('RESPONSE_2')
            } else if (initialData.status === 'ปิดศูนย์') {
                setMainStatus('CLOSED')
            } else {
                setMainStatus('NOT_OPEN')
                if (initialData.status === 'เฝ้าระวังปกติ') setSubStatusNotOpen('WATCH')
                else if (initialData.status === 'เฝ้าระวังใกล้ชิด') setSubStatusNotOpen('ALERT')
            }
        } else {
            // Reset to default
            setMainStatus('NOT_OPEN')
            setSubStatusNotOpen('WATCH')
            setSubStatusOpen('RESPONSE_1')
        }
    }, [initialData])

    return (
        <form action={formAction} className={`bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-8 ${className}`}>
            <div className="bg-emerald-50/50 px-6 py-4 border-b border-emerald-100 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-emerald-800">
                    {initialData ? 'แก้ไขรายงาน' : 'บันทึกรายงานใหม่'}
                </h2>
                {initialData && (
                    <button
                        type="button"
                        onClick={onCancel}
                        className="text-sm text-slate-500 hover:text-slate-700 underline"
                    >
                        ยกเลิกการแก้ไข
                    </button>
                )}
            </div>

            <div className="p-6 space-y-8">
                <input type="hidden" name="id" value={initialData?.id || ''} />

                {/* Date Selection */}
                <div>
                    <label htmlFor={`${idPrefix}reportDate`} className="block text-sm font-medium text-slate-800 mb-2">
                        วันที่รายงาน
                    </label>
                    <input
                        type="date"
                        name="reportDate"
                        id={`${idPrefix}reportDate`}
                        required
                        defaultValue={initialData ? new Date(initialData.reportDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}
                        className="block w-full rounded-lg border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
                    />
                </div>

                {/* Status Selection */}
                <div>
                    <label className="block text-sm font-medium text-slate-800 mb-4">
                        สถานะ PHEOC
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Option 2: Open PHEOC (High Priority) */}
                        <div
                            className={`relative rounded-xl border-2 p-4 cursor-pointer transition-all hover:shadow-md ${mainStatus === 'OPEN' ? 'border-amber-500 bg-amber-50' : 'border-slate-200 hover:border-amber-200'}`}
                            onClick={() => setMainStatus('OPEN')}
                        >
                            <div className="flex items-center gap-3 mb-3">
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${mainStatus === 'OPEN' ? 'border-amber-500' : 'border-slate-300'}`}>
                                    {mainStatus === 'OPEN' && <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />}
                                </div>
                                <span className="font-bold text-lg text-slate-800">เปิด PHEOC</span>
                            </div>

                            {mainStatus === 'OPEN' && (
                                <div className="space-y-3 mt-4 animate-in fade-in zoom-in-95 duration-200">
                                    <label className={`block p-3 rounded-lg border cursor-pointer hover:bg-white transition-colors ${subStatusOpen === 'RESPONSE_1' ? 'bg-white border-amber-500 shadow-sm' : 'border-amber-200 bg-amber-100/50'}`}>
                                        <div className="flex items-center gap-2 mb-1">
                                            <input type="radio" name="subStatusOpen" value="RESPONSE_1" checked={subStatusOpen === 'RESPONSE_1'} onChange={() => setSubStatusOpen('RESPONSE_1')} className="text-amber-600 focus:ring-amber-500" />
                                            <span className="font-semibold text-slate-800">ระดับตอบโต้ 1</span>
                                        </div>
                                        <span className="text-xs text-slate-500 block pl-6">PM 2.5 75.1-150 µg/m³ (2 วัน)</span>
                                    </label>
                                    <label className={`block p-3 rounded-lg border cursor-pointer hover:bg-white transition-colors ${subStatusOpen === 'RESPONSE_2' ? 'bg-white border-amber-500 shadow-sm' : 'border-amber-200 bg-amber-100/50'}`}>
                                        <div className="flex items-center gap-2 mb-1">
                                            <input type="radio" name="subStatusOpen" value="RESPONSE_2" checked={subStatusOpen === 'RESPONSE_2'} onChange={() => setSubStatusOpen('RESPONSE_2')} className="text-amber-600 focus:ring-amber-500" />
                                            <span className="font-semibold text-slate-800">ระดับตอบโต้ 2</span>
                                        </div>
                                        <span className="text-xs text-slate-500 block pl-6">PM 2.5 {'>'} 150 µg/m³ (5 วัน)</span>
                                    </label>
                                </div>
                            )}
                        </div>

                        {/* Option 1: Not Open */}
                        <div
                            className={`relative rounded-xl border-2 p-4 cursor-pointer transition-all hover:shadow-md ${mainStatus === 'NOT_OPEN' ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:border-emerald-200'}`}
                            onClick={() => setMainStatus('NOT_OPEN')}
                        >
                            <div className="flex items-center gap-3 mb-3">
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${mainStatus === 'NOT_OPEN' ? 'border-emerald-500' : 'border-slate-300'}`}>
                                    {mainStatus === 'NOT_OPEN' && <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />}
                                </div>
                                <span className="font-bold text-lg text-slate-800">ยังไม่เปิด</span>
                            </div>

                            {mainStatus === 'NOT_OPEN' && (
                                <div className="space-y-3 mt-4 animate-in fade-in zoom-in-95 duration-200">
                                    <label className={`block p-3 rounded-lg border cursor-pointer hover:bg-white transition-colors ${subStatusNotOpen === 'WATCH' ? 'bg-white border-emerald-500 shadow-sm' : 'border-emerald-200 bg-emerald-100/50'}`}>
                                        <div className="flex items-center gap-2 mb-1">
                                            <input type="radio" name="subStatusNotOpen" value="WATCH" checked={subStatusNotOpen === 'WATCH'} onChange={() => setSubStatusNotOpen('WATCH')} className="text-emerald-600 focus:ring-emerald-500" />
                                            <span className="font-semibold text-slate-800">เฝ้าระวังปกติ</span>
                                        </div>
                                        <span className="text-xs text-slate-500 block pl-6">PM 2.5 0 - 37.5 µg/m³</span>
                                    </label>
                                    <label className={`block p-3 rounded-lg border cursor-pointer hover:bg-white transition-colors ${subStatusNotOpen === 'ALERT' ? 'bg-white border-emerald-500 shadow-sm' : 'border-emerald-200 bg-emerald-100/50'}`}>
                                        <div className="flex items-center gap-2 mb-1">
                                            <input type="radio" name="subStatusNotOpen" value="ALERT" checked={subStatusNotOpen === 'ALERT'} onChange={() => setSubStatusNotOpen('ALERT')} className="text-emerald-600 focus:ring-emerald-500" />
                                            <span className="font-semibold text-slate-800">เฝ้าระวังใกล้ชิด</span>
                                        </div>
                                        <span className="text-xs text-slate-500 block pl-6">PM 2.5 37.6 - 75.0 µg/m³</span>
                                    </label>
                                </div>
                            )}
                        </div>

                        {/* Option 3: Closed */}
                        <div
                            className={`relative rounded-xl border-2 p-4 cursor-pointer transition-all hover:shadow-md ${mainStatus === 'CLOSED' ? 'border-slate-500 bg-slate-50' : 'border-slate-200 hover:border-slate-300'}`}
                            onClick={() => setMainStatus('CLOSED')}
                        >
                            <div className="flex items-center gap-3 mb-3">
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${mainStatus === 'CLOSED' ? 'border-slate-500' : 'border-slate-300'}`}>
                                    {mainStatus === 'CLOSED' && <div className="w-2.5 h-2.5 rounded-full bg-slate-500" />}
                                </div>
                                <span className="font-bold text-lg text-slate-800">ปิดศูนย์</span>
                            </div>

                            {mainStatus === 'CLOSED' && (
                                <div className="mt-4 p-3 rounded-lg bg-slate-100 border border-slate-200">
                                    <span className="text-xs text-slate-500 text-center block">PM 2.5 {'<'} 75.0 µg/m³ (7 วัน)</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Hidden Inputs for Form Submission */}
                <input type="hidden" name="status" value={mainStatus} />

                {/* File Upload */}
                <div>
                    <label className="block text-sm font-medium text-slate-800 mb-2">
                        ประวัติการเปิด-ปิดศูนย์ PHEOC (ไฟล์ PDF)
                    </label>
                    <div className="mt-1 flex justify-center rounded-xl border-2 border-dashed border-slate-300 px-6 py-10 hover:border-emerald-400 hover:bg-emerald-50/10 transition-all cursor-pointer group relative">
                        <input
                            id={`${idPrefix}file-upload`}
                            name="file"
                            type="file"
                            accept=".pdf"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            onChange={(e) => {
                                const file = e.target.files[0];
                                if (file) {
                                    setFilename(file.name);
                                } else {
                                    setFilename('');
                                }
                            }}
                        />
                        <div className="text-center pointer-events-none">
                            <div className="mx-auto h-12 w-12 text-slate-300 group-hover:text-emerald-500 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                                </svg>
                            </div>
                            <div className="mt-4 flex text-sm leading-6 text-slate-600 justify-center">
                                <span className="relative rounded-md font-semibold text-emerald-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-emerald-600 focus-within:ring-offset-2 hover:text-emerald-500">
                                    อัปโหลดไฟล์
                                </span>
                                <p className="pl-1">หรือลากไฟล์มาวางที่นี่</p>
                            </div>
                            <p className="text-xs leading-5 text-slate-500">รองรับไฟล์ PDF (สูงสุด 10MB)</p>

                            {filename && (
                                <div className="mt-4 p-2 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-medium border border-emerald-200 inline-block">
                                    ไฟล์ที่เลือก: {filename}
                                </div>
                            )}
                        </div>
                    </div>
                    {initialData?.pdfUrl && (
                        <div className="mt-3 flex items-center gap-2 text-sm text-slate-600 bg-emerald-50 p-3 rounded-lg border border-emerald-100">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-emerald-600">
                                <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm.75-11.25a.75.75 0 0 0-1.5 0v2.5h-2.5a.75.75 0 0 0 0 1.5h2.5v2.5a.75.75 0 0 0 1.5 0v-2.5h2.5a.75.75 0 0 0 0-1.5h-2.5v-2.5Z" clipRule="evenodd" />
                            </svg>
                            <span>มีไฟล์เดิมอยู่แล้ว:</span>
                            <a href={initialData.pdfUrl} target="_blank" className="font-semibold text-emerald-600 underline hover:text-emerald-700">เปิดดูไฟล์ PDF</a>
                        </div>
                    )}
                </div>

            </div>

            <div className="bg-slate-50 px-6 py-4 flex items-center justify-between border-t border-slate-100">
                {/* Error message removed as it is now handled by SweetAlert */}

                <button
                    type="submit"
                    disabled={isPending}
                    className="rounded-xl bg-emerald-600 px-8 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {isPending ? 'กำลังบันทึก...' : (initialData ? 'บันทึกการแก้ไข' : 'บันทึกรายงาน')}
                </button>
            </div>
        </form>
    )
}
