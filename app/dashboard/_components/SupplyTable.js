'use client';

import { useMemo, useState, Fragment } from 'react';
import { PROVINCES } from '../_lib/pheoc-criteria';
import { fmt } from './ui';

const isInventoryItem = (name) => !!name && (name.includes('(ชิ้น)') || name.includes('(หลัง)')) && !name.includes('(รายวัน)');

const VIEWS = [
    { key: 'stock', label: 'คงคลัง', rgb: '37,99,235', ink: 'text-blue-800' },
    { key: 'dispatched', label: 'จ่ายแล้ว', rgb: '234,88,12', ink: 'text-orange-800' },
    { key: 'both', label: 'ทั้งสองอย่าง' },
];

/** ตารางเวชภัณฑ์รายจังหวัด: สลับมุมมองได้ + ไล่สีพื้นตามปริมาณ (สีเดียว อ่อน→เข้ม) */
export default function SupplyTable({ snapshot = [] }) {
    const [view, setView] = useState('stock');

    const { rows, totals, maxByKey } = useMemo(() => {
        const rows = snapshot
            .filter((it) => isInventoryItem(it.item) || it.provinces.some((p) => p.dispatched > 0))
            .sort((a, b) => (a.item || '').localeCompare(b.item || '', 'th'))
            .map((it) => {
                const cells = {};
                PROVINCES.forEach((p) => {
                    const d = it.provinces.find((x) => x.province === p);
                    cells[p] = {
                        stock: isInventoryItem(it.item) ? d?.stock || 0 : 0,
                        dispatched: d?.dispatched || 0,
                    };
                });
                return { item: it.item, cells };
            });
        const totals = {};
        const maxByKey = { stock: 0, dispatched: 0 };
        PROVINCES.forEach((p) => {
            totals[p] = { stock: 0, dispatched: 0 };
            rows.forEach((r) => {
                totals[p].stock += r.cells[p].stock;
                totals[p].dispatched += r.cells[p].dispatched;
                maxByKey.stock = Math.max(maxByKey.stock, r.cells[p].stock);
                maxByKey.dispatched = Math.max(maxByKey.dispatched, r.cells[p].dispatched);
            });
        });
        return { rows, totals, maxByKey };
    }, [snapshot]);

    const metrics = view === 'both' ? VIEWS.slice(0, 2) : VIEWS.filter((v) => v.key === view);

    const cellStyle = (metric, value) => {
        const max = maxByKey[metric.key];
        if (!value || !max) return undefined;
        const a = 0.06 + 0.34 * (value / max);
        return { backgroundColor: `rgba(${metric.rgb},${a.toFixed(3)})` };
    };

    return (
        <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div role="tablist" className="inline-flex rounded-xl bg-slate-100 p-1">
                    {VIEWS.map((v) => (
                        <button
                            key={v.key}
                            role="tab"
                            aria-selected={view === v.key}
                            onClick={() => setView(v.key)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${view === v.key ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-800'}`}
                        >
                            {v.label}
                        </button>
                    ))}
                </div>
                <span className="text-[13px] text-slate-500">สีพื้นเข้ม = ปริมาณมาก · เลื่อนซ้าย-ขวาได้บนจอเล็ก</span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left border-collapse text-[15px]" style={{ minWidth: view === 'both' ? 900 : 640 }}>
                    <thead className="bg-slate-50 text-slate-700">
                        <tr>
                            <th rowSpan={view === 'both' ? 2 : 1} className="sticky left-0 z-10 bg-slate-50 px-3 py-2.5 text-sm font-semibold border-r border-slate-200 min-w-48">
                                รายการ
                            </th>
                            {PROVINCES.map((p) => (
                                <th key={p} colSpan={metrics.length} className="px-2 py-2.5 text-center text-sm font-semibold border-r border-slate-200 last:border-r-0">
                                    {p}
                                </th>
                            ))}
                        </tr>
                        {view === 'both' && (
                            <tr className="text-sm text-slate-500">
                                {PROVINCES.map((p) => metrics.map((m) => (
                                    <th key={`${p}-${m.key}`} className="px-2 pb-2 text-center text-xs font-medium border-r border-slate-200 last:border-r-0">{m.label}</th>
                                )))}
                            </tr>
                        )}
                    </thead>
                    <tbody>
                        {rows.length === 0 && (
                            <tr><td colSpan={1 + PROVINCES.length * metrics.length} className="p-8 text-center text-slate-400">ยังไม่มีข้อมูลเวชภัณฑ์</td></tr>
                        )}
                        {rows.map((r) => (
                            <tr key={r.item} className="border-t border-slate-100 hover:bg-slate-50/60">
                                <td className="sticky left-0 z-10 bg-white px-3 py-2 text-slate-800 border-r border-slate-200">{r.item}</td>
                                {PROVINCES.map((p) => (
                                    <Fragment key={p}>
                                        {metrics.map((m) => {
                                            const v = r.cells[p][m.key];
                                            return (
                                                <td key={m.key} style={cellStyle(m, v)}
                                                    className={`px-2 py-2 text-center tabular-nums border-r border-slate-100 ${v ? `${m.ink} font-medium` : 'text-slate-300'}`}>
                                                    {v ? fmt(v) : '–'}
                                                </td>
                                            );
                                        })}
                                    </Fragment>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                    {rows.length > 0 && (
                        <tfoot className="border-t-2 border-slate-300 bg-slate-50">
                            <tr>
                                <td className="sticky left-0 z-10 bg-slate-50 px-3 py-2.5 font-semibold text-slate-900 border-r border-slate-200">รวม</td>
                                {PROVINCES.map((p) => (
                                    <Fragment key={p}>
                                        {metrics.map((m) => (
                                            <td key={m.key} className={`px-2 py-2.5 text-center font-semibold tabular-nums border-r border-slate-200 ${m.ink}`}>
                                                {fmt(totals[p][m.key])}
                                            </td>
                                        ))}
                                    </Fragment>
                                ))}
                            </tr>
                        </tfoot>
                    )}
                </table>
            </div>
        </div>
    );
}
