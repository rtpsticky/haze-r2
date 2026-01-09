'use client'

import { useActionState, useState } from 'react'
import { savePheocReport } from '@/app/actions/pheoc'
import Link from 'next/link'

const initialState = {
    message: '',
    success: false
}

export default function PheocPage() {
    const [state, formAction, isPending] = useActionState(savePheocReport, initialState)
    const [mainStatus, setMainStatus] = useState('NOT_OPEN') // 'NOT_OPEN', 'OPEN', 'CLOSED'

    if (state.success) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
                    <div className="mx-auto h-16 w-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-emerald-600">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">บันทึกสำเร็จ</h2>
                    <p className="text-slate-500 mb-6">บันทึกรายงานสถานะ PHEOC เรียบร้อยแล้ว</p>
                    <div className="flex flex-col gap-3">
                        <Link href="/" className="w-full inline-flex justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600">
                            กลับสู่หน้าหลัก
                        </Link>
                        <button onClick={() => window.location.reload()} className="w-full inline-flex justify-center rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50">
                            บันทึกข้อมูลเพิ่ม
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-50 py-8">
            <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-8 flex items-center gap-4">
                    <Link href="/" className="p-2 rounded-lg bg-white shadow-sm text-slate-500 hover:text-emerald-600 hover:shadow transition-all">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                        </svg>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">รายงาน PHEOC</h1>
                        <p className="text-slate-500 text-sm">บันทึกสถานะศูนย์ปฏิบัติการฉุกเฉิน</p>
                    </div>
                </div>

                <form action={formAction} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-6 space-y-8">
                        {/* Date Selection */}
                        <div>
                            <label htmlFor="reportDate" className="block text-sm font-medium text-slate-800 mb-2">
                                วันที่รายงาน
                            </label>
                            <input
                                type="date"
                                name="reportDate"
                                id="reportDate"
                                required
                                defaultValue={new Date().toISOString().split('T')[0]}
                                className="block w-full rounded-lg border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
                            />
                        </div>

                        {/* Status Selection */}
                        <div>
                            <label className="block text-sm font-medium text-slate-800 mb-4">
                                สถานะ PHEOC
                            </label>
                            <div className="space-y-4">
                                {/* Option 1: Not Open */}
                                <div className={`rounded-xl border p-4 transition-all ${mainStatus === 'NOT_OPEN' ? 'border-emerald-500 bg-emerald-50/30' : 'border-slate-200'}`}>
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="status"
                                            value="NOT_OPEN"
                                            checked={mainStatus === 'NOT_OPEN'}
                                            onChange={() => setMainStatus('NOT_OPEN')}
                                            className="w-5 h-5 text-emerald-600 border-slate-300 focus:ring-emerald-600"
                                        />
                                        <span className="font-semibold text-slate-800">ยังไม่เปิด</span>
                                    </label>

                                    {mainStatus === 'NOT_OPEN' && (
                                        <div className="mt-4 ml-8 space-y-3 animate-in fade-in slide-in-from-top-2">
                                            <label className="flex items-start gap-3 cursor-pointer">
                                                <input type="radio" name="subStatusNotOpen" value="WATCH" defaultChecked className="mt-1 w-4 h-4 text-emerald-600 border-slate-300 focus:ring-emerald-600" />
                                                <div>
                                                    <span className="block text-slate-800 font-medium">เฝ้าระวังปกติ (Watch mode)</span>
                                                    <span className="block text-slate-500 text-xs">PM 2.5 ระหว่าง 0 - 37.5 µg/m³</span>
                                                </div>
                                            </label>
                                            <label className="flex items-start gap-3 cursor-pointer">
                                                <input type="radio" name="subStatusNotOpen" value="ALERT" className="mt-1 w-4 h-4 text-emerald-600 border-slate-300 focus:ring-emerald-600" />
                                                <div>
                                                    <span className="block text-slate-800 font-medium">เฝ้าระวังใกล้ชิด (Alert mode)</span>
                                                    <span className="block text-slate-500 text-xs">PM 2.5 ระหว่าง 37.6 - 75.0 µg/m³</span>
                                                </div>
                                            </label>
                                        </div>
                                    )}
                                </div>

                                {/* Option 2: Open PHEOC */}
                                <div className={`rounded-xl border p-4 transition-all ${mainStatus === 'OPEN' ? 'border-amber-500 bg-amber-50/30' : 'border-slate-200'}`}>
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="status"
                                            value="OPEN"
                                            checked={mainStatus === 'OPEN'}
                                            onChange={() => setMainStatus('OPEN')}
                                            className="w-5 h-5 text-amber-600 border-slate-300 focus:ring-amber-600"
                                        />
                                        <span className="font-semibold text-slate-800">เปิด PHEOC</span>
                                    </label>

                                    {mainStatus === 'OPEN' && (
                                        <div className="mt-4 ml-8 space-y-3 animate-in fade-in slide-in-from-top-2">
                                            <label className="flex items-start gap-3 cursor-pointer">
                                                <input type="radio" name="subStatusOpen" value="RESPONSE_1" defaultChecked className="mt-1 w-4 h-4 text-amber-600 border-slate-300 focus:ring-amber-600" />
                                                <div>
                                                    <span className="block text-slate-800 font-medium">ระดับตอบโต้ 1 (Response-1)</span>
                                                    <span className="block text-slate-500 text-xs">PM 2.5 ระหว่าง 75.1-150 µg/m³ ติดต่อกัน 2 วัน</span>
                                                </div>
                                            </label>
                                            <label className="flex items-start gap-3 cursor-pointer">
                                                <input type="radio" name="subStatusOpen" value="RESPONSE_2" className="mt-1 w-4 h-4 text-amber-600 border-slate-300 focus:ring-amber-600" />
                                                <div>
                                                    <span className="block text-slate-800 font-medium">ระดับตอบโต้ 2 (Response-2)</span>
                                                    <span className="block text-slate-500 text-xs">PM 2.5 มากกว่า 150 µg/m³ ติดต่อกัน 5 วัน</span>
                                                </div>
                                            </label>
                                        </div>
                                    )}
                                </div>

                                {/* Option 3: Closed */}
                                <div className={`rounded-xl border p-4 transition-all ${mainStatus === 'CLOSED' ? 'border-slate-500 bg-slate-50' : 'border-slate-200'}`}>
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="status"
                                            value="CLOSED"
                                            checked={mainStatus === 'CLOSED'}
                                            onChange={() => setMainStatus('CLOSED')}
                                            className="w-5 h-5 text-slate-600 border-slate-300 focus:ring-slate-600"
                                        />
                                        <span className="font-semibold text-slate-800">ปิดศูนย์</span>
                                    </label>
                                    {mainStatus === 'CLOSED' && (
                                        <div className="mt-2 ml-8 animate-in fade-in slide-in-from-top-2">
                                            <span className="block text-slate-500 text-sm">PM 2.5 น้อยกว่า 75.0 µg/m³ ติดต่อกัน 7 วัน</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* File Upload */}
                        <div>
                            <label htmlFor="file" className="block text-sm font-medium text-slate-800 mb-2">
                                ประวัติการเปิด-ปิดศูนย์ PHEOC (ไฟล์ PDF)
                            </label>
                            <div className="mt-1 flex justify-center rounded-lg border border-dashed border-slate-300 px-6 py-10 hover:bg-slate-50 transition-colors">
                                <div className="text-center">
                                    <svg className="mx-auto h-12 w-12 text-slate-300" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                        <path fillRule="evenodd" d="M1.5 6a2.25 2.25 0 012.25-2.25h16.5A2.25 2.25 0 0122.5 6v12a2.25 2.25 0 01-2.25 2.25H3.75A2.25 2.25 0 011.5 18V6zM3 16.06V18c0 .414.336.75.75.75h16.5A.75.75 0 0021 18v-1.94l-2.69-2.689a1.5 1.5 0 00-2.12 0l-.88.879.97.97a.75.75 0 11-1.06 1.06l-5.16-5.159a1.5 1.5 0 00-2.12 0L3 16.061zm10.125-7.81a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0z" clipRule="evenodd" />
                                    </svg>
                                    <div className="mt-4 flex text-sm leading-6 text-slate-600 justify-center">
                                        <label htmlFor="file-upload" className="relative cursor-pointer rounded-md bg-white font-semibold text-emerald-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-emerald-600 focus-within:ring-offset-2 hover:text-emerald-500">
                                            <span>Upload a file</span>
                                            <input id="file-upload" name="file" type="file" accept=".pdf" className="sr-only" />
                                        </label>
                                        <p className="pl-1">or drag and drop</p>
                                    </div>
                                    <p className="text-xs leading-5 text-slate-500">PDF up to 10MB</p>
                                </div>
                            </div>
                        </div>

                    </div>

                    <div className="bg-slate-50 px-6 py-4 flex items-center justify-between border-t border-slate-100">
                        {state?.message ? (
                            <span className="text-sm font-medium text-red-600">{state.message}</span>
                        ) : (<span></span>)}

                        <button
                            type="submit"
                            disabled={isPending}
                            className="rounded-xl bg-emerald-600 px-8 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isPending ? 'กำลังบันทึก...' : 'บันทึกรายงาน'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
