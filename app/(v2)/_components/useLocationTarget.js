'use client';

import { useState } from 'react';
import { MapPin } from 'lucide-react';
import { LocationPicker, placeText } from './form-kit';

const isRegionAdmin = (role) => role === 'ADMIN' || role === 'HEALTH_REGION';

/**
 * พื้นที่ที่จะบันทึก: ผู้ดูแลระบบ/เขต เลือกได้ทุกตำบล, บทบาทอื่นบันทึกได้เฉพาะพื้นที่ของตนเอง
 * (ตรงกับสิทธิ์ของ action เดิมที่โหลดข้อมูลได้เฉพาะพื้นที่ตนเอง)
 */
export function useLocationTarget(user) {
    const canPick = isRegionAdmin(user.role);
    const [loc, setLoc] = useState(user.location);
    const [pickerKey, setPickerKey] = useState(0);
    const jumpTo = (meta) => { setLoc(meta); setPickerKey((k) => k + 1); };

    const field = (
        <div>
            <span className="block text-sm font-medium text-slate-700 mb-1.5">พื้นที่ที่บันทึก</span>
            {canPick ? (
                <LocationPicker key={pickerKey} initial={loc} onChange={setLoc} />
            ) : (
                <div className="min-h-11 px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2 text-slate-700">
                    <MapPin className="w-4 h-4 text-slate-400" /> {placeText(user.location || {})}
                </div>
            )}
        </div>
    );
    return { locationId: loc?.id ?? null, canPick, jumpTo, field };
}
