'use client'

import { useActionState, useState, useEffect } from 'react'
import { saveMeasures } from '@/app/actions/measures'
import Link from 'next/link'

const measuresData = [
    {
        id: 1,
        title: 'มาตรการที่ 1 สร้างความรอบรู้ และส่งเสริมองค์กรลดมลพิษ',
        items: [
            { id: '1.1', label: '1.1 สื่อสารประชาสัมพันธ์เชิงรุก สร้างความรอบรู้ และสร้างความเข้มแข็งของชุมชนและประชาชน (Online / On ground/ศูนย์ข้อมูลสุขภาพ/สุขภาพจิตกับพฤติกรรมเสี่ยง)' },
            { id: '1.2', label: '1.2 ส่งเสริมหน่วยงานในสังกัด สธ. เป็นองค์กรลดมลพิษ' },
        ]
    },
    {
        id: 2,
        title: 'มาตรการที่ 2 ลดและป้องกันผลกระทบต่อสุขภาพ',
        items: [
            { id: '2.1', label: '2.1 ยกระดับการเฝ้าระวังผลกระทบต่อสุขภาพ และแจ้งเตือนความเสี่ยงอย่างรวดเร็ว โดยการเชื่อมโยงข้อมูลทางดิจิทัล' },
            { id: '2.2', label: '2.2 ป้องกันผลกระทบสุขภาพกลุ่มเปราะบาง' },
        ]
    },
    {
        id: 3,
        title: 'มาตรการที่ 3 จัดบริการด้านการแพทย์และสาธารณสุข',
        items: [
            { id: '3.1', label: '3.1 เพิ่มประสิทธิผลและขยายความครอบคลุมบริการด้านการแพทย์และสาธารณสุข ในการดูแลสุขภาพจาก PM2.5 (คลินิกมลพิษและเวชกรรมสิ่งแวดล้อม) ให้ครอบคลุมทั้งในสถานพยาบาลและ Online' },
            { id: '3.2', label: '3.2 ระบบนัดหมายผ่านหมอพร้อม' },
            { id: '3.3', label: '3.3 จัดทีมปฏิบัติการดูแลสุขภาพประชาชนกลุ่มเปราะบางในชุมชน' },
            { id: '3.4', label: '3.4 สนับสนุนอุปกรณ์ป้องกันส่วนบุคคลแก่กลุ่มเปราะบาง' },
        ]
    },
    {
        id: 4,
        title: 'มาตรการที่ 4 เพิ่มประสิทธิภาพการบริหารจัดการ',
        items: [
            { id: '4.1', label: '4.1 เพิ่มประสิทธิภาพระบบ PHEOC ตอบสนองเหตุการณ์ในพื้นที่อย่างเข้มข้น รวดเร็ว ทันท่วงที' },
            { id: '4.2', label: '4.2 ส่งเสริมและขับเคลื่อนกฎหมาย' },
        ]
    }
]

