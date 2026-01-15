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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
            {groups.map((group) => (
                <div key={group.key} className="bg-slate-50 border border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-between text-center transition-all hover:bg-white hover:shadow-md hover:scale-[1.02]">
                    <label className="text-base font-semibold text-slate-700 mb-4 h-12 flex items-center justify-center">
                        {group.label}
                    </label>
                    <div className="w-full relative">
                        <input
                            type="number"
                            name={group.key}
                            min="0"
                            disabled={disabled}
                            placeholder="0"
                            value={counts[group.key] || ''}
                            onChange={(e) => onChange(group.key, e.target.value)}
                            className="block w-full text-center rounded-xl border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 text-3xl font-bold text-emerald-600 py-3 px-4 placeholder:text-slate-200 disabled:opacity-50 disabled:bg-slate-100"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-medium pointer-events-none">
                            คน
                        </span>
                    </div>
                </div>
            ))}
        </div>
    )
}
