'use client'

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

export default function CleanRoomTable({ formData, handleChange, isLoadingData }) {
    return (
        <div className="overflow-x-auto shadow-sm ring-1 ring-slate-200 rounded-xl bg-white">
            <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-emerald-600 text-white">
                    <tr>
                        <th rowSpan="2" className="py-4 pl-4 pr-3 text-left text-sm font-semibold sm:pl-6 min-w-[240px] sticky left-0 bg-emerald-600 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">สถานที่</th>
                        <th rowSpan="2" className="px-3 py-4 text-center text-sm font-semibold min-w-[120px]">จำนวนสถานที่<br /><span className="text-emerald-100 text-xs font-normal">(แห่ง)</span></th>
                        <th rowSpan="2" className="px-3 py-4 text-center text-sm font-semibold min-w-[120px]">เป้าหมาย<br /><span className="text-emerald-100 text-xs font-normal">(ห้อง)</span></th>
                        <th rowSpan="2" className="px-3 py-4 text-center text-sm font-semibold min-w-[140px]">ผ่านมาตรฐาน<br /><span className="text-emerald-100 text-xs font-normal">(ห้อง)</span></th>
                        <th colSpan="3" className="px-2 py-3 text-center text-sm font-semibold border-b border-emerald-500/50 bg-emerald-700/20">รูปแบบมาตรฐาน (ห้อง)</th>
                        <th rowSpan="2" className="px-3 py-4 text-center text-sm font-semibold min-w-[120px]">ผู้รับบริการ<br /><span className="text-emerald-100 text-xs font-normal">(ราย)</span></th>
                    </tr>
                    <tr>
                        <th className="px-2 py-2 text-center text-xs font-medium w-20 bg-emerald-700/30 text-emerald-50">แบบ 1</th>
                        <th className="px-2 py-2 text-center text-xs font-medium w-20 bg-emerald-700/30 text-emerald-50">แบบ 2</th>
                        <th className="px-2 py-2 text-center text-xs font-medium w-20 bg-emerald-700/30 text-emerald-50">แบบ 3</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                    {isLoadingData ? (
                        <tr>
                            <td colSpan="8" className="py-12 text-center text-slate-500 text-lg">กำลังโหลดข้อมูล...</td>
                        </tr>
                    ) : (
                        placeTypes.map((type, idx) => (
                            <tr key={type} className={`hover:bg-slate-50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}>
                                <td className="py-4 pl-4 pr-3 text-sm font-medium text-slate-900 sm:pl-6 sticky left-0 z-10 bg-inherit shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                                    {type}
                                </td>
                                <td className="px-2 py-2">
                                    <input type="number" min="0" placeholder="0"
                                        name={`${type}_placeCount`}
                                        inputMode="numeric"
                                        value={formData[`${type}_placeCount`] || ''}
                                        onChange={(e) => handleChange(`${type}_placeCount`, e.target.value)}
                                        className="block w-full rounded-lg border-slate-200 bg-white py-2 text-center text-sm font-medium text-slate-700 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 hover:border-emerald-300 transition-colors placeholder:text-slate-300" />
                                </td>
                                <td className="px-2 py-2">
                                    <input type="number" min="0" placeholder="0"
                                        name={`${type}_targetRoomCount`}
                                        inputMode="numeric"
                                        value={formData[`${type}_targetRoomCount`] || ''}
                                        onChange={(e) => handleChange(`${type}_targetRoomCount`, e.target.value)}
                                        className="block w-full rounded-lg border-slate-200 bg-white py-2 text-center text-sm font-medium text-slate-700 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 hover:border-emerald-300 transition-colors placeholder:text-slate-300" />
                                </td>
                                <td className="px-2 py-2">
                                    <input type="number" min="0" placeholder="0"
                                        name={`${type}_passedStandard`}
                                        inputMode="numeric"
                                        value={formData[`${type}_passedStandard`] || ''}
                                        onChange={(e) => handleChange(`${type}_passedStandard`, e.target.value)}
                                        className="block w-full rounded-lg border-emerald-200 bg-emerald-50/30 py-2 text-center text-sm font-bold text-emerald-700 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 hover:border-emerald-400 transition-colors placeholder:text-emerald-200/50" />
                                </td>
                                <td className="px-1 py-2 bg-slate-50/50 grayscale opacity-80 focus-within:grayscale-0 focus-within:opacity-100 transition-all duration-300">
                                    <input type="number" min="0" placeholder="0"
                                        name={`${type}_standard1Count`}
                                        inputMode="numeric"
                                        value={formData[`${type}_standard1Count`] || ''}
                                        onChange={(e) => handleChange(`${type}_standard1Count`, e.target.value)}
                                        className="block w-full rounded-lg border-slate-200 bg-white py-1.5 text-center text-sm text-slate-600 focus:border-emerald-500 focus:ring-emerald-500 shadow-sm placeholder:text-slate-200" />
                                </td>
                                <td className="px-1 py-2 bg-slate-50/50 grayscale opacity-80 focus-within:grayscale-0 focus-within:opacity-100 transition-all duration-300">
                                    <input type="number" min="0" placeholder="0"
                                        name={`${type}_standard2Count`}
                                        inputMode="numeric"
                                        value={formData[`${type}_standard2Count`] || ''}
                                        onChange={(e) => handleChange(`${type}_standard2Count`, e.target.value)}
                                        className="block w-full rounded-lg border-slate-200 bg-white py-1.5 text-center text-sm text-slate-600 focus:border-emerald-500 focus:ring-emerald-500 shadow-sm placeholder:text-slate-200" />
                                </td>
                                <td className="px-1 py-2 bg-slate-50/50 grayscale opacity-80 focus-within:grayscale-0 focus-within:opacity-100 transition-all duration-300">
                                    <input type="number" min="0" placeholder="0"
                                        name={`${type}_standard3Count`}
                                        inputMode="numeric"
                                        value={formData[`${type}_standard3Count`] || ''}
                                        onChange={(e) => handleChange(`${type}_standard3Count`, e.target.value)}
                                        className="block w-full rounded-lg border-slate-200 bg-white py-1.5 text-center text-sm text-slate-600 focus:border-emerald-500 focus:ring-emerald-500 shadow-sm placeholder:text-slate-200" />
                                </td>
                                <td className="px-2 py-2">
                                    <input type="number" min="0" placeholder="0"
                                        name={`${type}_serviceUserCount`}
                                        inputMode="numeric"
                                        value={formData[`${type}_serviceUserCount`] || ''}
                                        onChange={(e) => handleChange(`${type}_serviceUserCount`, e.target.value)}
                                        className="block w-full rounded-lg border-slate-200 bg-white py-2 text-center text-sm font-medium text-slate-700 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 hover:border-emerald-300 transition-colors placeholder:text-slate-300" />
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    )
}
