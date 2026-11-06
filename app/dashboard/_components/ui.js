'use client';

import { useEffect } from 'react';
import { X, Inbox } from 'lucide-react';

export const fmt = (n) => (Number(n) || 0).toLocaleString('th-TH');
export const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);

/** หัวข้อหมวด (เลขข้อตรงกับแบบรายงาน) */
export function SectionTitle({ no, title, note }) {
    return (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-3">
            <span className="grid place-items-center w-7 h-7 rounded-lg bg-slate-800 text-white text-sm font-semibold">{no}</span>
            <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
            {note && <span className="text-sm text-slate-500">{note}</span>}
            <div className="flex-1 h-px bg-slate-200 min-w-8" />
        </div>
    );
}

/** กล่องเนื้อหามาตรฐาน */
export function Panel({ icon: Icon, title, subtitle, aside, children, className = '' }) {
    return (
        <section className={`bg-white rounded-2xl border border-slate-200 p-4 md:p-5 flex flex-col ${className}`}>
            {(title || aside) && (
                <header className="flex flex-wrap items-start justify-between gap-2 mb-4">
                    <div className="flex items-center gap-2.5 min-w-0">
                        {Icon && <Icon className="w-5 h-5 text-slate-500 shrink-0" strokeWidth={2} />}
                        <div className="min-w-0">
                            <h3 className="text-base font-semibold text-slate-900 leading-snug">{title}</h3>
                            {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
                        </div>
                    </div>
                    {aside}
                </header>
            )}
            {children}
        </section>
    );
}

/** ตัวเลขสรุป (KPI) */
export function Kpi({ icon: Icon, label, value, unit, sub, alert = false }) {
    return (
        <div className={`rounded-2xl border p-4 ${alert ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200'}`}>
            <div className={`flex items-center gap-1.5 text-sm ${alert ? 'text-red-700' : 'text-slate-500'}`}>
                {Icon && <Icon className="w-4 h-4 shrink-0" />}
                <span className="truncate">{label}</span>
            </div>
            <div className="mt-1.5 flex items-baseline gap-1">
                <span className={`text-2xl md:text-[1.75rem] font-semibold tabular-nums leading-none ${alert ? 'text-red-700' : 'text-slate-900'}`}>
                    {typeof value === 'number' ? fmt(value) : value}
                </span>
                {unit && <span className="text-sm text-slate-500">{unit}</span>}
            </div>
            {sub && <div className="mt-1.5 text-[13px] text-slate-500 truncate">{sub}</div>}
        </div>
    );
}

/** ตัวเลขย่อยภายในกล่อง */
export function Stat({ label, value, unit, tone }) {
    const color = tone === 'red' ? 'text-red-700' : tone === 'orange' ? 'text-orange-700' : 'text-slate-900';
    return (
        <div className="rounded-xl bg-slate-50 px-3.5 py-3">
            <div className="text-sm text-slate-500">{label}</div>
            <div className="mt-0.5 flex items-baseline gap-1">
                <span className={`text-xl font-semibold tabular-nums ${color}`}>{fmt(value)}</span>
                {unit && <span className="text-[13px] text-slate-500">{unit}</span>}
            </div>
        </div>
    );
}

export function Progress({ value, max, color = '#2563EB', height = 'h-2' }) {
    const w = max ? Math.min((value / max) * 100, 100) : 0;
    return (
        <div className={`${height} rounded-full bg-slate-100 overflow-hidden`}>
            <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${w}%`, backgroundColor: color }} />
        </div>
    );
}

export function Empty({ text = 'ยังไม่มีข้อมูล' }) {
    return (
        <div className="flex-1 flex flex-col items-center justify-center py-8 text-slate-400">
            <Inbox className="w-8 h-8 mb-1.5" strokeWidth={1.5} />
            <span className="text-sm">{text}</span>
        </div>
    );
}

/**
 * กราฟแท่งแนวนอน (HTML) — เรียงมากไปน้อย, ตัวเลข + % กำกับทุกแท่ง
 * row.sub (ถ้ามี) แสดงเป็นบรรทัดรายละเอียดใต้แท่ง
 */
export function BarList({ data, unit = '', color = '#2563EB', sort = true, showShare = true, twoCol = false }) {
    const rows = (sort ? [...data].sort((a, b) => b.value - a.value) : data).filter((d) => d.value > 0);
    if (rows.length === 0) return <Empty />;
    const max = Math.max(...rows.map((r) => r.value));
    const total = rows.reduce((a, r) => a + r.value, 0);
    return (
        <ul className={twoCol ? 'md:columns-2 md:gap-x-8' : ''}>
            {rows.map((row, i) => (
                <li key={row.name ?? i} className="break-inside-avoid mb-2.5 last:mb-0" title={`${row.name}: ${fmt(row.value)} ${unit}`}>
                    <div className="flex items-baseline justify-between gap-3 text-[15px]">
                        <span className="text-slate-700 leading-snug">{row.name || 'ไม่ระบุ'}</span>
                        <span className="shrink-0 tabular-nums">
                            <b className="font-semibold text-slate-900">{fmt(row.value)}</b>
                            {unit && <span className="text-[13px] text-slate-500 ml-1">{unit}</span>}
                            {showShare && <span className="inline-block w-11 text-right text-[13px] text-slate-400">{pct(row.value, total)}%</span>}
                        </span>
                    </div>
                    <div className="mt-1"><Progress value={row.value} max={max} color={color} /></div>
                    {row.sub && <div className="mt-1 text-[13px] text-slate-500">{row.sub}</div>}
                </li>
            ))}
        </ul>
    );
}

export function Modal({ open, onClose, title, accent = '#334155', items = [] }) {
    useEffect(() => {
        if (!open) return;
        const onKey = (e) => e.key === 'Escape' && onClose();
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open, onClose]);
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-[2px] p-4" onClick={onClose}>
            <div role="dialog" aria-modal="true" className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
                <div className="h-1.5" style={{ backgroundColor: accent }} />
                <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center gap-3">
                    <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
                    <button onClick={onClose} className="p-1.5 rounded-full text-slate-500 hover:bg-slate-100" aria-label="ปิด"><X className="w-5 h-5" /></button>
                </div>
                <div className="p-5 overflow-y-auto">
                    {items.length ? (
                        <ul className="space-y-1.5">
                            {items.map((it, i) => (
                                <li key={i} className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-slate-50 text-[15px] text-slate-800">
                                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: accent }} />{it}
                                </li>
                            ))}
                        </ul>
                    ) : <div className="py-8 text-center text-slate-400">ไม่พบข้อมูล</div>}
                </div>
            </div>
        </div>
    );
}

export function DashboardSkeleton() {
    const b = 'bg-slate-200/70 rounded-2xl animate-pulse';
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
                <div className={`${b} h-80 xl:col-span-8`} />
                <div className={`${b} h-80 xl:col-span-4`} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
                {Array.from({ length: 6 }).map((_, i) => <div key={i} className={`${b} h-24`} />)}
            </div>
            <div className={`${b} h-72`} />
        </div>
    );
}
