'use client'

import { useActionState, useState, useEffect } from 'react'
import { saveCleanRoomData, getCleanRoomData } from '@/app/actions/clean-room'
import Link from 'next/link'

const placeTypes = [
    'โรงพยาบาลศูนย์',
    'โรงพยาบาลทั่วไป',
    'โรงพยาบาลชุมชน',
    'โรงพยาบาลส่งเสริมสุขภาพตำบล',
    'โรงพยาบาลเอกชน',
    'โรงพยาบาลสังกัดกระทรวงกลาโหม',
    'โรงพยาบาลมหาวิทยาลัย',
    'สสจ./สสอ.',
    'หน่วยงานภาครัฐ (อบจ/อบต./สนง.ต่างๆ)',
    'ศูนย์ดูแลผู้สูงอายุ',
]

export default function CleanRoomForm({ user }) {
    const [state, formAction, isPending] = useActionState(saveCleanRoomData, { message: '', success: false })
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])
    const [formData, setFormData] = useState({})
    const [isLoadingData, setIsLoadingData] = useState(false)

    useEffect(() => {
        async function fetchData() {
            setIsLoadingData(true)
            try {
                const data = await getCleanRoomData(date)
                const newData = {}
                data.forEach(record => {
                    newData[`${record.placeType}_placeCount`] = record.placeCount
                    newData[`${record.placeType}_targetRoomCount`] = record.targetRoomCount
                    newData[`${record.placeType}_passedStandard`] = record.passedStandard
                    newData[`${record.placeType}_standard1Count`] = record.standard1Count
                    newData[`${record.placeType}_standard2Count`] = record.standard2Count
                    newData[`${record.placeType}_standard3Count`] = record.standard3Count
                    newData[`${record.placeType}_serviceUserCount`] = record.serviceUserCount
                })
                setFormData(newData)
            } catch (e) {
                console.error(e)
            } finally {
                setIsLoadingData(false)
            }
        }
        fetchData()
    }, [date])

    const handleChange = (key, value) => {
        setFormData(prev => ({ ...prev, [key]: value }))
    }

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
                    <p className="text-slate-500 mb-6">บันทึกข้อมูลห้องปลอดฝุ่นเรียบร้อยแล้ว</p>
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
            <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-8 flex items-center gap-4">
                    <Link href="/" className="p-2 rounded-lg bg-white shadow-sm text-slate-500 hover:text-emerald-600 hover:shadow transition-all">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                        </svg>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">ห้องปลอดฝุ่น (Clean Room)</h1>
                        <p className="text-slate-500 text-sm">
                            {user?.location?.provinceName} {user?.location?.districtName} {user?.location?.subDistrict}
                        </p>
                    </div>
                </div>

                <form action={formAction} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-6 space-y-6">
                        {/* Date Selection */}
                        <div>
                            <label htmlFor="recordDate" className="block text-sm font-medium text-slate-800 mb-2">
                                วันที่บันทึกข้อมูล
                            </label>
                            <input
                                type="date"
                                name="recordDate"
                                id="recordDate"
                                required
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="block w-full max-w-sm rounded-lg border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
                            />
                        </div>

                        {/* Table */}
                        <div className="overflow-x-auto shadow-sm ring-1 ring-slate-200 rounded-xl bg-slate-50">
                            <table className="min-w-full divide-y divide-slate-200">
                                <thead className="bg-emerald-600 text-white">
                                    <tr>
                                        <th rowSpan="2" className="py-4 pl-4 pr-3 text-left text-sm font-semibold sm:pl-6 min-w-[200px]">สถานที</th>
                                        <th rowSpan="2" className="px-2 py-4 text-center text-sm font-semibold min-w-[100px]">จำนวนสถานที่<br />(แห่ง)</th>
                                        <th rowSpan="2" className="px-2 py-4 text-center text-sm font-semibold min-w-[100px]">ห้องปลอดฝุ่น<br />ตามเป้าหมาย (ห้อง)</th>
                                        <th rowSpan="2" className="px-2 py-4 text-center text-sm font-semibold min-w-[120px]">ห้องปลอดฝุ่นที่<br />ผ่านมาตรฐาน (ห้อง)</th>
                                        <th colSpan="3" className="px-2 py-2 text-center text-sm font-semibold border-b border-emerald-500">รูปแบบมาตรฐาน (ห้อง)</th>
                                        <th rowSpan="2" className="px-2 py-4 text-center text-sm font-semibold min-w-[100px]">ผู้รับบริการ<br />(ราย)</th>
                                    </tr>
                                    <tr>
                                        <th className="px-2 py-2 text-center text-sm font-semibold w-16 bg-emerald-700/30">1</th>
                                        <th className="px-2 py-2 text-center text-sm font-semibold w-16 bg-emerald-700/30">2</th>
                                        <th className="px-2 py-2 text-center text-sm font-semibold w-16 bg-emerald-700/30">3</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 bg-white">
                                    {isLoadingData ? (
                                        <tr>
                                            <td colSpan="8" className="py-12 text-center text-slate-500 text-lg">กำลังโหลดข้อมูล...</td>
                                        </tr>
                                    ) : (
                                        placeTypes.map((type) => (
                                            <tr key={type} className="hover:bg-slate-50 transition-colors">
                                                <td className="py-4 pl-4 pr-3 text-sm font-medium text-slate-900 sm:pl-6">
                                                    {type}
                                                </td>
                                                <td className="px-2 py-2">
                                                    <input type="number" min="0" placeholder="0"
                                                        name={`${type}_placeCount`}
                                                        value={formData[`${type}_placeCount`] || ''}
                                                        onChange={(e) => handleChange(`${type}_placeCount`, e.target.value)}
                                                        className="block w-full rounded-md border-slate-300 py-1.5 text-center text-sm focus:ring-emerald-500 focus:border-emerald-500" />
                                                </td>
                                                <td className="px-2 py-2">
                                                    <input type="number" min="0" placeholder="0"
                                                        name={`${type}_targetRoomCount`}
                                                        value={formData[`${type}_targetRoomCount`] || ''}
                                                        onChange={(e) => handleChange(`${type}_targetRoomCount`, e.target.value)}
                                                        className="block w-full rounded-md border-slate-300 py-1.5 text-center text-sm focus:ring-emerald-500 focus:border-emerald-500" />
                                                </td>
                                                <td className="px-2 py-2">
                                                    <input type="number" min="0" placeholder="0"
                                                        name={`${type}_passedStandard`}
                                                        value={formData[`${type}_passedStandard`] || ''}
                                                        onChange={(e) => handleChange(`${type}_passedStandard`, e.target.value)}
                                                        className="block w-full rounded-md border-slate-300 py-1.5 text-center text-sm focus:ring-emerald-500 focus:border-emerald-500" />
                                                </td>
                                                <td className="px-1 py-2 bg-slate-50/50">
                                                    <input type="number" min="0" placeholder="0"
                                                        name={`${type}_standard1Count`}
                                                        value={formData[`${type}_standard1Count`] || ''}
                                                        onChange={(e) => handleChange(`${type}_standard1Count`, e.target.value)}
                                                        className="block w-full rounded-md border-slate-300 py-1.5 text-center text-sm focus:ring-emerald-500 focus:border-emerald-500" />
                                                </td>
                                                <td className="px-1 py-2 bg-slate-50/50">
                                                    <input type="number" min="0" placeholder="0"
                                                        name={`${type}_standard2Count`}
                                                        value={formData[`${type}_standard2Count`] || ''}
                                                        onChange={(e) => handleChange(`${type}_standard2Count`, e.target.value)}
                                                        className="block w-full rounded-md border-slate-300 py-1.5 text-center text-sm focus:ring-emerald-500 focus:border-emerald-500" />
                                                </td>
                                                <td className="px-1 py-2 bg-slate-50/50">
                                                    <input type="number" min="0" placeholder="0"
                                                        name={`${type}_standard3Count`}
                                                        value={formData[`${type}_standard3Count`] || ''}
                                                        onChange={(e) => handleChange(`${type}_standard3Count`, e.target.value)}
                                                        className="block w-full rounded-md border-slate-300 py-1.5 text-center text-sm focus:ring-emerald-500 focus:border-emerald-500" />
                                                </td>
                                                <td className="px-2 py-2">
                                                    <input type="number" min="0" placeholder="0"
                                                        name={`${type}_serviceUserCount`}
                                                        value={formData[`${type}_serviceUserCount`] || ''}
                                                        onChange={(e) => handleChange(`${type}_serviceUserCount`, e.target.value)}
                                                        className="block w-full rounded-md border-slate-300 py-1.5 text-center text-sm focus:ring-emerald-500 focus:border-emerald-500" />
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="bg-slate-50 px-6 py-4 flex items-center justify-between border-t border-slate-100">
                        {state?.message ? (
                            <span className="text-sm font-medium text-red-600">{state.message}</span>
                        ) : (<span></span>)}

                        <button
                            type="submit"
                            disabled={isPending || isLoadingData}
                            className="rounded-xl bg-emerald-600 px-8 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isPending ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
