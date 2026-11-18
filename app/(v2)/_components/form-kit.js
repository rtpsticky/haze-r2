'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Select from 'react-select';
import {
    CalendarDays, Check, CheckCircle2, CircleAlert, Info, Loader2, Pencil, Save, Trash2, X, FilePlus2, Inbox,
} from 'lucide-react';
import { getDistricts, getProvinces, getSubDistricts } from '@/app/actions/locations';

// ───────────────────────── helpers ─────────────────────────

export const fmt = (n) => (Number(n) || 0).toLocaleString('th-TH');
export const toInt = (v) => parseInt(v, 10) || 0;
/** เก็บเฉพาะตัวเลข (กันพิมพ์ - . e และเว้นวรรค) */
export const digits = (v) => String(v ?? '').replace(/\D/g, '').replace(/^0+(?=\d)/, '').slice(0, 9);

const pad = (n) => String(n).padStart(2, '0');
/** YYYY-MM-DD ตามเวลาเครื่องผู้ใช้ */
export const dateKey = (d = new Date()) => {
    const x = new Date(d);
    return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}`;
};
export const todayStr = () => dateKey();
export const shiftDate = (str, days) => {
    const [y, m, d] = str.split('-').map(Number);
    return dateKey(new Date(y, m - 1, d + days));
};
/** 'YYYY-MM-DD' → '18 พ.ย. 2569' หรือแบบเต็ม */
export const thaiDate = (str, long = false) => {
    if (!str) return '—';
    const [y, m, d] = String(str).slice(0, 10).split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('th-TH', long
        ? { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }
        : { day: 'numeric', month: 'short', year: 'numeric' });
};

export const PRIMARY = '#2563EB';

// ───────────────────────── layout ─────────────────────────

/** ขั้นตอนการกรอก (มีเลขกำกับ) */
export function Step({ no, title, hint, aside, children, className = '' }) {
    return (
        <section className={`bg-white rounded-2xl border border-slate-200 p-4 md:p-5 ${className}`}>
            <header className="flex flex-wrap items-start justify-between gap-2 mb-4">
                <div className="flex items-start gap-3 min-w-0">
                    {no && <span className="grid place-items-center w-7 h-7 rounded-lg bg-slate-800 text-white text-sm font-semibold shrink-0">{no}</span>}
                    <div className="min-w-0">
                        <h2 className="text-base md:text-lg font-semibold text-slate-900 leading-snug">{title}</h2>
                        {hint && <p className="text-sm text-slate-500 mt-0.5">{hint}</p>}
                    </div>
                </div>
                {aside}
            </header>
            {children}
        </section>
    );
}

export function Notice({ tone = 'info', children, className = '' }) {
    const s = {
        info: ['bg-blue-50 border-blue-100 text-blue-900', Info],
        warn: ['bg-amber-50 border-amber-200 text-amber-900', CircleAlert],
        error: ['bg-red-50 border-red-200 text-red-800', CircleAlert],
        success: ['bg-emerald-50 border-emerald-200 text-emerald-800', CheckCircle2],
    }[tone];
    const Icon = s[1];
    return (
        <div className={`flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-sm ${s[0]} ${className}`}>
            <Icon className="w-5 h-5 shrink-0 mt-px" />
            <div className="min-w-0">{children}</div>
        </div>
    );
}

export function Empty({ text = 'ยังไม่มีข้อมูล' }) {
    return (
        <div className="flex flex-col items-center justify-center py-8 text-slate-400">
            <Inbox className="w-8 h-8 mb-1.5" strokeWidth={1.5} />
            <span className="text-sm">{text}</span>
        </div>
    );
}

// ───────────────────────── inputs ─────────────────────────

/** วันที่ + ปุ่มลัด วันนี้ / เมื่อวาน */
export function DateField({ value, onChange, name, label = 'วันที่ของข้อมูล' }) {
    const today = todayStr();
    const chips = [
        { label: 'วันนี้', v: today },
        { label: 'เมื่อวาน', v: shiftDate(today, -1) },
    ];
    return (
        <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
            <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                    <CalendarDays className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                        type="date" name={name} required value={value} max={today}
                        onChange={(e) => e.target.value && onChange(e.target.value)}
                        className="h-11 pl-10 pr-3 rounded-xl border border-slate-300 bg-white text-[15px] focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/15"
                    />
                </div>
                {chips.map((c) => (
                    <button
                        key={c.label} type="button" onClick={() => onChange(c.v)}
                        className={`h-11 px-4 rounded-xl text-sm font-medium border transition-colors ${value === c.v ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                    >
                        {c.label}
                    </button>
                ))}
            </div>
            <p className="mt-1.5 text-sm text-slate-500">{thaiDate(value, true)}</p>
        </div>
    );
}

