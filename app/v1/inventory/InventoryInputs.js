'use client'

export const items = [
    { key: 'surgical_mask', label: 'หน้ากาก Surgical Mask (ชิ้น)' },
    { key: 'n95', label: 'หน้ากาก N95 (ชิ้น)' },
    { key: 'carbon_mask', label: 'หน้ากากคาร์บอน (ชิ้น)' },
    { key: 'cloth_mask', label: 'หน้ากากผ้า (ชิ้น)' },
    { key: 'dust_net', label: 'มุ้งสู้ฝุ่น (หลัง)' },
]

export default function InventoryInputs({ counts, onChange, disabled = false }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
            {items.map((item) => (
                <div key={item.key} className="bg-slate-50 border border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-between text-center transition-all hover:bg-white hover:shadow-md hover:scale-[1.02]">
                    <label className="text-base font-semibold text-slate-700 mb-4 h-12 flex items-center justify-center">
                        {item.label}
                    </label>
                    <div className="w-full relative">
                        <input
                            type="number"
                            name={item.key}
                            min="0"
                            disabled={disabled}
                            placeholder="0"
                            value={counts[item.key] || ''}
                            onChange={(e) => onChange(item.key, e.target.value)}
                            className="block w-full text-center rounded-xl border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 text-3xl font-bold text-emerald-600 py-3 px-4 placeholder:text-slate-200 disabled:opacity-50 disabled:bg-slate-100"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-medium pointer-events-none">
                            คงเหลือ
                        </span>
                    </div>
                </div>
            ))}
        </div>
    )
}
