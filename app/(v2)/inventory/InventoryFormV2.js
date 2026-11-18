'use client';

import { useActionState, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Copy } from 'lucide-react';
import { saveInventoryData, getInventoryData, deleteInventoryReport } from '@/app/actions/inventory';
import {
    Step, DateField, NumberField, SaveBar, RecordStatus, HistoryTable, EditButton, DeleteButton,
    useToast, todayStr, thaiDate, fmt, toInt, placeText,
} from '../_components/form-kit';

// key = ชื่อช่องที่ action เดิมอ่าน, label = itemName ในฐานข้อมูล
const MASKS = [
    { key: 'surgical_mask', label: 'หน้ากาก Surgical Mask (ชิ้น)', short: 'Surgical Mask' },
    { key: 'n95', label: 'หน้ากาก N95 (ชิ้น)', short: 'N95' },
    { key: 'carbon_mask', label: 'หน้ากากคาร์บอน (ชิ้น)', short: 'หน้ากากคาร์บอน' },
    { key: 'cloth_mask', label: 'หน้ากากผ้า (ชิ้น)', short: 'หน้ากากผ้า' },
];
const NET = { key: 'dust_net', label: 'มุ้งสู้ฝุ่น (หลัง)', short: 'มุ้งสู้ฝุ่น' };
const ITEMS = [...MASKS, NET];
const toCounts = (records) => Object.fromEntries(records
    .map((r) => [ITEMS.find((i) => i.label === r.itemName)?.key, r.stockCount ? String(r.stockCount) : ''])
    .filter(([k]) => k));

export default function InventoryFormV2({ user, history }) {
    const router = useRouter();
    const [state, formAction, pending] = useActionState(saveInventoryData, { message: '', success: false });
    const [toast, showToast] = useToast();
    const [date, setDate] = useState(todayStr());
    const [counts, setCounts] = useState({});
    const [loaded, setLoaded] = useState(null);
    const [exists, setExists] = useState(false);
    const loading = loaded !== date;

    useEffect(() => {
        let cancelled = false;
        getInventoryData(date).then((data) => {
            if (cancelled) return;
            setCounts(toCounts(data));
            setExists(data.length > 0);
            setLoaded(date);
        });
        return () => { cancelled = true; };
    }, [date, state]);

    useEffect(() => {
        if (state.success) { showToast(state.message); router.refresh(); }
        else if (state.message) showToast(state.message, 'error');
    }, [state, showToast, router]);

    const maskTotal = MASKS.reduce((a, i) => a + toInt(counts[i.key]), 0);
    const mine = (h) => h.locationId === user.locationId;
    const previous = history.find((h) => mine(h) && h.date < date); // ครั้งก่อนของหน่วยตนเอง

    const set = (k) => (v) => setCounts((c) => ({ ...c, [k]: v }));

    return (
        <div className="space-y-4">
            <form action={formAction} className="space-y-4">
                <Step no="1" title="วันที่ตรวจนับคลัง">
                    <DateField name="recordDate" value={date} onChange={setDate} />
                </Step>

                <Step
                    no="2" title="จำนวนคงเหลือในคลัง" hint="นับของที่ยังอยู่ในคลัง (ไม่ใช่จำนวนที่แจกไป) · ไม่มีให้เว้นว่าง"
                    aside={previous && (
                        <button type="button" onClick={() => setCounts(toCounts(previous.records))}
                            className="h-10 px-3 rounded-xl text-sm font-medium inline-flex items-center gap-1.5 border border-slate-200 bg-white text-slate-700 hover:bg-slate-100">
                            <Copy className="w-4 h-4" /> ใช้ยอดครั้งก่อน ({thaiDate(previous.date)})
                        </button>
                    )}
                >
                    <div className="mb-4"><RecordStatus loading={loading} exists={exists} /></div>
                    <fieldset disabled={loading} className="space-y-5">
                        <div>
                            <div className="text-sm font-semibold text-slate-600 mb-2">หน้ากาก (ชิ้น)</div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                {MASKS.map((i) => <NumberField key={i.key} name={i.key} label={i.short} unit="ชิ้น" value={counts[i.key] || ''} onChange={set(i.key)} />)}
                            </div>
                        </div>
                        <div className="sm:max-w-xs">
                            <div className="text-sm font-semibold text-slate-600 mb-2">มุ้งสู้ฝุ่น (หลัง)</div>
                            <NumberField name={NET.key} ariaLabel={NET.short} unit="หลัง" value={counts[NET.key] || ''} onChange={set(NET.key)} />
                        </div>
                    </fieldset>
                </Step>

                <SaveBar
                    pending={pending}
                    disabled={loading}
                    summary={<>{thaiDate(date)} · หน้ากาก <b className="text-slate-900 tabular-nums">{fmt(maskTotal)}</b> ชิ้น · มุ้ง <b className="text-slate-900 tabular-nums">{fmt(counts[NET.key])}</b> หลัง</>}
                />
            </form>

            <Step title="ประวัติการบันทึก" hint="กด “แก้ไข” เพื่อเปิดข้อมูลวันนั้นขึ้นมาในฟอร์มด้านบน">
                <HistoryTable
                    rows={history}
                    rowKey={(h) => `${h.date}-${h.locationId}-${h.locationName}`}
                    columns={[
                        { key: 'date', label: 'วันที่', render: (h) => thaiDate(h.date) },
                        { key: 'org', label: 'หน่วยงาน', render: (h) => h.locationName || '—' },
                        { key: 'place', label: 'พื้นที่', render: placeText },
                        { key: 'total', label: 'รวม', align: 'right', render: (h) => fmt(h.totalItems) },
                    ]}
                    actions={(h) => (
                        <>
                            {mine(h) && <EditButton onClick={() => { setDate(h.date); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />}
                            <DeleteButton onConfirm={async () => {
                                const res = await deleteInventoryReport(h.date, h.locationId);
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
