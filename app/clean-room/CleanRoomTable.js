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
    )
}
