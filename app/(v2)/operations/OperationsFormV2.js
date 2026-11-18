'use client';

import { useActionState, useCallback, useEffect, useState } from 'react';
import { getOperationData, saveOperationData, getOperationHistory, deleteOperationData } from '@/app/actions/operations';
import {
    Step, DateField, NumberField, SaveBar, Notice, RecordStatus, HistoryTable, EditButton, DeleteButton,
    useToast, todayStr, thaiDate, fmt, toInt, placeText,
} from '../_components/form-kit';
import { useLocationTarget } from '../_components/useLocationTarget';

// prefix = ชื่อช่องที่ action เดิมอ่าน (prefix_ชนิดหน้ากาก), group = targetGroup ในฐานข้อมูล
const GROUPS = [
    { prefix: 'ppeGeneral', group: 'GENERAL_PUBLIC', label: 'ประชาชนทั่วไป' },
    { prefix: 'ppeChildren', group: 'SMALL_CHILDREN', label: 'เด็กเล็ก' },
    { prefix: 'ppePregnant', group: 'PREGNANT_WOMEN', label: 'หญิงตั้งครรภ์' },
    { prefix: 'ppeElderly', group: 'ELDERLY', label: 'ผู้สูงอายุ' },
    { prefix: 'ppeBedridden', group: 'BEDRIDDEN', label: 'ผู้ป่วยติดเตียง' },
    { prefix: 'ppeHeart', group: 'HEART_DISEASE', label: 'ผู้ป่วยโรคหัวใจ' },
    { prefix: 'ppeRespiratory', group: 'RESPIRATORY_DISEASE', label: 'ผู้ป่วยโรคทางเดินหายใจ' },
];
const MASKS = [
    { key: 'Surgical Mask', label: 'Surgical' },
    { key: 'N95', label: 'N95' },
    { key: 'Carbon Mask', label: 'คาร์บอน' },
    { key: 'Cloth Mask', label: 'ผ้า' },
];
const NETS = [
    { key: 'bedriddenCount', label: 'ผู้ป่วยติดเตียงที่ได้รับมุ้ง', unit: 'คน' },
    { key: 'netsGiven', label: 'มุ้งที่มอบให้ประชาชน', unit: 'หลัง' },
    { key: 'netsLao', label: 'มุ้งที่ อปท. สนับสนุน', unit: 'หลัง' },
];
const name = (prefix, mask) => `${prefix}_${mask}`;
const str = (n) => (n ? String(n) : '');

