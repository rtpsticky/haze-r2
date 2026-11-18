'use client';

import { useActionState, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Upload, X } from 'lucide-react';
import { savePheocReport, deletePheocReport } from '@/app/actions/pheoc';
import { MODES, toMode } from '@/app/dashboard/_lib/pheoc-criteria';
import {
    Step, DateField, SaveBar, Notice, HistoryTable, EditButton, DeleteButton, useToast, todayStr, dateKey, thaiDate, placeText,
} from '../_components/form-kit';

// ตัวเลือกตามเกณฑ์เดียวกับ Dashboard → แปลงเป็นค่าที่ action เดิมรับ (status / subStatus*)
const CHOICES = [
    { key: 'WATCH', mode: MODES.WATCH, form: { status: 'NOT_OPEN', subStatusNotOpen: 'WATCH' } },
    { key: 'ALERT', mode: MODES.ALERT, form: { status: 'NOT_OPEN', subStatusNotOpen: 'ALERT' } },
    { key: 'RESPONSE_1', mode: MODES.RESPONSE_1, form: { status: 'OPEN', subStatusOpen: 'RESPONSE_1' } },
    { key: 'RESPONSE_2', mode: MODES.RESPONSE_2, form: { status: 'OPEN', subStatusOpen: 'RESPONSE_2' } },
    { key: 'CLOSED', mode: { th: 'ปิดศูนย์ PHEOC', pm: 'PM2.5 < 75.1 ติดต่อกัน 7 วัน', solid: '#475569', soft: '#F1F5F9', softInk: '#334155' }, form: { status: 'CLOSED' } },
];

const fromRecord = (r) => {
    if (r.status === 'ปิดศูนย์') return 'CLOSED';
    return toMode(r.status, r.responseLevel).mode || 'WATCH';
};

const pdfHref = (url) => (url?.startsWith('/haze-input') ? url : `/haze-input${url}`);

function StatusPill({ r }) {
    const key = fromRecord(r);
    const c = CHOICES.find((x) => x.key === key)?.mode;
    return (
        <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-sm font-medium" style={{ backgroundColor: c.soft, color: c.softInk }}>
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.solid }} />
            {c.short || c.th}
        </span>
    );
}

