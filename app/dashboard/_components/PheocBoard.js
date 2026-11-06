'use client';

import { useState } from 'react';
import { CircleCheck, TriangleAlert, Siren, OctagonAlert, CircleHelp, ChevronDown, ShieldPlus } from 'lucide-react';
import { MODES, MODE_ORDER, NO_REPORT, CRITERIA_TEXT, buildProvinceBoard, assessRegion } from '../_lib/pheoc-criteria';
import { Panel } from './ui';

const MODE_ICONS = { WATCH: CircleCheck, ALERT: TriangleAlert, RESPONSE_1: Siren, RESPONSE_2: OctagonAlert, NONE: CircleHelp };

const thDate = (iso) => (iso ? new Date(iso).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' }) : '—');

export function ModeBadge({ modeKey }) {
    const m = MODES[modeKey] || NO_REPORT;
    const Icon = MODE_ICONS[modeKey] || MODE_ICONS.NONE;
    return (
        <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-sm font-medium whitespace-nowrap" style={{ backgroundColor: m.solid, color: m.ink }}>
            <Icon className="w-3.5 h-3.5" strokeWidth={2.5} />{m.short}
        </span>
    );
}

function RegionStatus({ region }) {
    const m = MODES[region.mode];
    const Icon = MODE_ICONS[region.mode];
    return (
        <div className="rounded-xl p-4 h-full flex flex-col" style={{ backgroundColor: m.solid, color: m.ink }}>
            <div className="text-sm opacity-90">ระดับเขตสุขภาพ (ประเมินเบื้องต้น)</div>
            <div className="mt-2 flex items-center gap-2.5">
                <Icon className="w-8 h-8 shrink-0" strokeWidth={2.25} />
                <div>
                    <div className="text-xl font-semibold leading-tight">{m.th}</div>
                    <div className="text-sm opacity-85 uppercase tracking-wide">{m.en}</div>
                </div>
            </div>
            <p className="mt-3 text-[15px] leading-relaxed">{region.reason}</p>
            {region.note && (
                <p className="mt-2 text-sm leading-relaxed rounded-lg px-3 py-2" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>{region.note}</p>
            )}
            <p className="mt-auto pt-3 text-[13px] opacity-80">จาก {region.reported}/5 จังหวัดที่รายงาน · ใช้ประกอบการตัดสินใจ</p>
        </div>
    );
}

function ProvinceTable({ board }) {
    return (
        <table className="w-full text-[15px]">
            <thead>
                <tr className="text-left text-sm text-slate-500 border-b border-slate-200">
                    <th className="py-2 pr-2 font-medium">จังหวัด</th>
                    <th className="py-2 px-2 font-medium">ระดับ</th>
                    <th className="py-2 px-2 font-medium hidden sm:table-cell">เกณฑ์ PM2.5 (µg/m³)</th>
                    <th className="py-2 pl-2 font-medium text-right">รายงาน</th>
                </tr>
            </thead>
            <tbody>
                {board.map((p) => {
                    const m = MODES[p.mode];
                    return (
                        <tr key={p.province} className="border-b border-slate-100 last:border-0">
                            <td className="py-2.5 pr-2 font-medium text-slate-900">
                                <span className="inline-block w-1.5 h-5 rounded-full align-middle mr-2" style={{ backgroundColor: (m || NO_REPORT).solid }} />
                                {p.province}
                            </td>
                            <td className="py-2.5 px-2">
                                <ModeBadge modeKey={p.mode || 'NONE'} />
                                {p.legacy && <span className="ml-1 text-xs text-slate-400" title="บันทึกเป็น “ระดับตอบโต้ 3” ตามเกณฑ์เดิม">*</span>}
                            </td>
                            <td className="py-2.5 px-2 text-slate-600 hidden sm:table-cell">{m ? m.pm.replace('PM2.5 ', '') : 'ยังไม่รายงาน'}</td>
                            <td className="py-2.5 pl-2 text-right text-slate-500 tabular-nums whitespace-nowrap">{thDate(p.reportDate)}</td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
    );
}

function CriteriaTable() {
    return (
        <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full min-w-[680px] text-left text-sm">
                <thead className="bg-slate-50 text-slate-600">
                    <tr>
                        <th className="p-3 font-semibold w-40">ระดับ</th>
                        <th className="p-3 font-semibold">PHEOC จังหวัด</th>
                        <th className="p-3 font-semibold">PHEOC ระดับเขตสุขภาพ</th>
                    </tr>
                </thead>
                <tbody>
                    {MODE_ORDER.map((key) => {
                        const m = MODES[key];
                        return (
                            <tr key={key} className="border-t border-slate-200 align-top">
                                <td className="p-3" style={{ backgroundColor: m.solid, color: m.ink }}>
                                    <div className="font-semibold">{m.th}</div>
                                    <div className="text-xs opacity-85 uppercase">{m.en}</div>
                                </td>
                                {['province', 'region'].map((col) => (
                                    <td key={col} className="p-3">
                                        <ul className="space-y-1 text-slate-700 leading-relaxed">
                                            {CRITERIA_TEXT[key][col].map((t) => {
                                                const [head, ...rest] = t.split(' ');
                                                const verb = head === 'ยกระดับ' || head === 'ลดระดับ';
                                                return (
                                                    <li key={t}>
                                                        • {verb ? <><b className={head === 'ยกระดับ' ? 'text-red-700' : 'text-emerald-700'}>{head}</b> {rest.join(' ')}</> : t}
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    </td>
                                ))}
                            </tr>
                        );
                    })}
                </tbody>
            </table>
            <div className="px-3 py-2 bg-slate-50 text-xs text-slate-500 border-t border-slate-200">
                หมายเหตุ: ค่า PM2.5 ที่มีทศนิยมตำแหน่งที่สอง ≥ 5 ให้ปัดขึ้น
            </div>
        </div>
    );
}

export default function PheocPanel({ latestByProvince, onOpenList, className = '' }) {
    const [showCriteria, setShowCriteria] = useState(true);
    const board = buildProvinceBoard(latestByProvince);
    const region = assessRegion(board);

    const counts = (
        <div className="flex flex-wrap gap-1.5">
            {MODE_ORDER.map((key) => {
                const m = MODES[key];
                const list = board.filter((p) => p.mode === key);
                return (
                    <button
                        key={key}
                        type="button"
                        onClick={() => onOpenList(`${m.th} (${m.en})`, list.map((p) => `${p.province} — รายงาน ${thDate(p.reportDate)}`), m.solid)}
                        className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-sm hover:bg-slate-50"
                        style={{ borderColor: m.ring }}
                        title={`ดูรายชื่อจังหวัด ${m.th}`}
                    >
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: m.solid }} />
                        <span className="text-slate-600">{m.short}</span>
                        <b className="tabular-nums text-slate-900">{list.length}</b>
                    </button>
                );
            })}
        </div>
    );

    return (
        <Panel icon={ShieldPlus} title="สถานการณ์ PHEOC" subtitle="ภาพรวมทั้งเขต · ไม่ขึ้นกับตัวกรอง" aside={counts} className={className}>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="md:col-span-2"><RegionStatus region={region} /></div>
                <div className="md:col-span-3 overflow-x-auto"><ProvinceTable board={board} /></div>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100">
                <button
                    type="button"
                    onClick={() => setShowCriteria((v) => !v)}
                    aria-expanded={showCriteria}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-700 hover:text-blue-900"
                >
                    เกณฑ์การยก-ลดระดับ PHEOC ปี 2570
                    <ChevronDown className={`w-4 h-4 transition-transform ${showCriteria ? 'rotate-180' : ''}`} />
                </button>
                {showCriteria && <div className="mt-3"><CriteriaTable /></div>}
            </div>
        </Panel>
    );
}
