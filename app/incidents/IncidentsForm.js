'use client'

export default function IncidentsForm() {
    return (
        <div className="space-y-6 font-sarabun text-slate-900">
            {/* Header Text */}
            <h2 className="text-lg font-bold mb-4">• รายงานผลกระทบต่อสุขภาพของเจ้าหน้าที่และจิตอาสาดับไฟ</h2>

            {/* Location & Date - Standard Style */}
            <div className="grid grid-cols-1 gap-6">
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">จังหวัด อำเภอ ตำบล</label>
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
                    <label className="block text-sm font-bold text-slate-700 mb-1">วันที่บันทึกข้อมูล</label>
                    <input type="date" className="block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 text-sm" />
                </div>
            </div>

            {/* Victim Information - Red Style as per image */}
            <div className="space-y-4 pt-4">
                <div>
                    <label className="block text-md font-bold text-red-600 mb-2">
                        ชื่อ-นามสกุล (เจ้าหน้าที่/จิตอาสา ดับไฟป่า)
                    </label>
                    <input type="text" className="block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500" placeholder="ระบุชื่อ-นามสกุล" />
                </div>

                <div>
                    <label className="block text-md font-bold text-red-600 mb-2">
                        สถานะ: บาดเจ็บ เสียชีวิต (สามารถเลือกได้)
                    </label>
                    <div className="flex gap-6 mt-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="radio" name="status" value="injured" className="w-5 h-5 text-red-600 border-gray-300 focus:ring-red-500" />
                            <span>บาดเจ็บ</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="radio" name="status" value="deceased" className="w-5 h-5 text-red-600 border-gray-300 focus:ring-red-500" />
                            <span>เสียชีวิต</span>
                        </label>
                    </div>
                </div>

                <div>
                    <label className="block text-md font-bold text-red-600 mb-2">
                        รายละเอียดเหตุการณ์
                    </label>
                    <textarea rows={4} className="block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500" placeholder="ระบุรายละเอียดเหตุการณ์..." />
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