export default function PheocFormV2({ reports }) {
    const router = useRouter();
    const [toast, showToast] = useToast();
    const [editing, setEditing] = useState(null);
    const [date, setDate] = useState(todayStr());
    const [choice, setChoice] = useState('WATCH');
    const [file, setFile] = useState(null);
    const fileRef = useRef();
    const topRef = useRef();

    const reset = () => {
        setEditing(null); setDate(todayStr()); setChoice('WATCH'); setFile(null);
        if (fileRef.current) fileRef.current.value = '';
    };

    const [, formAction, pending] = useActionState(async (prev, fd) => {
        const res = await savePheocReport(prev, fd);
        showToast(res.message, res.success ? 'success' : 'error');
        if (res.success) { reset(); router.refresh(); }
        return res;
    }, { message: '', success: false });

    const startEdit = (r) => {
        setEditing(r);
        setDate(dateKey(r.reportDate));
        setChoice(fromRecord(r));
        setFile(null);
        topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const sel = CHOICES.find((c) => c.key === choice);
    const legacy = editing && editing.responseLevel === 'ระดับตอบโต้ 3';

    return (
        <div className="space-y-4" ref={topRef}>
            <form action={formAction} className="space-y-4">
                <input type="hidden" name="id" value={editing?.id || ''} />
                {Object.entries(sel.form).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}

                {editing && (
                    <Notice tone="warn">
                        กำลัง<b>แก้ไข</b>รายงานวันที่ {thaiDate(dateKey(editing.reportDate))} ({placeText(editing)}) ·{' '}
                        <button type="button" onClick={reset} className="font-medium underline">ยกเลิกการแก้ไข</button>
                    </Notice>
                )}

                <Step no="1" title="วันที่รายงาน">
                    <DateField name="reportDate" value={date} onChange={setDate} />
                </Step>

                <Step no="2" title="สถานะของจังหวัดวันนี้" hint="เลือก 1 ข้อ ตามค่า PM2.5 (µg/m³) — เกณฑ์เดียวกับ Dashboard">
                    <div role="radiogroup" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
                        {CHOICES.map((c) => {
                            const on = choice === c.key;
                            return (
                                <label key={c.key} className="cursor-pointer rounded-xl border-2 p-3.5 transition-colors"
                                    style={{ borderColor: on ? c.mode.solid : '#E2E8F0', backgroundColor: on ? c.mode.soft : '#fff' }}>
                                    <input type="radio" name="v2-mode" className="sr-only" checked={on} onChange={() => setChoice(c.key)} />
                                    <span className="flex items-center gap-2">
                                        <span className="w-3.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: c.mode.solid }} />
                                        <span className="font-semibold text-slate-900 leading-snug">{c.mode.th}</span>
                                    </span>
                                    <span className="block text-[13px] text-slate-600 mt-1">{c.mode.up || c.mode.pm}</span>
                                    {c.form.status === 'OPEN' && <span className="block text-[12px] font-medium mt-1" style={{ color: c.mode.softInk }}>เปิดศูนย์ PHEOC</span>}
                                </label>
                            );
                        })}
                    </div>
                    {legacy && <Notice tone="warn" className="mt-3">รายงานนี้เคยบันทึกเป็น “ระดับตอบโต้ 3” (เกณฑ์เดิม) — ถ้ากดบันทึก จะถูกเปลี่ยนเป็นตัวเลือกที่เลือกไว้ด้านบน</Notice>}
                </Step>

                <Step no="3" title="แนบไฟล์คำสั่ง / ประวัติการเปิด-ปิดศูนย์" hint="ไม่บังคับ · ไฟล์ PDF ไม่เกิน 10MB">
                    <div className="flex flex-wrap items-center gap-3">
                        <label className="h-11 px-4 rounded-xl text-[15px] font-medium inline-flex items-center gap-2 border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 cursor-pointer">
                            <Upload className="w-5 h-5" /> เลือกไฟล์ PDF
                            <input ref={fileRef} type="file" name="file" accept=".pdf,application/pdf" className="sr-only" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                        </label>
                        {file ? (
                            <span className="inline-flex items-center gap-2 text-sm text-slate-700 bg-slate-100 rounded-lg px-3 py-1.5">
                                <FileText className="w-4 h-4" /> {file.name}
                                <button type="button" aria-label="นำไฟล์ออก" onClick={() => { setFile(null); fileRef.current.value = ''; }} className="p-0.5 rounded hover:bg-slate-200"><X className="w-4 h-4" /></button>
                            </span>
                        ) : editing?.pdfUrl ? (
                            <a href={pdfHref(editing.pdfUrl)} target="_blank" rel="noreferrer" className="text-sm text-blue-700 underline inline-flex items-center gap-1"><FileText className="w-4 h-4" /> ไฟล์เดิม (เลือกไฟล์ใหม่เพื่อแทนที่)</a>
                        ) : <span className="text-sm text-slate-400">ยังไม่ได้เลือกไฟล์</span>}
                    </div>
                </Step>

                <SaveBar
                    pending={pending}
                    label={editing ? 'บันทึกการแก้ไข' : 'บันทึกรายงาน'}
                    onCancel={editing ? reset : undefined}
                    summary={<span className="inline-flex items-center gap-2">{thaiDate(date)} · <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: sel.mode.solid }} /><b className="text-slate-900">{sel.mode.th}</b></span>}
                />
            </form>

            <Step title="รายงานที่บันทึกไว้" hint="50 รายการล่าสุด">
                <HistoryTable
                    rows={reports}
                    rowKey={(r) => r.id}
                    columns={[
                        { key: 'date', label: 'วันที่', render: (r) => thaiDate(dateKey(r.reportDate)) },
                        { key: 'place', label: 'พื้นที่', render: placeText },
                        { key: 'status', label: 'สถานะ', render: (r) => <StatusPill r={r} /> },
                        { key: 'pdf', label: 'ไฟล์', render: (r) => (r.pdfUrl ? <a href={pdfHref(r.pdfUrl)} target="_blank" rel="noreferrer" className="text-blue-700 underline">PDF</a> : '—') },
                    ]}
                    actions={(r) => (
                        <>
                            <EditButton onClick={() => startEdit(r)} />
                            <DeleteButton onConfirm={async () => {
                                const res = await deletePheocReport(r.id);
                                showToast(res.message, res.success ? 'success' : 'error');
                                if (res.success) { if (editing?.id === r.id) reset(); router.refresh(); }
                            }} />
                        </>
                    )}
                />
            </Step>
            {toast}
        </div>
    );
}
