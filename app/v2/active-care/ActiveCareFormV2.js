'use client';

import { useActionState, useCallback, useEffect, useState } from 'react';
import { getActiveCareData, saveActiveCareData, getActiveCareHistory, deleteActiveCareData } from '@/app/actions/active-care';
import {
    Step, DateField, NumberField, SaveBar, Notice, RecordStatus, HistoryTable, EditButton, DeleteButton,
    useToast, todayStr, thaiDate, fmt, toInt, placeText,
} from '../_components/form-kit';
import { useLocationTarget } from '../_components/useLocationTarget';

// ชื่อกิจกรรมต้องตรงกับ action เดิม (ใช้ต่อท้ายชื่อช่อง และเก็บเป็น activity)
const ACTIVITIES = ['การสอบสวนโรค', 'การดูแลสุขภาพจิต', 'การรักษาพยาบาลเบื้องต้น'];
const CARE_FIELDS = [
    { key: 'households', label: 'เยี่ยมบ้าน', unit: 'หลัง' },
    { key: 'people', label: 'ประชาชนที่ดูแล', unit: 'คน' },
    { key: 'riskGroups', label: 'พบกลุ่มเสี่ยง', unit: 'คน' },
];
const SUPPORT = [
    { key: 'orgCount', label: 'จำนวน อปท. ที่สนับสนุน', unit: 'แห่ง' },
    { key: 'maskSupport', label: 'หน้ากาก', unit: 'ชิ้น' },
    { key: 'dustNetSupport', label: 'มุ้งสู้ฝุ่น', unit: 'หลัง', note: 'ค่าเดียวกับ “มุ้งที่ อปท. สนับสนุน” ในหน้าแจกหน้ากาก/มุ้ง' },
    { key: 'cleanRoomSupport', label: 'ห้องปลอดฝุ่น', unit: 'ห้อง' },
];
const str = (n) => (n ? String(n) : '');

