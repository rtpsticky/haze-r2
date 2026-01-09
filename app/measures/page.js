'use client'

import { useActionState, useState } from 'react'
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

function MeasureItem({ item }) {
    const [status, setStatus] = useState(null) // null, 'true', 'false'

    return (
        <div className="border-b border-slate-100 pb-6 mb-6 last:border-0 last:pb-0 last:mb-0">
            <p className="text-slate-800 font-medium mb-3">{item.label}</p>
            <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                        type="radio"
                        name={`status_${item.id}`}
                        value="true"
                        className="w-4 h-4 text-emerald-600 border-slate-300 focus:ring-emerald-600"
                        onChange={() => setStatus('true')}
                        required
                    />
                    <span className="text-slate-700 group-hover:text-emerald-700 transition-colors">ดำเนินการแล้ว</span>
                </label>

                {status === 'true' && (
                    <div className="ml-7 animate-in fade-in slide-in-from-top-2 duration-200">
                        <textarea
                            name={`detail_${item.id}`}
                            rows={3}
                            className="block w-full rounded-lg border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
                            placeholder="พิมพ์รายละเอียดการดำเนินงาน..."
                            required
                        />
                    </div>
                )}

                <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                        type="radio"
                        name={`status_${item.id}`}
                        value="false"
                        className="w-4 h-4 text-slate-400 border-slate-300 focus:ring-slate-400"
                        onChange={() => setStatus('false')}
                    />
                    <span className="text-slate-700 group-hover:text-slate-900 transition-colors">ยังไม่ดำเนินการ</span>
                </label>
            </div>
        </div>
    )
}

const initialState = {
    message: '',
    success: false
}

export default function MeasuresPage() {
    const [state, formAction, isPending] = useActionState(saveMeasures, initialState)

    if (state.success) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
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
                            บันทึกข้อมูลเพิ่ม
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-50 py-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-8 flex items-center gap-4">
                    <Link href="/" className="p-2 rounded-lg bg-white shadow-sm text-slate-500 hover:text-emerald-600 hover:shadow transition-all">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                        </svg>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">บันทึกมาตรการ</h1>
                        <p className="text-slate-500 text-sm">รายงานผลการดำเนินงานตามมาตรการ 1 - 4</p>
                    </div>
                </div>

                <form action={formAction} className="space-y-8">
                    {measuresData.map((measure) => (
                        <div key={measure.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                            <div className="bg-emerald-50/50 px-6 py-4 border-b border-emerald-100">
                                <h2 className="text-lg font-semibold text-emerald-800">{measure.title}</h2>
                            </div>
                            <div className="p-6">
                                {measure.items.map((item) => (
                                    <MeasureItem key={item.id} item={item} />
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
            </div>
        </div>
    )
}