/** ช่องตัวเลขขนาดใหญ่ — แป้นตัวเลขบนมือถือ, กด Enter ไปช่องถัดไป, คลิกแล้วเลือกทั้งค่า */
export function NumberField({ label, sub, unit, value, onChange, name, compact = false, readOnly = false, ariaLabel }) {
    const onKeyDown = (e) => {
        if (e.key !== 'Enter') return;
        e.preventDefault();
        const all = [...(e.currentTarget.form?.querySelectorAll('input[data-num]:not([readonly])') || [])];
        const next = all[all.indexOf(e.currentTarget) + 1];
        if (next) next.focus();
    };
    const input = (
        <div className="relative">
            <input
                type="text" inputMode="numeric" autoComplete="off" data-num name={name}
                aria-label={ariaLabel || label} placeholder="0" readOnly={readOnly}
                value={value ?? ''} onChange={(e) => onChange?.(digits(e.target.value))}
                onFocus={(e) => e.target.select()} onKeyDown={onKeyDown}
                className={`w-full rounded-xl border text-right tabular-nums font-semibold placeholder:text-slate-300 focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/15
                    ${compact ? 'h-10 text-base pl-2' : 'h-12 text-xl pl-3'} ${unit ? (compact ? 'pr-10' : 'pr-14') : 'pr-3'}
                    ${readOnly ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-white border-slate-300 text-slate-900'}`}
            />
            {unit && <span className={`absolute top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none ${compact ? 'right-2.5 text-xs' : 'right-3.5 text-sm'}`}>{unit}</span>}
        </div>
    );
    if (!label) return input;
    return (
        <label className="block">
            <span className="block text-[15px] font-medium text-slate-800 leading-snug">{label}</span>
            {sub && <span className="block text-[13px] text-slate-500">{sub}</span>}
            <span className="block mt-1.5">{input}</span>
        </label>
    );
}

/** ตัวเลือกแบบการ์ด (แทน radio) */
export function ChoiceGroup({ options, value, onChange, name, cols = 'sm:grid-cols-3', size = 'md' }) {
    return (
        <div role="radiogroup" className={`grid grid-cols-1 ${cols} gap-2.5`}>
            {options.map((o) => {
                const on = value === o.value;
                const tone = o.color || PRIMARY;
                return (
                    <label
                        key={o.value}
                        className={`relative flex items-start gap-3 rounded-xl border-2 cursor-pointer transition-colors ${size === 'sm' ? 'px-3 py-2.5' : 'px-4 py-3.5'} ${on ? 'bg-white' : 'bg-white border-slate-200 hover:border-slate-300'}`}
                        style={on ? { borderColor: tone, backgroundColor: `${tone}0D` } : undefined}
                    >
                        <input type="radio" name={name} value={o.value} checked={on} onChange={() => onChange(o.value)} className="sr-only" />
                        <span className="mt-0.5 grid place-items-center w-5 h-5 rounded-full border-2 shrink-0" style={{ borderColor: on ? tone : '#CBD5E1' }}>
                            {on && <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: tone }} />}
                        </span>
                        <span className="min-w-0">
                            <span className="block font-semibold text-slate-900 leading-snug">{o.label}</span>
                            {o.desc && <span className="block text-[13px] text-slate-500 mt-0.5">{o.desc}</span>}
                        </span>
                    </label>
                );
            })}
        </div>
    );
}