function MeasureItem({ item, initialValue }) {
    // initialValue format: { status: boolean, detail: string | null }
    // If no initialValue found, default to null state

    // Initialize state from props
    // Check explicitly for null/undefined to avoid assuming false if it's missing
    const initialStatus = initialValue ? (initialValue.status ? 'true' : 'false') : null
    const [status, setStatus] = useState(initialStatus)
    const [detail, setDetail] = useState(initialValue?.detail || '')

    return (
        <div className="border border-slate-100 rounded-xl bg-slate-50/50 p-4 mb-4 transition-all hover:bg-white hover:shadow-md hover:border-emerald-100">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <p className="text-slate-800 font-medium text-base leading-relaxed flex-1">{item.label}</p>

                <div className="flex bg-slate-200 rounded-lg p-1 shrink-0 bg-white shadow-sm ring-1 ring-slate-200">
                    <label className={`cursor-pointer px-4 py-2 rounded-md transition-all text-sm font-semibold flex items-center gap-2 ${status === 'true' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}>
                        <input
                            type="radio"
                            name={`status_${item.id}`}
                            value="true"
                            className="sr-only"
                            checked={status === 'true'}
                            onChange={() => setStatus('true')}
                            required
                        />
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                            <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                        </svg>
                        ดำเนินการแล้ว
                    </label>

                    <label className={`cursor-pointer px-4 py-2 rounded-md transition-all text-sm font-semibold flex items-center gap-2 ${status === 'false' ? 'bg-slate-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}>
                        <input
                            type="radio"
                            name={`status_${item.id}`}
                            value="false"
                            className="sr-only"
                            checked={status === 'false'}
                            onChange={() => setStatus('false')}
                        />
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                            <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM8.28 7.22a.75.75 0 0 0-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 1 0 1.06 1.06L10 11.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L11.06 10l1.72-1.72a.75.75 0 0 0-1.06-1.06L10 8.94 8.28 7.22Z" clipRule="evenodd" />
                        </svg>
                        ยังไม่ทำ
                    </label>
                </div>
            </div>

            {status === 'true' && (
                <div className="mt-4 pl-0 md:pl-4 border-l-4 border-emerald-200 animate-in fade-in slide-in-from-top-1 duration-200">
                    <label className="block text-xs font-semibold text-emerald-700 mb-1 ml-1 uppercase tracking-wider">รายละเอียดการดำเนินการ</label>
                    <textarea
                        name={`detail_${item.id}`}
                        rows={3}
                        className="block w-full rounded-xl border-slate-200 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 py-3 px-4 text-slate-700 transition-all hover:bg-slate-50 focus:bg-white focus:shadow-md placeholder:text-slate-400 sm:text-sm"
                        placeholder="ระบุรายละเอียดผลการดำเนินงาน..."
                        defaultValue={detail}
                        onChange={(e) => setDetail(e.target.value)}
                        required
                    />
                </div>
            )}
        </div>
    )
}

const initialState = {
    message: '',
    success: false
}

export default function MeasureForm({ existingData }) {
    const [state, formAction, isPending] = useActionState(saveMeasures, initialState)

    if (state.success) {
        return (
            <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center mx-auto mt-8">
                <div className="mx-auto h-16 w-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-emerald-600">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                    </svg>
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">บันทึกข้อมูลสำเร็จ</h2>
                <p className="text-slate-500 mb-6">ระบบได้บันทึกข้อมูลมาตรการเรียบร้อยแล้ว</p>
                <div className="flex flex-col gap-3">
                    <Link href="/" className="w-full inline-flex justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600">
                        กลับสู่หน้าหลัก
                    </Link>
                    <button onClick={() => window.location.reload()} className="w-full inline-flex justify-center rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50">
                        แก้ไขข้อมูล
                    </button>
                </div>
            </div>
        )
    }

    // Transform existingData array into a map for easier lookup
    // existingData is likely an array of objects: { measureId: string, status: boolean, detail: string, ... }
    const dataMap = (existingData || []).reduce((acc, curr) => {
        acc[curr.measureId] = curr
        return acc
    }, {})

    return (
        <form action={formAction} className="space-y-8">
            {measuresData.map((measure) => (
                <div key={measure.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="bg-emerald-50/50 px-6 py-4 border-b border-emerald-100">
                        <h2 className="text-lg font-semibold text-emerald-800">{measure.title}</h2>
                    </div>
                    <div className="p-6">
                        {measure.items.map((item) => (
                            <MeasureItem
                                key={item.id}
                                item={item}
                                initialValue={dataMap[item.id]}
                            />
                        ))}
                    </div>
                </div>
            ))}

            {state?.message && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg p-4 text-center">
                    {state.message}
                </div>
            )}

            <div className="flex justify-end pt-4">
                <button
                    type="submit"
                    disabled={isPending}
                    className="inline-flex justify-center rounded-xl bg-emerald-600 px-8 py-3 text-base font-semibold text-white shadow-lg hover:bg-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:opacity-70 disabled:cursor-not-allowed transition-all transform hover:scale-105 active:scale-95"
                >
                    {isPending ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
                </button>
            </div>
        </form>
    )
}
