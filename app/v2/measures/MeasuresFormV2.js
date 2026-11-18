'use client';

import { useActionState, useEffect, useState } from 'react';
import { Check, Minus } from 'lucide-react';
import { saveMeasures } from '@/app/actions/measures';
import { Step, SaveBar, Notice, useToast, thaiDate, todayStr, fmt } from '../_components/form-kit';

const GROUPS = [
    {
        no: '1', title: 'สร้างความรอบรู้ และส่งเสริมองค์กรลดมลพิษ',
        items: [
            { id: '1.1', short: 'สื่อสารประชาสัมพันธ์เชิงรุก สร้างความรอบรู้', full: 'สร้างความเข้มแข็งของชุมชนและประชาชน (Online / On ground / ศูนย์ข้อมูลสุขภาพ / สุขภาพจิตกับพฤติกรรมเสี่ยง)' },
            { id: '1.2', short: 'ส่งเสริมหน่วยงานในสังกัด สธ. เป็นองค์กรลดมลพิษ' },
        ],
    },
    {
        no: '2', title: 'ลดและป้องกันผลกระทบต่อสุขภาพ',
        items: [
            { id: '2.1', short: 'ยกระดับการเฝ้าระวัง และแจ้งเตือนความเสี่ยงอย่างรวดเร็ว', full: 'โดยการเชื่อมโยงข้อมูลทางดิจิทัล' },
            { id: '2.2', short: 'ป้องกันผลกระทบสุขภาพกลุ่มเปราะบาง' },
        ],
    },
    {
        no: '3', title: 'จัดบริการด้านการแพทย์และสาธารณสุข',
        items: [
            { id: '3.1', short: 'คลินิกมลพิษและเวชกรรมสิ่งแวดล้อม', full: 'เพิ่มประสิทธิผลและขยายความครอบคลุมบริการดูแลสุขภาพจาก PM2.5 ทั้งในสถานพยาบาลและ Online' },
            { id: '3.2', short: 'ระบบนัดหมายผ่านหมอพร้อม' },
            { id: '3.3', short: 'จัดทีมปฏิบัติการดูแลสุขภาพกลุ่มเปราะบางในชุมชน' },
            { id: '3.4', short: 'สนับสนุนอุปกรณ์ป้องกันส่วนบุคคลแก่กลุ่มเปราะบาง' },
        ],
    },
    {
        no: '4', title: 'เพิ่มประสิทธิภาพการบริหารจัดการ',
        items: [
            { id: '4.1', short: 'เพิ่มประสิทธิภาพระบบ PHEOC', full: 'ตอบสนองเหตุการณ์ในพื้นที่อย่างเข้มข้น รวดเร็ว ทันท่วงที' },
            { id: '4.2', short: 'ส่งเสริมและขับเคลื่อนกฎหมาย' },
        ],
    },
];
const ALL_IDS = GROUPS.flatMap((g) => g.items.map((i) => i.id));

function MeasureRow({ item, value, onChange }) {
    const { status, detail } = value;
    const btn = (on, color) => `h-11 px-4 rounded-xl text-[15px] font-medium inline-flex items-center gap-1.5 border transition-colors ${on ? color : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'}`;
    return (
        <div className={`rounded-xl border p-3.5 ${status === 'true' ? 'border-emerald-200 bg-emerald-50/40' : status === 'false' ? 'border-slate-200 bg-slate-50/60' : 'border-slate-200'}`}>
            <div className="flex flex-col md:flex-row md:items-center gap-3">
                <div className="flex-1 min-w-0">
                    <div className="font-medium text-slate-900 leading-snug"><span className="text-slate-500 tabular-nums mr-1.5">{item.id}</span>{item.short}</div>
                    {item.full && <div className="text-[13px] text-slate-500 mt-0.5">{item.full}</div>}
                </div>
                <div className="flex gap-2 shrink-0" role="radiogroup" aria-label={`สถานะมาตรการ ${item.id}`}>
                    <input type="hidden" name={status ? `status_${item.id}` : undefined} value={status || ''} />
                    <button type="button" role="radio" aria-checked={status === 'true'} onClick={() => onChange({ ...value, status: 'true' })} className={btn(status === 'true', 'bg-emerald-600 border-emerald-600 text-white')}>
                        <Check className="w-4 h-4" /> ดำเนินการแล้ว
                    </button>
                    <button type="button" role="radio" aria-checked={status === 'false'} onClick={() => onChange({ ...value, status: 'false' })} className={btn(status === 'false', 'bg-slate-600 border-slate-600 text-white')}>
                        <Minus className="w-4 h-4" /> ยังไม่ทำ
                    </button>
                </div>
            </div>
            {status === 'true' && (
                <label className="block mt-3">
                    <span className="block text-sm font-medium text-emerald-800 mb-1">ทำอะไรไปบ้าง <span className="text-red-500">*</span></span>
                    <textarea
                        name={`detail_${item.id}`} required rows={2} value={detail}
                        onChange={(e) => onChange({ ...value, detail: e.target.value })}
                        placeholder="เช่น ประชาสัมพันธ์ผ่านเสียงตามสาย 3 หมู่บ้าน, แจกแผ่นพับ 200 ชุด"
                        className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-[15px] focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/15"
                    />
                </label>
            )}
        </div>
    );
}

