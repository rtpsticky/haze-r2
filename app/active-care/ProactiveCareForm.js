'use client'

export default function ProactiveCareForm() {
    return (
        <div className="space-y-12 font-sarabun text-slate-900">
            {/* Section 1: Proactive Operations */}
            <div>
                <h2 className="text-lg font-bold mb-4">• การปฏิบัติการเชิงรุกในพื้นที่</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                        <label className="block text-sm font-bold text-red-500 mb-1">จังหวัด อำเภอ ตำบล</label>
                        <div className="grid grid-cols-3 gap-2">
                            <select className="block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 text-sm">
                                <option>เลือกจังหวัด</option>
                            </select>
                            <select className="block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 text-sm">
                                <option>เลือกอำเภอ</option>
                            </select>
                            <select className="block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 text-sm">
                                <option>เลือกตำบล</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-red-500 mb-1">วันที่บันทึกข้อมูล</label>
                        <input type="date" className="block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 text-sm" />
                    </div>
                </div>

                <div className="overflow-hidden border border-slate-300 rounded-lg">
                    <table className="min-w-full divide-y divide-slate-300">
                        <thead className="bg-white">
                            <tr>
                                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-bold text-red-600 sm:pl-6 border-r border-slate-300 w-1/4">
                                    การดำเนินงาน
                                </th>
                                <th scope="col" className="px-3 py-3.5 text-center text-sm font-bold text-red-600 border-r border-slate-300 w-1/4">
                                    จำนวนครัวเรือนที่ได้รับการดูแล
                                </th>
                                <th scope="col" className="px-3 py-3.5 text-center text-sm font-bold text-red-600 border-r border-slate-300 w-1/4">
                                    จำนวนประชาชนที่<br />ได้รับการดูแล (คน)
                                </th>
                                <th scope="col" className="px-3 py-3.5 text-center text-sm font-bold text-red-600 w-1/4">
                                    จำนวนกลุ่มเสี่ยงที่<br />ได้รับการดูแล
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-300 bg-white">
                            {[
                                "การสอบสวนโรค",
                                "การดูแลสุขภาพจิต",
                                "การรักษาพยาบาลเบื้องต้น"
                            ].map((item, index) => (
                                <tr key={index}>
                                    <td className="whitespace-nowrap py-3 pl-4 pr-3 text-sm font-bold text-red-600 sm:pl-6 border-r border-slate-300">
                                        {item}
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-2 text-sm text-gray-500 border-r border-slate-300">
                                        <input type="number" className="w-full border-gray-200 rounded-md shadow-sm focus:border-red-500 focus:ring-red-500" />
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-2 text-sm text-gray-500 border-r border-slate-300">
                                        <input type="number" className="w-full border-gray-200 rounded-md shadow-sm focus:border-red-500 focus:ring-red-500" />
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-2 text-sm text-gray-500">
                                        <input type="number" className="w-full border-gray-200 rounded-md shadow-sm focus:border-red-500 focus:ring-red-500" />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Section 2: LGO Support */}
            <div>
                <h2 className="text-lg font-bold mb-4">• การสนับสนุนของ อปท.</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                        <label className="block text-sm font-bold text-red-500 mb-1">จังหวัด อำเภอ</label>
                        <div className="grid grid-cols-2 gap-2">
                            <select className="block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 text-sm">
                                <option>เลือกจังหวัด</option>
                            </select>
                            <select className="block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 text-sm">
                                <option>เลือกอำเภอ</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-red-500 mb-1">วันที่บันทึกข้อมูล</label>
                        <input type="date" className="block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 text-sm" />
                    </div>
                </div>

                <div className="overflow-hidden border border-slate-300 rounded-lg mb-6">
                    <table className="min-w-full divide-y divide-slate-300">
                        <thead className="bg-white">
                            <tr>
                                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-bold text-red-600 sm:pl-6 border-r border-slate-300 w-1/4">
                                    จำนวน อปท.
                                </th>
                                <th scope="col" className="px-3 py-3.5 text-center text-sm font-bold text-red-600 border-r border-slate-300 w-1/4">
                                    สนับสนุน Surgical Mask<br />Mask/ หน้ากาก N95 (จำนวน)
                                </th>
                                <th scope="col" className="px-3 py-3.5 text-center text-sm font-bold text-red-600 border-r border-slate-300 w-1/4">
                                    มุ้งสู้ฝุ่น
                                </th>
                                <th scope="col" className="px-3 py-3.5 text-center text-sm font-bold text-red-600 w-1/4">
                                    ห้องปลอดฝุ่น
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-300 bg-white">
                            <tr>
                                <td className="whitespace-nowrap px-3 py-2 text-sm text-gray-500 border-r border-slate-300">
                                    <input type="number" className="w-full border-gray-200 rounded-md shadow-sm focus:border-red-500 focus:ring-red-500" />
                                </td>
                                <td className="whitespace-nowrap px-3 py-2 text-sm text-gray-500 border-r border-slate-300">
                                    <input type="number" className="w-full border-gray-200 rounded-md shadow-sm focus:border-red-500 focus:ring-red-500" />
                                </td>
                                <td className="whitespace-nowrap px-3 py-2 text-sm text-gray-500 border-r border-slate-300">
                                    <input type="number" className="w-full border-gray-200 rounded-md shadow-sm focus:border-red-500 focus:ring-red-500" />
                                </td>
                                <td className="whitespace-nowrap px-3 py-2 text-sm text-gray-500">
                                    <input type="number" className="w-full border-gray-200 rounded-md shadow-sm focus:border-red-500 focus:ring-red-500" />
                                </td>
                            </tr>
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
