'use client';

import { ClipboardList } from 'lucide-react';
import { MEASURE_GROUPS } from '../_lib/measures';
import { Panel, Progress, fmt, pct } from './ui';

/** ความคืบหน้าการดำเนินมาตรการ 1.1 – 4.2 (นับจากรายงานที่บันทึกว่า "ดำเนินการแล้ว") */
export default function MeasuresPanel({ measure, className = '' }) {
    const total = measure?.total || 0;
    const done = measure?.completed || 0;
    const byId = measure?.byId || {};
    const p = pct(done, total);

    return (
        <Panel icon={ClipboardList} title="การดำเนินมาตรการ" subtitle="ตามพื้นที่ที่เลือก" className={className}>
            <div className="flex items-end justify-between gap-3">
                <div>
                    <div className="text-3xl font-semibold tabular-nums text-slate-900 leading-none">{p}%</div>
                    <div className="text-sm text-slate-500 mt-1">ดำเนินการแล้ว {fmt(done)} จาก {fmt(total)} รายงาน</div>
                </div>
                <div className="text-right text-sm">
                    <div className="text-slate-500">รอดำเนินการ</div>
                    <div className="text-lg font-semibold tabular-nums text-amber-700">{fmt(measure?.pending)}</div>
                </div>
            </div>
            <div className="mt-2.5"><Progress value={done} max={total} color="#16A34A" height="h-2.5" /></div>

            <div className="mt-4 space-y-3">
                {MEASURE_GROUPS.map((g) => (
                    <div key={g.id}>
                        <div className="text-[13px] font-medium text-slate-500 mb-1">มาตรการที่ {g.id} · {g.title}</div>
                        <ul className="space-y-1.5">
                            {g.items.map((it) => {
                                const s = byId[it.id] || { total: 0, completed: 0 };
                                const ip = pct(s.completed, s.total);
                                return (
                                    <li key={it.id} className="grid grid-cols-[2.25rem_1fr_3.5rem] items-center gap-2 text-sm" title={`${it.id} ${it.short}: ${s.completed}/${s.total}`}>
                                        <span className="font-semibold text-slate-700 tabular-nums">{it.id}</span>
                                        <div className="min-w-0">
                                            <div className="truncate text-slate-700">{it.short}</div>
                                            <div className="mt-0.5"><Progress value={s.completed} max={s.total} color="#16A34A" height="h-1.5" /></div>
                                        </div>
                                        <span className={`text-right tabular-nums ${s.total ? 'text-slate-900 font-medium' : 'text-slate-300'}`}>
                                            {s.total ? `${ip}%` : '–'}
                                        </span>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                ))}
            </div>
        </Panel>
    );
}
