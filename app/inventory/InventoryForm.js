'use client'

import { useActionState, useState, useEffect } from 'react'
import { saveInventoryData, getInventoryData } from '@/app/actions/inventory'
import Link from 'next/link'

const items = [
    { key: 'surgical_mask', label: 'หน้ากาก Surgical Mask (ชิ้น) (รายวัน)' },
    { key: 'n95', label: 'หน้ากาก N95 (ชิ้น) (รายวัน)' },
    { key: 'carbon_mask', label: 'หน้ากากคาร์บอน' },
    { key: 'cloth_mask', label: 'หน้ากากผ้า' },
    { key: 'dust_net', label: 'มุ้งสู้ฝุ่น' },
]

export default function InventoryForm({ user }) {
    const [state, formAction, isPending] = useActionState(saveInventoryData, { message: '', success: false })
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])
    const [counts, setCounts] = useState({})
    const [isLoadingData, setIsLoadingData] = useState(false)

    useEffect(() => {
        async function fetchData() {
            setIsLoadingData(true)
            try {
                const data = await getInventoryData(date)
                const newCounts = {}
                data.forEach(record => {
                    const item = items.find(i => i.label === record.itemName)
                    if (item) {
                        newCounts[item.key] = record.stockCount
                    }
                })
                setCounts(newCounts)
            } catch (e) {
                console.error(e)
            } finally {
                setIsLoadingData(false)
            }
        }
        fetchData()
    }, [date])

    const handleCountChange = (key, value) => {
        setCounts(prev => ({ ...prev, [key]: value }))
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
                    <p className="text-slate-500 mb-6">บันทึกข้อมูลเวชภัณฑ์คงคลังเรียบร้อยแล้ว</p>
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
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-8 flex items-center gap-4">
                    <Link href="/" className="p-2 rounded-lg bg-white shadow-sm text-slate-500 hover:text-emerald-600 hover:shadow transition-all">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                        </svg>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">เวชภัณฑ์คงคลัง</h1>
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
                        <div className="overflow-hidden shadow-sm ring-1 ring-slate-200 rounded-xl bg-slate-50">
                            <table className="min-w-full divide-y divide-slate-200">
                                <thead className="bg-emerald-600">
                                    <tr>
                                        <th scope="col" className="py-5 pl-6 pr-3 text-left text-lg font-semibold text-white sm:pl-8">
                                            รายการ
                                        </th>
                                        <th scope="col" className="px-3 py-5 text-right text-lg font-semibold text-white sm:pr-8">
                                            จำนวนคงคลัง
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 bg-white">
                                    {isLoadingData ? (
                                        <tr>
                                            <td colSpan="2" className="py-12 text-center text-slate-500 text-lg">กำลังโหลดข้อมูล...</td>
                                        </tr>
                                    ) : (
                                        items.map((item) => (
                                            <tr key={item.key} className="hover:bg-slate-50 transition-colors">
                                                <td className="whitespace-nowrap py-6 pl-6 pr-3 text-lg font-medium text-slate-700 sm:pl-8">
                                                    {item.label}
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-right sm:pr-8">
                                                    <input
                                                        type="number"
                                                        name={item.key}
                                                        min="0"
                                                        placeholder="0"
                                                        value={counts[item.key] || ''}
                                                        onChange={(e) => handleCountChange(item.key, e.target.value)}
                                                        className="block w-40 ml-auto rounded-xl border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 text-2xl font-bold text-emerald-700 text-right py-3 px-4 placeholder:text-slate-200"
                                                    />
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
