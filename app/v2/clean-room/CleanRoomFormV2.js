'use client';

import { useActionState, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, X } from 'lucide-react';
import { saveCleanRoomData, getCleanRoomData, deleteCleanRoomReport } from '@/app/actions/clean-room';
import {
    Step, DateField, NumberField, SaveBar, Notice, RecordStatus, HistoryTable, EditButton, DeleteButton,
    useToast, todayStr, dateKey, thaiDate, fmt, toInt, placeText,
} from '../_components/form-kit';

// ลำดับและชื่อต้องตรงกับ action เดิม (ใช้เป็น placeType)
const PLACE_TYPES = [
    'โรงพยาบาลศูนย์', 'โรงพยาบาลทั่วไป', 'โรงพยาบาลชุมชน', 'โรงพยาบาลส่งเสริมสุขภาพตำบล', 'โรงพยาบาลเอกชน',
    'โรงพยาบาลสังกัดกระทรวงกลาโหม', 'โรงพยาบาลมหาวิทยาลัย', 'สสจ./สสอ.', 'หน่วยงานภาครัฐ (อบจ/อบต./สนง.ต่างๆ)',
    'ศูนย์ดูแลผู้สูงอายุ', 'โรงเรียน', 'ศูนย์เด็กเล็ก',
];
const FIELDS = ['placeCount', 'targetRoomCount', 'standard1Count', 'standard2Count', 'standard3Count', 'serviceUserCount'];
const blank = () => Object.fromEntries(FIELDS.map((f) => [f, '']));
const passedOf = (v) => toInt(v.standard1Count) + toInt(v.standard2Count) + toInt(v.standard3Count);
const hasAny = (v) => FIELDS.some((f) => toInt(v[f]) > 0);

