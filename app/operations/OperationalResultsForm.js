'use client'

import { useState } from 'react'

export default function OperationalResultsForm() {
    return (
        <div className="space-y-8 font-sarabun text-slate-900">
            {/* Header / Location Info */}
            <div>
                <h2 className="text-lg font-bold mb-4">• มุ้งสู้ฝุ่น</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                        <label className="block text-sm font-bold text-blue-500 mb-1">จังหวัด อำเภอ ตำบล</label>
                        <div className="grid grid-cols-3 gap-2">
                            <select className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm">
                                <option>เลือกจังหวัด</option>
                            </select>
                            <select className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm">
                                <option>เลือกอำเภอ</option>
                            </select>
                            <select className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm">
                                <option>เลือกตำบล</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-blue-500 mb-1">วันที่บันทึกข้อมูล</label>
                        <input type="date" className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm" />
                    </div>
                </div>
            </div>

            {/* Dust-proof Nets Table */}
            <div className="overflow-hidden border border-slate-300 rounded-lg">
                <div className="bg-white p-4 text-center font-bold text-blue-600 border-b border-slate-300">
                    มุ้งสู้ฝุ่น
                </div>
                <div className="grid grid-cols-12 text-center text-sm">
                    {/* Header Row */}
                    <div className="col-span-3 p-3 font-bold text-blue-600 border-r border-slate-300 flex items-center justify-center bg-white">
                        จังหวัด
                    </div>
                    <div className="col-span-3 p-3 font-bold text-blue-600 border-r border-slate-300 flex items-center justify-center bg-white">
                        จำนวนผู้ป่วย/สูงอายุ<br />ติดเตียงทั้งหมด (คน)
                    </div>
                    <div className="col-span-3 p-3 font-bold text-blue-600 border-r border-slate-300 flex items-center justify-center bg-white">
                        จำนวนมุ้งสู้ฝุ่นที่ให้<br />ผู้ป่วย/สูงติดเตียง
                    </div>
                    <div className="col-span-3 p-3 font-bold text-blue-600 flex items-center justify-center bg-white">
                        จำนวนมุ้งสู้ฝุ่นที่ได้รับ<br />การสนับสนุนจาก อปท.
                    </div>

                    {/* Input Row */}
                    <div className="col-span-3 p-2 border-t border-slate-300 border-r">
                        <input type="text" className="w-full text-center border-gray-200 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500" placeholder="ระบุจังหวัด" />
                    </div>
                    <div className="col-span-3 p-2 border-t border-slate-300 border-r">
                        <input type="number" className="w-full text-center border-gray-200 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500" />
                    </div>
                    <div className="col-span-3 p-2 border-t border-slate-300 border-r">
                        <input type="number" className="w-full text-center border-gray-200 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500" />
                    </div>
                    <div className="col-span-3 p-2 border-t border-slate-300">
                        <input type="number" className="w-full text-center border-gray-200 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500" />
                    </div>
                </div>
            </div>

            {/* PPE Support - General Public */}
            <div>
                <h2 className="text-lg font-bold mb-4">• การสนับสนุนอุปกรณ์ป้องกันส่วนบุคคล (PPE)</h2>
                <h3 className="text-md font-semibold mb-2 pl-4">1. ประชาชนทั่วไป</h3>

                <div className="overflow-hidden border border-slate-300 rounded-lg mb-6">
                    <table className="min-w-full divide-y divide-slate-300">
                        <thead className="bg-white">
                            <tr>
                                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-bold text-blue-600 sm:pl-6 border-r border-slate-300">
                                    รายการ
                                </th>
                                <th scope="col" className="px-3 py-3.5 text-center text-sm font-bold text-blue-600 border-r border-slate-300">
                                    จำนวนสนับสนุน
                                </th>
                                <th scope="col" className="px-3 py-3.5 text-center text-sm font-bold text-blue-600">
                                    สะสม (คำนวณยอดตั้งแต<br />วันแรก-ปัจจุบัน)
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-300 bg-white">
                            {[
                                "หน้ากาก Surgical Mask (ชิ้น) (รายวัน)",
                                "หน้ากาก N95 (ชิ้น) (รายวัน)",
                                "หน้ากากคาร์บอน",
                                "หน้ากากผ้า"
                            ].map((item, index) => (
                                <tr key={index}>
                                    <td className="whitespace-nowrap py-3 pl-4 pr-3 text-sm font-bold text-blue-600 sm:pl-6 border-r border-slate-300">
                                        {item}
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-2 text-sm text-gray-500 border-r border-slate-300">
                                        <input type="number" className="w-full border-gray-200 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500" />
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-2 text-sm text-gray-500">
                                        <input type="number" className="w-full border-gray-200 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-50" readOnly />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* PPE Support - Vulnerable Groups (Small Children) */}
                <h3 className="text-md font-semibold mb-2 pl-4">2. กลุ่มเปราะบาง (แยกตามกลุ่มเป้าหมาย)</h3>
                <h4 className="text-md font-medium mb-2 pl-8">2.1 กลุ่มเด็กเล็ก (0-5 ปี)</h4>

                <div className="overflow-hidden border border-slate-300 rounded-lg mb-4">
                    <table className="min-w-full divide-y divide-slate-300">
                        <thead className="bg-white">
                            <tr>
                                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-bold text-blue-600 sm:pl-6 border-r border-slate-300">
                                    รายการ
                                </th>
                                <th scope="col" className="px-3 py-3.5 text-center text-sm font-bold text-blue-600 border-r border-slate-300">
                                    จำนวนสนับสนุน
                                </th>
                                <th scope="col" className="px-3 py-3.5 text-center text-sm font-bold text-blue-600">
                                    สะสม (คำนวณยอดตั้งแต<br />วันแรก-ปัจจุบัน)
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-300 bg-white">
                            {[
                                "หน้ากาก Surgical Mask (ชิ้น) (รายวัน)",
                                "หน้ากาก N95 (ชิ้น) (รายวัน)",
                                "หน้ากากคาร์บอน",
                                "หน้ากากผ้า"
                            ].map((item, index) => (
                                <tr key={index}>
                                    <td className="whitespace-nowrap py-3 pl-4 pr-3 text-sm font-bold text-blue-600 sm:pl-6 border-r border-slate-300">
                                        {item}
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-2 text-sm text-gray-500 border-r border-slate-300">
                                        <input type="number" className="w-full border-gray-200 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500" />
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-2 text-sm text-gray-500">
                                        <input type="number" className="w-full border-gray-200 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-50" readOnly />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* PPE Support - Pregnant Women */}
                <h4 className="text-md font-medium mb-2 pl-8">2.2 กลุ่มหญิงตั้งครรภ์</h4>

                <div className="overflow-hidden border border-slate-300 rounded-lg mb-6">
                    <table className="min-w-full divide-y divide-slate-300">
                        <thead className="bg-white">
                            <tr>
                                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-bold text-blue-600 sm:pl-6 border-r border-slate-300">
                                    รายการ
                                </th>
                                <th scope="col" className="px-3 py-3.5 text-center text-sm font-bold text-blue-600 border-r border-slate-300">
                                    จำนวนสนับสนุน
                                </th>
                                <th scope="col" className="px-3 py-3.5 text-center text-sm font-bold text-blue-600">
                                    สะสม (คำนวณยอดตั้งแต<br />วันแรก-ปัจจุบัน)
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-300 bg-white">
                            {[
                                "หน้ากาก Surgical Mask (ชิ้น) (รายวัน)",
                                "หน้ากาก N95 (ชิ้น) (รายวัน)",
                                "หน้ากากคาร์บอน",
                                "หน้ากากผ้า"
                            ].map((item, index) => (
                                <tr key={index}>
                                    <td className="whitespace-nowrap py-3 pl-4 pr-3 text-sm font-bold text-blue-600 sm:pl-6 border-r border-slate-300">
                                        {item}
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-2 text-sm text-gray-500 border-r border-slate-300">
                                        <input type="number" className="w-full border-gray-200 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500" />
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-2 text-sm text-gray-500">
                                        <input type="number" className="w-full border-gray-200 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-50" readOnly />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

            </div>

            <div className="flex justify-end pt-6 border-t border-slate-200">
                <button
                    type="submit"
                    className="rounded-xl bg-emerald-600 px-8 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
                >
                    บันทึกข้อมูล
                </button>
            </div>
        </div>
    )
}