export const selectStyles = {
    menu: (b) => ({ ...b, zIndex: 60, borderRadius: 12, overflow: 'hidden', fontSize: 15 }),
    control: (b, s) => ({
        ...b, minHeight: 44, borderRadius: 12, fontSize: 15,
        borderColor: s.isFocused ? PRIMARY : '#CBD5E1',
        backgroundColor: s.isDisabled ? '#F8FAFC' : '#fff',
        boxShadow: s.isFocused ? '0 0 0 4px rgba(37,99,235,0.15)' : 'none',
        '&:hover': { borderColor: s.isDisabled ? '#E2E8F0' : '#94A3B8' },
    }),
    valueContainer: (b) => ({ ...b, padding: '0 10px' }),
    option: (b, s) => ({
        ...b, padding: '9px 12px',
        backgroundColor: s.isSelected ? '#EFF6FF' : s.isFocused ? '#F8FAFC' : '#fff',
        color: s.isSelected ? '#1D4ED8' : '#334155',
    }),
    placeholder: (b) => ({ ...b, color: '#94A3B8' }),
    indicatorSeparator: () => ({ display: 'none' }),
};

const opt = (v) => (v ? { value: v, label: v } : null);

/**
 * เลือกพื้นที่ จังหวัด → อำเภอ → ตำบล แล้วคืน locationId ของตำบล
 * initial = { provinceName, districtName, subDistrict, id }
 */
export function LocationPicker({ initial, onChange, lockProvince = false }) {
    const [provinces, setProvinces] = useState(initial?.provinceName ? [initial.provinceName] : []);
    const [districts, setDistricts] = useState([]);
    const [subs, setSubs] = useState([]);
    const [p, setP] = useState(initial?.provinceName || '');
    const [d, setD] = useState(initial?.districtName || '');
    const [s, setS] = useState(initial?.subDistrict || '');

    useEffect(() => { if (!lockProvince) getProvinces().then((r) => r.success && setProvinces(r.data)); }, [lockProvince]);
    useEffect(() => { if (p) getDistricts(p).then((r) => r.success && setDistricts(r.data)); }, [p]);
    useEffect(() => { if (p && d) getSubDistricts(p, d).then((r) => r.success && setSubs(r.data)); }, [p, d]);

    const pickP = (v) => { setP(v); setD(''); setS(''); setDistricts([]); setSubs([]); onChange(null); };
    const pickD = (v) => { setD(v); setS(''); setSubs([]); onChange(null); };
    const pickS = (o) => {
        setS(o?.value || '');
        onChange(o ? { id: o.id, provinceName: p, districtName: d, subDistrict: o.value } : null);
    };

    return (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div>
                <span className="block text-sm font-medium text-slate-700 mb-1.5">จังหวัด</span>
                <Select instanceId="v2-loc-p" aria-label="จังหวัด" placeholder="เลือกจังหวัด" styles={selectStyles} isDisabled={lockProvince}
                    options={provinces.map(opt)} value={opt(p)} onChange={(o) => pickP(o?.value || '')} />
            </div>
            <div>
                <span className="block text-sm font-medium text-slate-700 mb-1.5">อำเภอ</span>
                <Select instanceId="v2-loc-d" aria-label="อำเภอ" placeholder="เลือกอำเภอ" styles={selectStyles} isDisabled={!p}
                    options={districts.map(opt)} value={opt(d)} onChange={(o) => pickD(o?.value || '')} />
            </div>
            <div>
                <span className="block text-sm font-medium text-slate-700 mb-1.5">ตำบล</span>
                <Select instanceId="v2-loc-s" aria-label="ตำบล" placeholder="เลือกตำบล" styles={selectStyles} isDisabled={!d}
                    options={subs.map((x) => ({ value: x.subDistrict, label: x.subDistrict, id: x.id }))}
                    value={s ? { value: s, label: s } : null} onChange={pickS} />
            </div>
        </div>
    );
}

// ───────────────────────── status & actions ─────────────────────────