export default function OperationsFormV2({ user }) {
    const [state, formAction, pending] = useActionState(saveOperationData, { message: '', success: false });
    const [toast, showToast] = useToast();
    const { locationId, jumpTo, field: locationField } = useLocationTarget(user);
    const [date, setDate] = useState(todayStr());
    const [values, setValues] = useState({});
    const [acc, setAcc] = useState({});
    const [loaded, setLoaded] = useState(null);
    const [exists, setExists] = useState(false);
    const [history, setHistory] = useState(null);
    const loadKey = `${date}|${locationId}`;
    const loading = locationId != null && loaded !== loadKey;

    const refreshHistory = useCallback(() => getOperationHistory().then((r) => setHistory(r.success ? r.data : [])), []);
    useEffect(() => { refreshHistory(); }, [refreshHistory]);

    useEffect(() => {
        if (locationId == null) return;
        let cancelled = false;
        getOperationData(date, locationId).then((res) => {
            if (cancelled) return;
            const v = {};
            const a = {};
            if (res.success) {
                res.data.operations.forEach((op) => {
                    if (op.activityType === 'DUST_NET') v.netsGiven = str(op.amount);
                    const g = GROUPS.find((x) => x.group === op.targetGroup);
                    if (op.activityType === 'PPE' && g) v[name(g.prefix, op.itemName)] = str(op.amount);
                });
                v.bedriddenCount = str(res.data.vulnerables.find((x) => x.groupType === 'BEDRIDDEN_OP')?.targetCount);
                v.netsLao = str(res.data.localSupport?.dustNetSupport);
                res.data.accumulated.forEach((x) => {
                    const g = GROUPS.find((y) => y.group === x.targetGroup);
                    if (g) a[g.prefix] = (a[g.prefix] || 0) + (x._sum.amount || 0);
                });
            } else {
                showToast(res.error || 'โหลดข้อมูลไม่สำเร็จ', 'error');
            }
            setValues(v);
            setAcc(a);
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
    const rowTotal = (g) => MASKS.reduce((a, m) => a + toInt(values[name(g.prefix, m.key)]), 0);
    const ppeTotal = GROUPS.reduce((a, g) => a + rowTotal(g), 0);
    const colTotal = (m) => GROUPS.reduce((a, g) => a + toInt(values[name(g.prefix, m.key)]), 0);
    const netTotal = toInt(values.netsGiven) + toInt(values.netsLao);

    const editable = (h) => user.role === 'ADMIN' || user.role === 'HEALTH_REGION' || h.locationId === user.locationId;

    return (
        <div className="space-y-4">
            <form action={formAction} className="space-y-4">
                <input type="hidden" name="date" value={date} />
                {locationId != null && <input type="hidden" name="locationId" value={locationId} />}

                <Step no="1" title="วันที่และพื้นที่">
                    <div className="space-y-4">
                        <DateField value={date} onChange={setDate} label="วันที่แจก" />
                        {locationField}
                    </div>
                </Step>

                {locationId == null ? (
                    <Notice>เลือกพื้นที่ให้ครบถึงระดับตำบลก่อน แล้วช่องกรอกจะแสดงขึ้นมา</Notice>
                ) : (
                    <>
                        <Step no="2" title="แจกหน้ากาก / PPE (ชิ้น)" hint="กรอกจำนวนที่แจกในวันนี้ แยกตามกลุ่มและชนิดหน้ากาก · ไม่ได้แจกให้เว้นว่าง">
                            <div className="mb-4"><RecordStatus loading={loading} exists={exists} newText="ยังไม่มีข้อมูลของวันนี้ — บันทึกเป็นข้อมูลใหม่" /></div>
                            <fieldset disabled={loading}>
                                {/* หัวคอลัมน์ (จอใหญ่) */}
                                <div className="hidden md:grid grid-cols-[minmax(160px,1.3fr)_repeat(4,1fr)_88px] gap-2 px-1 pb-2 text-sm font-semibold text-slate-600">
                                    <span>กลุ่มเป้าหมาย</span>
                                    {MASKS.map((m) => <span key={m.key} className="text-right pr-2">{m.label}</span>)}
                                    <span className="text-right">รวม</span>
                                </div>
                                <div className="space-y-2">
                                    {GROUPS.map((g) => (
                                        <div key={g.prefix} className="grid grid-cols-2 md:grid-cols-[minmax(160px,1.3fr)_repeat(4,1fr)_88px] gap-2 items-center rounded-xl border border-slate-200 md:border-0 md:border-t md:rounded-none p-3 md:px-1 md:py-2">
                                            <div className="col-span-2 md:col-span-1">
                                                <div className="font-medium text-slate-900">{g.label}</div>
                                                {acc[g.prefix] > 0 && <div className="text-[12px] text-slate-500">สะสมถึงวันนี้ {fmt(acc[g.prefix])} ชิ้น</div>}
                                            </div>
                                            {MASKS.map((m) => (
                                                <div key={m.key}>
                                                    <span className="md:hidden block text-[13px] text-slate-500 mb-0.5">{m.label}</span>
                                                    <NumberField compact name={name(g.prefix, m.key)} ariaLabel={`${g.label} ${m.label}`} value={values[name(g.prefix, m.key)] || ''} onChange={set(name(g.prefix, m.key))} />
                                                </div>
                                            ))}
                                            <div className="col-span-2 md:col-span-1 text-right tabular-nums text-slate-900 font-semibold">
                                                <span className="md:hidden text-sm font-normal text-slate-500 mr-1">รวม</span>{fmt(rowTotal(g))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="hidden md:grid grid-cols-[minmax(160px,1.3fr)_repeat(4,1fr)_88px] gap-2 px-1 pt-2 mt-1 border-t-2 border-slate-200 font-semibold tabular-nums">
                                    <span>รวม</span>
                                    {MASKS.map((m) => <span key={m.key} className="text-right pr-2">{fmt(colTotal(m))}</span>)}
                                    <span className="text-right">{fmt(ppeTotal)}</span>
                                </div>
                            </fieldset>
                        </Step>

                        <Step no="3" title="มุ้งสู้ฝุ่น" hint="ไม่ได้แจกให้เว้นว่าง">
                            <fieldset disabled={loading} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                {NETS.map((n) => <NumberField key={n.key} name={n.key} label={n.label} unit={n.unit} value={values[n.key] || ''} onChange={set(n.key)} />)}
                            </fieldset>
                        </Step>
                    </>
                )}

                <SaveBar
                    pending={pending}
                    disabled={locationId == null || loading}
                    summary={<>{thaiDate(date)} · PPE <b className="text-slate-900 tabular-nums">{fmt(ppeTotal)}</b> ชิ้น · มุ้ง <b className="text-slate-900 tabular-nums">{fmt(netTotal)}</b> หลัง</>}
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
                                const res = await deleteOperationData(h.date, h.locationId);
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
