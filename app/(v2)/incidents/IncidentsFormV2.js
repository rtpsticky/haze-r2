'use client';

import { useCallback, useEffect, useState, useTransition } from 'react';
import { BadgeCheck, Clock } from 'lucide-react';
import { getIncidentData, saveIncident, updateIncident, deleteIncident, approveIncident } from '@/app/actions/incidents';
import {
    Step, DateField, ChoiceGroup, SaveBar, Notice, HistoryTable, EditButton, DeleteButton,
    useToast, todayStr, thaiDate, placeText,
} from '../_components/form-kit';
import { useLocationTarget } from '../_components/useLocationTarget';

const STATUS = [
    { value: 'บาดเจ็บ', label: 'บาดเจ็บ', desc: 'ได้รับบาดเจ็บ / เจ็บป่วยจากการปฏิบัติงาน', color: '#EA580C' },
    { value: 'เสียชีวิต', label: 'เสียชีวิต', desc: 'เสียชีวิตจากการปฏิบัติงาน', color: '#B91C1C' },
];
const EMPTY = { staffName: '', status: '', incidentDetails: '' };
const inputCls = 'w-full rounded-xl border border-slate-300 bg-white px-3.5 text-[15px] focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/15';

export default function IncidentsFormV2({ user }) {
    const [toast, showToast] = useToast();
    const [pending, startTransition] = useTransition();
    const { locationId, field: locationField } = useLocationTarget(user);
    const canSave = ['HOSPITAL', 'PCU', 'RPS', 'ADMIN'].includes(user.role);
    const canApprove = user.role === 'SSJ' || user.role === 'ADMIN';

    const [date, setDate] = useState(todayStr());
    const [form, setForm] = useState(EMPTY);
    const [editing, setEditing] = useState(null); // incident ที่กำลังแก้ไข
    const [listed, setListed] = useState({ date: null, items: [] });
    const [reloadTick, setReloadTick] = useState(0);
    const list = listed.date === date ? listed.items : null; // null = กำลังโหลด
    const load = useCallback(() => setReloadTick((t) => t + 1), []);

    useEffect(() => {
        let cancelled = false;
        getIncidentData(date, null).then((r) => !cancelled && setListed({ date, items: r.success ? r.data.incidents : [] }));
        return () => { cancelled = true; };
    }, [date, reloadTick]);

    const reset = () => { setForm(EMPTY); setEditing(null); };
    const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

    const submit = (e) => {
        e.preventDefault();
        const fd = new FormData();
        fd.append('staffName', form.staffName.trim());
        fd.append('status', form.status);
        fd.append('incidentDetails', form.incidentDetails.trim());
        if (editing) fd.append('id', editing.id);
        else { fd.append('recordDate', date); fd.append('locationId', locationId); }
        startTransition(async () => {
            const res = editing ? await updateIncident(null, fd) : await saveIncident(null, fd);
            showToast(res.message, res.success ? 'success' : 'error');
            if (res.success) { reset(); load(); }
        });
    };

    const startEdit = (inc) => {
        setEditing(inc);
        setForm({ staffName: inc.staffName, status: inc.status, incidentDetails: inc.incidentDetails });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const ready = form.staffName.trim() && form.status && form.incidentDetails.trim() && (editing || locationId != null);

    return (
        <div className="space-y-4">
            <Step no="1" title="วันที่เกิดเหตุ" hint="รายการด้านล่างจะแสดงตามวันที่ที่เลือก">
                <DateField value={date} onChange={(d) => { setDate(d); reset(); }} />
            </Step>

            {canSave ? (
                <form onSubmit={submit} className="space-y-4">
                    {editing && (
                        <Notice tone="warn">
                            กำลัง<b>แก้ไข</b>รายการของ {editing.staffName} · <button type="button" onClick={reset} className="font-medium underline">ยกเลิกการแก้ไข</button>
                        </Notice>
                    )}
                    <Step no="2" title={editing ? 'แก้ไขข้อมูลผู้ได้รับผลกระทบ' : 'เพิ่มผู้ได้รับผลกระทบ'} hint="บันทึกทีละ 1 คน · รายการใหม่ต้องรอ สสจ. อนุมัติ">
                        <div className="space-y-4">
                            {!editing && locationField}
                            <label className="block">
                                <span className="block text-sm font-medium text-slate-700 mb-1.5">ชื่อ-นามสกุล (เจ้าหน้าที่ / จิตอาสาดับไฟป่า) <span className="text-red-500">*</span></span>
                                <input type="text" required value={form.staffName} onChange={(e) => set('staffName')(e.target.value)} placeholder="เช่น นายสมชาย ใจดี" className={`${inputCls} h-12`} />
                            </label>
                            <div>
                                <span className="block text-sm font-medium text-slate-700 mb-1.5">ผลกระทบ <span className="text-red-500">*</span></span>
                                <ChoiceGroup name="v2-inc-status" options={STATUS} value={form.status} onChange={set('status')} cols="sm:grid-cols-2" />
                            </div>
                            <label className="block">
                                <span className="block text-sm font-medium text-slate-700 mb-1.5">รายละเอียดเหตุการณ์ <span className="text-red-500">*</span></span>
                                <textarea required rows={3} value={form.incidentDetails} onChange={(e) => set('incidentDetails')(e.target.value)}
                                    placeholder="เกิดที่ไหน อาการ/การบาดเจ็บ และการช่วยเหลือที่ได้รับ" className={`${inputCls} py-2.5`} />
                            </label>
                        </div>
                    </Step>
                    <SaveBar
                        pending={pending}
                        disabled={!ready}
                        label={editing ? 'บันทึกการแก้ไข' : 'บันทึกรายการ'}
                        onCancel={editing ? reset : undefined}
                        summary={<>{thaiDate(date)}{form.staffName.trim() && <> · <b className="text-slate-900">{form.staffName.trim()}</b></>}{form.status && <> · {form.status}</>}</>}
                        hint={!ready ? 'กรอกชื่อ เลือกผลกระทบ และรายละเอียดให้ครบ' : null}
                    />
                </form>
            ) : (
                <Notice>บทบาทของคุณดูและอนุมัติรายการได้ — การบันทึกทำโดยโรงพยาบาลและ รพ.สต.</Notice>
            )}

            <Step title={`รายการวันที่ ${thaiDate(date)}`} hint={canApprove ? 'ตรวจสอบแล้วกด “อนุมัติ” เพื่อนับในรายงาน' : undefined}>
                <HistoryTable
                    rows={list || []}
                    loading={list === null}
                    empty="ไม่มีรายงานอุบัติการณ์ในวันนี้"
                    rowKey={(r) => r.id}
                    columns={[
                        { key: 'name', label: 'ชื่อ-นามสกุล', render: (r) => <span className="font-medium">{r.staffName}</span> },
                        { key: 'status', label: 'ผลกระทบ', render: (r) => <span className={`text-sm font-medium rounded-full px-2.5 py-0.5 ${r.status === 'เสียชีวิต' ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'}`}>{r.status}</span> },
                        { key: 'detail', label: 'รายละเอียด', render: (r) => <span className="text-slate-600 line-clamp-2" title={r.incidentDetails}>{r.incidentDetails}</span> },
                        { key: 'org', label: 'หน่วยงาน / พื้นที่', render: (r) => <>{r.orgName}<div className="text-[12px] text-slate-500">{placeText(r.location || {})}</div></> },
                        { key: 'approved', label: 'สถานะ', render: (r) => (r.isApproved
                            ? <span className="inline-flex items-center gap-1 text-sm text-emerald-700"><BadgeCheck className="w-4 h-4" /> อนุมัติแล้ว</span>
                            : <span className="inline-flex items-center gap-1 text-sm text-amber-700"><Clock className="w-4 h-4" /> รออนุมัติ</span>) },
                    ]}
                    actions={(r) => (
                        <>
                            {canApprove && !r.isApproved && (
                                <button type="button" onClick={async () => {
                                    const res = await approveIncident(r.id);
                                    showToast(res.message, res.success ? 'success' : 'error');
                                    if (res.success) load();
                                }} className="h-9 px-3 rounded-lg text-sm font-semibold inline-flex items-center gap-1 bg-emerald-600 text-white hover:bg-emerald-700">
                                    <BadgeCheck className="w-4 h-4" /> อนุมัติ
                                </button>
                            )}
                            {canSave && !r.isApproved && <EditButton onClick={() => startEdit(r)} />}
                            {canSave && (!r.isApproved || user.role === 'ADMIN') && (
                                <DeleteButton onConfirm={async () => {
                                    const res = await deleteIncident(r.id);
                                    showToast(res.message, res.success ? 'success' : 'error');
                                    if (res.success) { if (editing?.id === r.id) reset(); load(); }
                                }} />
                            )}
                        </>
                    )}
                />
            </Step>
            {toast}
        </div>
    );
}
