'use client'

export const groups = [
    { key: 'child', label: 'กลุ่มเด็กเล็ก (0-5 ปี)' },
    { key: 'pregnant', label: 'กลุ่มหญิงตั้งครรภ์' },
    { key: 'elderly', label: 'กลุ่มผู้สูงอายุ' },
    { key: 'bedridden', label: 'กลุ่มติดเตียง' },
    { key: 'heart', label: 'กลุ่มผู้ที่มีโรคหัวใจ' },
    { key: 'respiratory', label: 'กลุ่มผู้ที่มีโรคระบบทางเดินหายใจ' },
]

export default function VulnerableInputs({ counts, onChange, disabled = false }) {
    return (
        <div className="overflow-hidden shadow-sm ring-1 ring-slate-200 rounded-xl bg-slate-50">
            <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-emerald-600">
                    <tr>
                        <th scope="col" className="py-5 pl-6 pr-3 text-left text-lg font-semibold text-white sm:pl-8">
                            กลุ่มเป้าหมาย
                        </th>
                        <th scope="col" className="px-3 py-5 text-right text-lg font-semibold text-white sm:pr-8">
                            จำนวนเป้าหมาย (คน)
                            <span className="block text-xs font-light text-emerald-100 mt-1 opacity-80">(แก้ไขได้หากมีการเปลี่ยนแปลง)</span>
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                    {groups.map((group) => (
                        <tr key={group.key} className="hover:bg-slate-50 transition-colors">
                            <td className="whitespace-nowrap py-6 pl-6 pr-3 text-lg font-medium text-slate-700 sm:pl-8">
                                {group.label}
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-right sm:pr-8">
                                <input
                                    type="number"
                                    name={group.key}
                                    min="0"
                                    disabled={disabled}
                                    placeholder="0"
                                    value={counts[group.key] || ''}
                                    onChange={(e) => onChange(group.key, e.target.value)}
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
