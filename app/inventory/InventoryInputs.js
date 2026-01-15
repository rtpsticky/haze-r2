'use client'

export const items = [
    { key: 'surgical_mask', label: 'หน้ากาก Surgical Mask (ชิ้น) (รายวัน)' },
    { key: 'n95', label: 'หน้ากาก N95 (ชิ้น) (รายวัน)' },
    { key: 'carbon_mask', label: 'หน้ากากคาร์บอน' },
    { key: 'cloth_mask', label: 'หน้ากากผ้า' },
    { key: 'dust_net', label: 'มุ้งสู้ฝุ่น' },
]

export default function InventoryInputs({ counts, onChange, disabled = false }) {
    return (
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
                    {items.map((item) => (
                        <tr key={item.key} className="hover:bg-slate-50 transition-colors">
                            <td className="whitespace-nowrap py-6 pl-6 pr-3 text-lg font-medium text-slate-700 sm:pl-8">
                                {item.label}
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-right sm:pr-8">
                                <input
                                    type="number"
                                    name={item.key}
                                    min="0"
                                    disabled={disabled}
                                    placeholder="0"
                                    value={counts[item.key] || ''}
                                    onChange={(e) => onChange(item.key, e.target.value)}
                                    className="block w-40 ml-auto rounded-xl border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 text-2xl font-bold text-emerald-700 text-right py-3 px-4 placeholder:text-slate-200 disabled:opacity-50 disabled:bg-slate-100"
                                />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}