export default function MeasuresFormV2({ existing }) {
    const [state, formAction, pending] = useActionState(saveMeasures, { message: '', success: false });
    const [toast, showToast] = useToast();
    const [values, setValues] = useState(() => {
        const map = Object.fromEntries(existing.map((e) => [e.measureId, e]));
        return Object.fromEntries(ALL_IDS.map((id) => [id, {
            status: map[id] ? String(map[id].status) : null,
            detail: map[id]?.detail || '',
        }]));
    });

    useEffect(() => {
        if (state.success) showToast(state.message || 'บันทึกเรียบร้อย');
        else if (state.message) showToast(state.message, 'error');
    }, [state, showToast]);

    const answered = ALL_IDS.filter((id) => values[id].status).length;
    const done = ALL_IDS.filter((id) => values[id].status === 'true').length;
    const missingDetail = ALL_IDS.filter((id) => values[id].status === 'true' && !values[id].detail.trim()).length;

    const markRestNotDone = () => setValues((v) => Object.fromEntries(Object.entries(v).map(([id, x]) => [id, x.status ? x : { ...x, status: 'false' }])));

    return (
        <form action={formAction} className="space-y-4">
            <Notice>
                บันทึกสำหรับ <b>{thaiDate(todayStr(), true)}</b> · กด <b>ดำเนินการแล้ว</b> หรือ <b>ยังไม่ทำ</b> ทีละข้อ ถ้าทำแล้วให้เขียนสั้น ๆ ว่าทำอะไร
                {existing.length > 0 && <> · วันนี้เคยบันทึกไว้แล้ว การบันทึกซ้ำจะ <b>อัปเดต</b> ข้อมูลเดิม</>}
            </Notice>

            {GROUPS.map((g) => (
                <Step key={g.no} no={g.no} title={`มาตรการที่ ${g.no} ${g.title}`}>
                    <div className="space-y-2.5">
                        {g.items.map((item) => (
                            <MeasureRow key={item.id} item={item} value={values[item.id]} onChange={(nv) => setValues((v) => ({ ...v, [item.id]: nv }))} />
                        ))}
                    </div>
                </Step>
            ))}

            <SaveBar
                pending={pending}
                disabled={answered === 0 || missingDetail > 0}
                summary={<>ตอบแล้ว <b className="text-slate-900">{fmt(answered)}/{ALL_IDS.length}</b> ข้อ · ดำเนินการแล้ว <b className="text-emerald-700">{fmt(done)}</b> ข้อ</>}
                hint={missingDetail > 0
                    ? `ยังไม่ได้กรอกรายละเอียด ${missingDetail} ข้อ`
                    : answered < ALL_IDS.length
                        ? <>ยังไม่ได้เลือก {ALL_IDS.length - answered} ข้อ (ข้อที่ไม่เลือกจะไม่ถูกบันทึก) · <button type="button" onClick={markRestNotDone} className="text-blue-700 font-medium hover:underline">ตั้งที่เหลือเป็น “ยังไม่ทำ”</button></>
                        : null}
            />
            {toast}
        </form>
    );
}