function PlaceCard({ type, v, onChange, onRemove }) {
    const set = (f) => (x) => onChange({ ...v, [f]: x });
    const passed = passedOf(v);
    const over = toInt(v.targetRoomCount) > 0 && passed > toInt(v.targetRoomCount);
    return (
        <div className="rounded-xl border border-slate-200 p-3.5">
            <div className="flex items-center justify-between gap-2 mb-3">
                <h3 className="font-semibold text-slate-900">{type}</h3>
                <button type="button" onClick={onRemove} aria-label={`นำ ${type} ออก`} className="h-8 px-2 rounded-lg text-sm text-slate-500 hover:bg-slate-100 inline-flex items-center gap-1"><X className="w-4 h-4" /> นำออก</button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <NumberField name={`${type}_placeCount`} label="จำนวนสถานที่" unit="แห่ง" value={v.placeCount} onChange={set('placeCount')} />
                <NumberField name={`${type}_targetRoomCount`} label="ห้องเป้าหมาย" unit="ห้อง" value={v.targetRoomCount} onChange={set('targetRoomCount')} />
                <NumberField name={`${type}_serviceUserCount`} label="ผู้รับบริการ" unit="คน" value={v.serviceUserCount} onChange={set('serviceUserCount')} />
            </div>
            <div className="mt-3 rounded-xl bg-slate-50 p-3">
                <div className="text-sm font-medium text-slate-700 mb-2">ห้องที่ผ่านมาตรฐาน แยกตามรูปแบบ</div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 items-end">
                    <NumberField compact name={`${type}_standard1Count`} label="แบบที่ 1" unit="ห้อง" value={v.standard1Count} onChange={set('standard1Count')} />
                    <NumberField compact name={`${type}_standard2Count`} label="แบบที่ 2" unit="ห้อง" value={v.standard2Count} onChange={set('standard2Count')} />
                    <NumberField compact name={`${type}_standard3Count`} label="แบบที่ 3" unit="ห้อง" value={v.standard3Count} onChange={set('standard3Count')} />
                    <div>
                        <span className="block text-[15px] font-medium text-slate-800">รวมผ่านมาตรฐาน</span>
                        <div className={`mt-1.5 h-10 rounded-xl border px-3 flex items-center justify-end tabular-nums font-semibold ${over ? 'border-red-300 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}>
                            {fmt(passed)} <span className="text-xs font-normal ml-1">ห้อง</span>
                        </div>
                        <input type="hidden" name={`${type}_passedStandard`} value={passed} />
                    </div>
                </div>
                {over && <p className="mt-2 text-sm text-red-700">ห้องผ่านมาตรฐาน ({fmt(passed)}) มากกว่าห้องเป้าหมาย ({fmt(v.targetRoomCount)}) — กรุณาตรวจสอบ</p>}
            </div>
        </div>
    );
}

export default function CleanRoomFormV2({ user, history }) {
    const router = useRouter();
    const [state, formAction, pending] = useActionState(saveCleanRoomData, { message: '', success: false });
    const [toast, showToast] = useToast();
    const [date, setDate] = useState(todayStr());
    const [data, setData] = useState({}); // placeType → values
    const [shown, setShown] = useState([]); // ประเภทที่แสดงในฟอร์ม
    const [loaded, setLoaded] = useState(null);
    const [exists, setExists] = useState(false);
    const loading = loaded !== date;

    useEffect(() => {
        let cancelled = false;
        getCleanRoomData(date).then((rows) => {
            if (cancelled) return;
            const next = {};
            rows.forEach((r) => {
                next[r.placeType] = Object.fromEntries(FIELDS.map((f) => [f, r[f] ? String(r[f]) : '']));
            });
            setData(next);
            setShown(PLACE_TYPES.filter((t) => next[t] && hasAny(next[t])));
            setExists(rows.length > 0);
            setLoaded(date);
        });
        return () => { cancelled = true; };
    }, [date, state]);

    useEffect(() => {
        if (state.success) { showToast(state.message); router.refresh(); }
        else if (state.message) showToast(state.message, 'error');
    }, [state, showToast, router]);

    const add = (t) => { setShown((s) => PLACE_TYPES.filter((x) => s.includes(x) || x === t)); setData((d) => ({ ...d, [t]: d[t] || blank() })); };
    const remove = (t) => { setShown((s) => s.filter((x) => x !== t)); setData((d) => ({ ...d, [t]: blank() })); };
    const notShown = PLACE_TYPES.filter((t) => !shown.includes(t));

    const tot = shown.reduce((a, t) => {
        const v = data[t] || blank();
        return { places: a.places + toInt(v.placeCount), target: a.target + toInt(v.targetRoomCount), passed: a.passed + passedOf(v) };
    }, { places: 0, target: 0, passed: 0 });
    const anyOver = shown.some((t) => toInt(data[t]?.targetRoomCount) > 0 && passedOf(data[t]) > toInt(data[t]?.targetRoomCount));

    const mine = (h) => h.locationId === user.locationId;

    return (
        <div className="space-y-4">
            <form action={formAction} className="space-y-4">
                <Step no="1" title="วันที่ของข้อมูล">
                    <DateField name="recordDate" value={date} onChange={setDate} />
                </Step>

                <Step no="2" title="เลือกประเภทสถานที่ที่มีห้องปลอดฝุ่น" hint="แตะเพื่อเพิ่ม — กรอกเฉพาะประเภทที่มีในพื้นที่">
                    <div className="mb-3"><RecordStatus loading={loading} exists={exists} /></div>
                    <div className="flex flex-wrap gap-2">
                        {notShown.map((t) => (
                            <button key={t} type="button" disabled={loading} onClick={() => add(t)}
                                className="h-10 px-3 rounded-full text-sm font-medium inline-flex items-center gap-1.5 border border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50 disabled:opacity-50">
                                <Plus className="w-4 h-4" /> {t}
                            </button>
                        ))}
                        {notShown.length === 0 && <span className="text-sm text-slate-500">เลือกครบทุกประเภทแล้ว</span>}
                    </div>
                </Step>

                {shown.length > 0 && (
                    <Step no="3" title="กรอกจำนวนห้อง" hint="ช่อง “รวมผ่านมาตรฐาน” คำนวณให้อัตโนมัติจากแบบที่ 1 + 2 + 3">
                        <fieldset disabled={loading} className="space-y-3">
                            {shown.map((t) => (
                                <PlaceCard key={t} type={t} v={data[t] || blank()} onChange={(v) => setData((d) => ({ ...d, [t]: v }))} onRemove={() => remove(t)} />
                            ))}
                        </fieldset>
                    </Step>
                )}
                {exists && shown.length === 0 && !loading && (
                    <Notice tone="warn">วันนี้เคยบันทึกไว้ แต่ทุกช่องเป็น 0 — ถ้ากดบันทึกตอนนี้ ข้อมูลทุกประเภทจะเป็น 0</Notice>
                )}

                <SaveBar
                    pending={pending}
                    disabled={loading || anyOver || (shown.length === 0 && !exists)}
                    summary={<>{thaiDate(date)} · {fmt(tot.places)} แห่ง · ผ่านมาตรฐาน <b className="text-slate-900 tabular-nums">{fmt(tot.passed)}</b>/{fmt(tot.target)} ห้อง</>}
                    hint={anyOver ? 'มีประเภทที่ห้องผ่านมาตรฐานมากกว่าเป้าหมาย' : shown.length === 0 ? 'เลือกประเภทสถานที่อย่างน้อย 1 ประเภท' : null}
                />
            </form>

            <Step title="ประวัติการบันทึก" hint="กด “แก้ไข” เพื่อเปิดข้อมูลวันนั้นขึ้นมาในฟอร์มด้านบน">
                <HistoryTable
                    rows={history}
                    rowKey={(h) => `${h.recordDate}-${h.locationId}-${h.locationName}`}
                    columns={[
                        { key: 'date', label: 'วันที่', render: (h) => thaiDate(dateKey(h.recordDate)) },
                        { key: 'org', label: 'หน่วยงาน', render: (h) => h.locationName || '—' },
                        { key: 'place', label: 'พื้นที่', render: placeText },
                        { key: 'places', label: 'สถานที่', align: 'right', render: (h) => fmt(h.totalPlaces) },
                        { key: 'passed', label: 'ผ่าน/เป้าหมาย', align: 'right', render: (h) => `${fmt(h.totalPassed)}/${fmt(h.totalTarget)}` },
                    ]}
                    actions={(h) => (
                        <>
                            {mine(h) && <EditButton onClick={() => { setDate(dateKey(h.recordDate)); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />}
                            <DeleteButton onConfirm={async () => {
                                const res = await deleteCleanRoomReport(dateKey(h.recordDate), h.locationId);
                                showToast(res.message || (res.success ? 'ลบข้อมูลแล้ว' : 'ลบไม่สำเร็จ'), res.success ? 'success' : 'error');
                                if (res.success) router.refresh();
                            }} />
                        </>
                    )}
                />
            </Step>
            {toast}
        </div>
    );
}