export default function ActiveCareFormV2({ user }) {
    const [state, formAction, pending] = useActionState(saveActiveCareData, { message: '', success: false });
    const [toast, showToast] = useToast();
    const { locationId, jumpTo, field: locationField } = useLocationTarget(user);
    const [date, setDate] = useState(todayStr());
    const [values, setValues] = useState({});
    const [loaded, setLoaded] = useState(null);
    const [exists, setExists] = useState(false);
    const [history, setHistory] = useState(null);
    const loadKey = `${date}|${locationId}`;
    const loading = locationId != null && loaded !== loadKey;

    const refreshHistory = useCallback(() => getActiveCareHistory().then((r) => setHistory(r.success ? r.data : [])), []);
    useEffect(() => { refreshHistory(); }, [refreshHistory]);

    useEffect(() => {
        if (locationId == null) return;
        let cancelled = false;
        getActiveCareData(date, locationId).then((res) => {
            if (cancelled) return;
            const v = {};
            if (res.success) {
                res.data.activeCares.forEach((c) => CARE_FIELDS.forEach((f) => { v[`${f.key}_${c.activity}`] = str(c[f.key]); }));
                SUPPORT.forEach((f) => { v[f.key] = str(res.data.adminSupport?.[f.key]); });
            } else {
                showToast(res.error || 'โหลดข้อมูลไม่สำเร็จ', 'error');
            }
            setValues(v);
            setExists(Object.values(v).some((x) => toInt(x) > 0));
            setLoaded(`${date}|${locationId}`);
        });
        return () => { cancelled = true; };
    }, [date, locationId, state, showToast]);

    useEffect(() => {
        if (state.success) { showToast(state.message); refreshHistory(); }
        else if (state.message) showToast(state.message, 'error');
    }, [state, showToast, refreshHistory]);

    const set = (k) => (v) => setValues((s) => ({ ...s, [k]: v }));
    const sumField = (f) => ACTIVITIES.reduce((a, act) => a + toInt(values[`${f}_${act}`]), 0);
    const editable = (h) => user.role === 'ADMIN' || user.role === 'HEALTH_REGION' || h.locationId === user.locationId;

    return (
        <div className="space-y-4">
            <form action={formAction} className="space-y-4">
                <input type="hidden" name="date" value={date} />
                {locationId != null && <input type="hidden" name="locationId" value={locationId} />}

                <Step no="1" title="วันที่และพื้นที่">
                    <div className="space-y-4">
                        <DateField value={date} onChange={setDate} label="วันที่ปฏิบัติงาน" />
                        {locationField}
                    </div>
                </Step>

                {locationId == null ? (
                    <Notice>เลือกพื้นที่ให้ครบถึงระดับตำบลก่อน แล้วช่องกรอกจะแสดงขึ้นมา</Notice>
                ) : (
                    <>
                        <Step no="2" title="การปฏิบัติการเชิงรุก" hint="กรอกเฉพาะกิจกรรมที่ทำในวันนี้ · ไม่ได้ทำให้เว้นว่าง">
                            <div className="mb-4"><RecordStatus loading={loading} exists={exists} /></div>
                            <fieldset disabled={loading} className="space-y-3">
                                {ACTIVITIES.map((act) => (
                                    <div key={act} className="rounded-xl border border-slate-200 p-3.5">
                                        <div className="font-semibold text-slate-900 mb-2.5">{act}</div>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                            {CARE_FIELDS.map((f) => (
                                                <NumberField key={f.key} name={`${f.key}_${act}`} label={f.label} unit={f.unit}
                                                    value={values[`${f.key}_${act}`] || ''} onChange={set(`${f.key}_${act}`)} />
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </fieldset>
                        </Step>

                        <Step no="3" title="การสนับสนุนจาก อปท." hint="ไม่มีให้เว้นว่าง">
                            <fieldset disabled={loading} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                {SUPPORT.map((f) => (
                                    <NumberField key={f.key} name={f.key} label={f.label} sub={f.note} unit={f.unit} value={values[f.key] || ''} onChange={set(f.key)} />
                                ))}
                            </fieldset>
                        </Step>
                    </>
                )}

                <SaveBar
                    pending={pending}
                    disabled={locationId == null || loading}
                    summary={<>{thaiDate(date)} · เยี่ยมบ้าน <b className="text-slate-900 tabular-nums">{fmt(sumField('households'))}</b> หลัง · ดูแล <b className="text-slate-900 tabular-nums">{fmt(sumField('people'))}</b> คน · กลุ่มเสี่ยง <b className="text-slate-900 tabular-nums">{fmt(sumField('riskGroups'))}</b> คน</>}
                />
            </form>

            <Step title="ประวัติการบันทึก" hint="กด “แก้ไข” เพื่อเปิดข้อมูลวันนั้นขึ้นมาในฟอร์มด้านบน">
                <HistoryTable
                    rows={history || []}
                    loading={history === null}
                    rowKey={(h) => `${h.date}-${h.locationId}-${h.recordedBy}`}
                    columns={[
                        { key: 'date', label: 'วันที่', render: (h) => thaiDate(h.date) },
                        { key: 'org', label: 'หน่วยงาน', render: (h) => h.recordedBy || '—' },
                        { key: 'place', label: 'พื้นที่', render: placeText },
                        { key: 'total', label: 'รวม', align: 'right', render: (h) => fmt(h.totalCount) },
                    ]}
                    actions={(h) => (
                        <>
                            {editable(h) && <EditButton onClick={() => {
                                if (h.locationId !== locationId) jumpTo({ id: h.locationId, provinceName: h.provinceName, districtName: h.districtName, subDistrict: h.subDistrict });
                                setDate(h.date);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            }} />}
                            <DeleteButton onConfirm={async () => {
                                const res = await deleteActiveCareData(h.date, h.locationId);
                                showToast(res.message, res.success ? 'success' : 'error');
                                if (res.success) refreshHistory();
                            }} />
                        </>
                    )}
                />
            </Step>
            {toast}
        </div>
    );
}