/** บอกผู้ใช้ว่าการบันทึกครั้งนี้เป็น "เพิ่มใหม่" หรือ "แก้ไขข้อมูลเดิม" */
export function RecordStatus({ loading, exists, newText = 'ยังไม่มีข้อมูลของวันนี้ — บันทึกเป็นข้อมูลใหม่', existsText = 'มีข้อมูลของวันนี้แล้ว — แก้ไขตัวเลขแล้วกดบันทึกเพื่ออัปเดต' }) {
    if (loading) {
        return <span className="inline-flex items-center gap-1.5 text-sm text-slate-500"><Loader2 className="w-4 h-4 animate-spin" /> กำลังโหลดข้อมูลเดิม…</span>;
    }
    return exists ? (
        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-amber-800 bg-amber-50 border border-amber-200 rounded-full px-3 py-1"><Pencil className="w-3.5 h-3.5" />{existsText}</span>
    ) : (
        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-800 bg-blue-50 border border-blue-100 rounded-full px-3 py-1"><FilePlus2 className="w-3.5 h-3.5" />{newText}</span>
    );
}

/** แถบบันทึกติดล่างจอ — แสดงสรุปก่อนกดบันทึก */
export function SaveBar({ pending, disabled, label = 'บันทึกข้อมูล', summary, hint, onCancel, cancelLabel = 'ยกเลิก', type = 'submit', onClick }) {
    return (
        <div className="sticky bottom-0 z-30 -mx-4 md:mx-0 mt-2">
            <div className="bg-white/95 backdrop-blur border-t md:border border-slate-200 md:rounded-2xl px-4 py-3 flex flex-wrap items-center gap-3 shadow-[0_-4px_16px_-8px_rgba(15,23,42,0.15)]">
                <div className="flex-1 min-w-[180px] text-sm text-slate-600">
                    {summary}
                    {hint && <div className="text-[13px] text-slate-500">{hint}</div>}
                </div>
                {onCancel && (
                    <button type="button" onClick={onCancel} className="h-12 px-4 rounded-xl text-[15px] font-medium border border-slate-200 bg-white text-slate-600 hover:bg-slate-100">
                        {cancelLabel}
                    </button>
                )}
                <button
                    type={type} onClick={onClick} disabled={pending || disabled}
                    className="h-12 px-6 rounded-xl text-[15px] font-semibold inline-flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {pending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    {pending ? 'กำลังบันทึก…' : label}
                </button>
            </div>
        </div>
    );
}

/** ข้อความแจ้งผลมุมจอ — หายเองใน 4 วินาที */
export function useToast() {
    const [toast, setToast] = useState(null);
    const timer = useRef();
    const show = useCallback((message, tone = 'success') => {
        clearTimeout(timer.current);
        setToast({ message, tone, id: Date.now() });
        timer.current = setTimeout(() => setToast(null), 4000);
    }, []);
    useEffect(() => () => clearTimeout(timer.current), []);
    const node = toast ? (
        <div role="status" aria-live="polite" className="fixed z-50 left-1/2 -translate-x-1/2 bottom-24 md:bottom-8 w-[calc(100%-32px)] max-w-md">
            <div className={`flex items-center gap-2.5 rounded-2xl px-4 py-3.5 shadow-xl text-[15px] font-medium text-white ${toast.tone === 'error' ? 'bg-red-600' : 'bg-emerald-600'}`}>
                {toast.tone === 'error' ? <CircleAlert className="w-5 h-5 shrink-0" /> : <CheckCircle2 className="w-5 h-5 shrink-0" />}
                <span className="flex-1">{toast.message}</span>
                <button type="button" onClick={() => setToast(null)} aria-label="ปิด" className="p-1 rounded-full hover:bg-white/20"><X className="w-4 h-4" /></button>
            </div>
        </div>
    ) : null;
    return [node, show];
}

