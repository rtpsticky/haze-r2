'use client';

import { useActionState, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Select from 'react-select';
import { Copy } from 'lucide-react';
import { saveVulnerableData, getVulnerableData, deleteVulnerableReport } from '@/app/actions/vulnerable';
import { getDistrictsByProvince } from '@/app/actions/locations';
import {
    Step, DateField, NumberField, SaveBar, Notice, RecordStatus, HistoryTable, EditButton, DeleteButton,
    useToast, todayStr, thaiDate, fmt, toInt, placeText, selectStyles,
} from '../_components/form-kit';

// key = ชื่อช่องที่ action เดิมอ่าน, label = groupType ในฐานข้อมูล
const GROUPS = [
    { key: 'child', label: 'กลุ่มเด็กเล็ก (0-5 ปี)', short: 'เด็กเล็ก (0–5 ปี)' },
    { key: 'pregnant', label: 'กลุ่มหญิงตั้งครรภ์', short: 'หญิงตั้งครรภ์' },
    { key: 'elderly', label: 'กลุ่มผู้สูงอายุ', short: 'ผู้สูงอายุ' },
    { key: 'bedridden', label: 'กลุ่มติดเตียง', short: 'ผู้ป่วยติดเตียง' },
    { key: 'heart', label: 'กลุ่มผู้ที่มีโรคหัวใจ', short: 'ผู้มีโรคหัวใจ' },
    { key: 'respiratory', label: 'กลุ่มผู้ที่มีโรคระบบทางเดินหายใจ', short: 'ผู้มีโรคระบบทางเดินหายใจ' },
];
const toCounts = (records) => Object.fromEntries(records
    .map((r) => [GROUPS.find((g) => g.label === r.groupType)?.key, r.targetCount ? String(r.targetCount) : ''])
    .filter(([k]) => k));

export default function VulnerableFormV2({ user, history }) {
    const router = useRouter();
    const [state, formAction, pending] = useActionState(saveVulnerableData, { message: '', success: false });
    const [toast, showToast] = useToast();

    const isByPass = user.role === 'SSJ' || user.role === 'ADMIN'; // บันทึกแทนระดับอำเภอ (By-Pass)
    const canSave = ['SSJ', 'SSO', 'ADMIN', 'HOSPITAL', 'RPS', 'PCU'].includes(user.role);

    const [date, setDate] = useState(todayStr());
    const [districts, setDistricts] = useState([]);
    const [locationId, setLocationId] = useState(isByPass ? null : user.locationId);
    const [counts, setCounts] = useState({});
    const [loaded, setLoaded] = useState(null); // key ของข้อมูลที่โหลดเสร็จ
    const [exists, setExists] = useState(false);
    const loadKey = `${date}|${locationId}`;
    const loading = locationId != null && loaded !== loadKey;

    useEffect(() => {
        if (!isByPass || !user.location?.provinceName) return;
        getDistrictsByProvince(user.location.provinceName).then((r) => r.success && setDistricts(r.data));
    }, [isByPass, user.location?.provinceName]);

    useEffect(() => {
        if (locationId == null) return;
        let cancelled = false;
        getVulnerableData(date, locationId).then((data) => {
            if (cancelled) return;
            setCounts(toCounts(data));
            setExists(data.length > 0);
            setLoaded(`${date}|${locationId}`);
        });
        return () => { cancelled = true; };
    }, [date, locationId, state]); // state: โหลดใหม่หลังบันทึก เพื่อให้สถานะ "มีข้อมูลแล้ว" ถูกต้อง

    useEffect(() => {
        if (state.success) { showToast(state.message); router.refresh(); }
        else if (state.message) showToast(state.message, 'error');
    }, [state, showToast, router]);

    const total = GROUPS.reduce((a, g) => a + toInt(counts[g.key]), 0);
    // ครั้งก่อนของพื้นที่เดียวกัน (ก่อนวันที่เลือก)
    const previous = useMemo(
        () => history.find((h) => String(h.locationId) === String(locationId) && h.date < date),
        [history, locationId, date],
    );
    const district = districts.find((d) => String(d.id) === String(locationId));

    const startEdit = (h) => {
        if (isByPass) setLocationId(h.locationId);
        setDate(h.date);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    const editable = (h) => (isByPass ? districts.some((d) => d.id === h.locationId) : h.locationId === user.locationId);

    return (
        <div className="space-y-4">
            {!canSave ? (
                <Notice tone="warn">บทบาทของคุณดูข้อมูลได้อย่างเดียว ไม่สามารถบันทึกได้</Notice>
            ) : (
                <form action={formAction} className="space-y-4">
                    {isByPass && locationId != null && <input type="hidden" name="locationId" value={locationId} />}

                    <Step no="1" title="เลือกวันที่และพื้นที่">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <DateField name="recordDate" value={date} onChange={setDate} />
                            {isByPass ? (
                                <div>
                                    <span className="block text-sm font-medium text-slate-700 mb-1.5">อำเภอที่ต้องการบันทึกแทน (By-Pass)</span>
                                    <Select instanceId="v2-vul-district" aria-label="อำเภอ" placeholder="เลือกอำเภอ" styles={selectStyles}
                                        options={districts.map((d) => ({ value: d.id, label: d.districtName }))}
                                        value={district ? { value: district.id, label: district.districtName } : null}
                                        onChange={(o) => setLocationId(o?.value ?? null)} />
                                    <p className="mt-1.5 text-[13px] text-slate-500">ข้อมูล By-Pass จะใช้แทนข้อมูลที่หน่วยบริการในจังหวัดบันทึก</p>
                                </div>
                            ) : (
                                <div>
                                    <span className="block text-sm font-medium text-slate-700 mb-1.5">พื้นที่</span>
                                    <div className="h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center text-slate-700">{placeText(user.location || {})}</div>
                                </div>
                            )}
                        </div>
                    </Step>

                    {locationId == null ? (
                        <Notice>เลือกอำเภอก่อน แล้วช่องกรอกตัวเลขจะแสดงขึ้นมา</Notice>
                    ) : (
                        <Step
                            no="2" title="กรอกจำนวนคนในแต่ละกลุ่ม" hint="ไม่มีให้เว้นว่าง (นับเป็น 0) · กด Enter เพื่อไปช่องถัดไป"
                            aside={previous && (
                                <button type="button" onClick={() => setCounts(toCounts(previous.records))}
                                    className="h-10 px-3 rounded-xl text-sm font-medium inline-flex items-center gap-1.5 border border-slate-200 bg-white text-slate-700 hover:bg-slate-100">
                                    <Copy className="w-4 h-4" /> ใช้ตัวเลขครั้งก่อน ({thaiDate(previous.date)})
                                </button>
                            )}
                        >
                            <div className="mb-4"><RecordStatus loading={loading} exists={exists} /></div>
                            <fieldset disabled={loading} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {GROUPS.map((g) => (
                                    <NumberField key={g.key} name={g.key} label={g.short} unit="คน" value={counts[g.key] || ''}
                                        onChange={(v) => setCounts((c) => ({ ...c, [g.key]: v }))} />
                                ))}
                            </fieldset>
                        </Step>
                    )}

                    <SaveBar
                        pending={pending}
                        disabled={locationId == null || loading}
                        label={isByPass ? 'บันทึก (By-Pass)' : 'บันทึกข้อมูล'}
                        summary={<>{thaiDate(date)} · รวม <b className="text-lg text-slate-900 tabular-nums">{fmt(total)}</b> คน</>}
                    />
                </form>
            )}

            <Step title="ประวัติการบันทึก" hint="กด “แก้ไข” เพื่อเปิดข้อมูลวันนั้นขึ้นมาในฟอร์มด้านบน">
                <HistoryTable
                    rows={history}
                    rowKey={(h) => `${h.date}-${h.locationId}`}
                    columns={[
                        { key: 'date', label: 'วันที่', render: (h) => thaiDate(h.date) },
                        { key: 'place', label: 'พื้นที่', render: (h) => <>{placeText(h)}{h.isByPass && <span className="ml-1.5 text-[12px] font-medium text-amber-800 bg-amber-50 border border-amber-200 rounded-full px-1.5">By-Pass</span>}</> },
                        { key: 'total', label: 'รวม (คน)', align: 'right', render: (h) => fmt(h.totalCount) },
                    ]}
                    actions={canSave ? (h) => (
                        <>
                            {editable(h) && <EditButton onClick={() => startEdit(h)} />}
                            <DeleteButton onConfirm={async () => {
                                const res = await deleteVulnerableReport(h.date, h.locationId);
                                showToast(res.message || (res.success ? 'ลบข้อมูลแล้ว' : 'ลบไม่สำเร็จ'), res.success ? 'success' : 'error');
                                if (res.success) router.refresh();
                            }} />
                        </>
                    ) : undefined}
                />
            </Step>
            {toast}
        </div>
    );
}