/** ปุ่มลบ 2 จังหวะ (กดครั้งแรก → ยืนยัน) ไม่ใช้ window.confirm */
export function DeleteButton({ onConfirm, disabled }) {
    const [armed, setArmed] = useState(false);
    const [busy, setBusy] = useState(false);
    useEffect(() => {
        if (!armed) return;
        const t = setTimeout(() => setArmed(false), 4000);
        return () => clearTimeout(t);
    }, [armed]);
    if (!armed) {
        return (
            <button type="button" disabled={disabled} onClick={() => setArmed(true)} className="h-9 px-3 rounded-lg text-sm font-medium inline-flex items-center gap-1 text-red-600 hover:bg-red-50 disabled:opacity-40">
                <Trash2 className="w-4 h-4" /> ลบ
            </button>
        );
    }
    return (
        <button
            type="button" disabled={busy}
            onClick={async () => { setBusy(true); try { await onConfirm(); } finally { setBusy(false); setArmed(false); } }}
            className="h-9 px-3 rounded-lg text-sm font-semibold inline-flex items-center gap-1 bg-red-600 text-white hover:bg-red-700"
        >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} ยืนยันลบ
        </button>
    );
}

export function EditButton({ onClick, label = 'แก้ไข' }) {
    return (
        <button type="button" onClick={onClick} className="h-9 px-3 rounded-lg text-sm font-medium inline-flex items-center gap-1 text-blue-700 hover:bg-blue-50">
            <Pencil className="w-4 h-4" /> {label}
        </button>
    );
}

/**
 * ตารางประวัติ (บนมือถือแสดงเป็นการ์ด)
 * columns: [{ key, label, align, render(row) }]
 */
export function HistoryTable({ rows, columns, rowKey, actions, loading, empty = 'ยังไม่มีประวัติการบันทึก', limit = 30 }) {
    const [showAll, setShowAll] = useState(false);
    if (loading) return <div className="py-8 flex justify-center text-slate-400"><Loader2 className="w-6 h-6 animate-spin" /></div>;
    if (!rows?.length) return <Empty text={empty} />;
    const list = showAll ? rows : rows.slice(0, limit);
    const cell = (c, r) => (c.render ? c.render(r) : r[c.key]);
    return (
        <div>
            {/* desktop */}
            <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-[15px]">
                    <thead className="bg-slate-50 text-sm text-slate-600">
                        <tr>
                            {columns.map((c) => <th key={c.key} className={`px-3 py-2.5 font-semibold ${c.align === 'right' ? 'text-right' : 'text-left'}`}>{c.label}</th>)}
                            {actions && <th className="px-3 py-2.5" />}
                        </tr>
                    </thead>
                    <tbody>
                        {list.map((r) => (
                            <tr key={rowKey(r)} className="border-t border-slate-100 hover:bg-slate-50/60">
                                {columns.map((c) => <td key={c.key} className={`px-3 py-2 ${c.align === 'right' ? 'text-right tabular-nums' : ''}`}>{cell(c, r)}</td>)}
                                {actions && <td className="px-2 py-1.5"><div className="flex justify-end gap-1">{actions(r)}</div></td>}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {/* mobile */}
            <ul className="md:hidden space-y-2">
                {list.map((r) => (
                    <li key={rowKey(r)} className="rounded-xl border border-slate-200 p-3">
                        <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
                            {columns.map((c) => (
                                <div key={c.key} className="min-w-0">
                                    <dt className="text-slate-500 text-[13px]">{c.label}</dt>
                                    <dd className="text-slate-900 truncate">{cell(c, r)}</dd>
                                </div>
                            ))}
                        </dl>
                        {actions && <div className="flex justify-end gap-1 mt-2 pt-2 border-t border-slate-100">{actions(r)}</div>}
                    </li>
                ))}
            </ul>
            {rows.length > limit && (
                <div className="text-center mt-3">
                    <button type="button" onClick={() => setShowAll((v) => !v)} className="text-sm font-medium text-blue-700 hover:underline">
                        {showAll ? 'แสดงน้อยลง' : `แสดงทั้งหมด (${fmt(rows.length)} รายการ)`}
                    </button>
                </div>
            )}
        </div>
    );
}

export const placeText = (r) => [r.provinceName, r.districtName, r.subDistrict].filter(Boolean).join(' › ') || '—';
