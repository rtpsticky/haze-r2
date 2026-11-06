// เกณฑ์การยก-ลดระดับ PHEOC กรณีหมอกควันและฝุ่นละอองขนาดเล็ก ปี 2570
// หมายเหตุ: ค่า PM2.5 ที่มีทศนิยมตำแหน่งที่สอง ≥ 5 ให้ปัดขึ้น

export const PROVINCES = ['พิษณุโลก', 'อุตรดิตถ์', 'ตาก', 'สุโขทัย', 'เพชรบูรณ์'];

export const MODE_ORDER = ['WATCH', 'ALERT', 'RESPONSE_1', 'RESPONSE_2'];

export const MODES = {
    WATCH: {
        key: 'WATCH',
        th: 'ภาวะปกติ',
        en: 'Watch Mode',
        short: 'ปกติ',
        solid: '#1F7A3D',
        soft: '#E8F5EC',
        ring: '#A7D7B5',
        ink: '#FFFFFF',
        softInk: '#14532D',
        pm: 'PM2.5 ≤ 37.5',
        up: 'PM2.5 ≤ 37.5',
        down: null,
    },
    ALERT: {
        key: 'ALERT',
        th: 'ภาวะแจ้งเตือน',
        en: 'Alert Mode',
        short: 'แจ้งเตือน',
        solid: '#FACC15',
        soft: '#FEF9C3',
        ring: '#FDE047',
        ink: '#422006',
        softInk: '#713F12',
        pm: 'PM2.5 37.6 – 75.0',
        up: 'PM2.5 ≥ 37.6 – 75.0',
        down: 'PM2.5 < 37.6',
    },
    RESPONSE_1: {
        key: 'RESPONSE_1',
        th: 'ภาวะฉุกเฉิน ระดับ 1',
        en: 'Response Mode 1',
        short: 'ฉุกเฉิน 1',
        solid: '#EA580C',
        soft: '#FFEDD5',
        ring: '#FDBA74',
        ink: '#FFFFFF',
        softInk: '#7C2D12',
        pm: 'PM2.5 75.1 – 125.0 (2 วัน)',
        up: 'PM2.5 ≥ 75.1 – 125.0 ติดต่อกัน 2 วัน',
        down: 'PM2.5 < 75.1 ติดต่อกัน 7 วัน',
    },
    RESPONSE_2: {
        key: 'RESPONSE_2',
        th: 'ภาวะฉุกเฉิน ระดับ 2',
        en: 'Response Mode 2',
        short: 'ฉุกเฉิน 2',
        solid: '#B91C1C',
        soft: '#FEE2E2',
        ring: '#FCA5A5',
        ink: '#FFFFFF',
        softInk: '#7F1D1D',
        pm: 'PM2.5 ≥ 125.0 (1 วัน)',
        up: 'PM2.5 ≥ 125.0 ติดต่อ 1 วัน',
        down: 'PM2.5 < 125.0 ติดต่อกัน 7 วัน',
    },
};

export const NO_REPORT = {
    key: 'NONE',
    th: 'ยังไม่รายงาน',
    short: 'ไม่มีข้อมูล',
    solid: '#94A3B8',
    soft: '#F1F5F9',
    ring: '#CBD5E1',
    ink: '#FFFFFF',
    softInk: '#475569',
};

/**
 * แปลงสถานะที่บันทึกในฐานข้อมูล (แบบฟอร์มเดิม) ให้เป็น Mode ตามเกณฑ์ใหม่
 * - เกณฑ์ใหม่มีถึง Response Mode 2 เท่านั้น: "ระดับตอบโต้ 3" เดิมจึงนับเป็น Response 2 (legacy)
 */
export function toMode(status, responseLevel) {
    if (status === 'เปิด PHEOC') {
        if (responseLevel === 'ระดับตอบโต้ 1') return { mode: 'RESPONSE_1' };
        if (responseLevel === 'ระดับตอบโต้ 2') return { mode: 'RESPONSE_2' };
        if (responseLevel === 'ระดับตอบโต้ 3') return { mode: 'RESPONSE_2', legacy: true };
        return { mode: 'ALERT' };
    }
    if (status === 'เฝ้าระวังใกล้ชิด') return { mode: 'ALERT' };
    if (['เฝ้าระวังปกติ', 'ยังไม่เปิด', 'ปิดศูนย์'].includes(status)) return { mode: 'WATCH' };
    return { mode: null };
}

/** สถานะล่าสุดของทั้ง 5 จังหวัด (จังหวัดที่ไม่มีรายงานจะได้ mode = null) */
export function buildProvinceBoard(latestByProvince = []) {
    return PROVINCES.map((province) => {
        const r = latestByProvince.find((x) => x.province === province);
        if (!r) return { province, mode: null };
        const { mode, legacy } = toMode(r.status, r.responseLevel);
        return { province, mode, legacy, reportDate: r.reportDate, rawStatus: r.status, rawLevel: r.responseLevel };
    });
}

/**
 * ประเมินระดับ PHEOC เขตสุขภาพจากสถานะจังหวัด (ส่วนที่คำนวณได้จากข้อมูล)
 * เงื่อนไขเชิงดุลยพินิจ เช่น "ต้องการการสนับสนุนข้ามจังหวัด" หรือ "ผลกระทบเกินศักยภาพจังหวัด"
 * ระบบตรวจไม่ได้ จึงแสดงเป็นข้อสังเกตให้ผู้บริหารพิจารณา
 */
export function assessRegion(board) {
    const inResponse = board.filter((p) => p.mode === 'RESPONSE_1' || p.mode === 'RESPONSE_2').length;
    const inR2 = board.filter((p) => p.mode === 'RESPONSE_2').length;
    const reported = board.filter((p) => p.mode).length;

    if ((inResponse >= 3 && inR2 >= 1) || inR2 >= 2) {
        return {
            mode: 'RESPONSE_2',
            reason: inR2 >= 2
                ? `มีจังหวัด Response Mode 2 จำนวน ${inR2} จังหวัด (≥ 2)`
                : `จังหวัดอยู่ Response Mode ${inResponse} จังหวัด (≥ 3) และมี Response Mode 2 อย่างน้อย 1 จังหวัด`,
            note: null,
            reported,
        };
    }
    if (inResponse >= 2) {
        return {
            mode: 'RESPONSE_1',
            reason: `มีจังหวัดอยู่ Response Mode ${inResponse} จังหวัด (≥ 2)`,
            note: 'พิจารณายกเป็น Response 2 หากผลกระทบเกินศักยภาพจังหวัด ต้องระดมทรัพยากรระดับเขต',
            reported,
        };
    }
    if (inResponse === 1) {
        return {
            mode: 'ALERT',
            reason: 'มี 1 จังหวัดเข้าสู่ Response Mode',
            note: inR2 === 1
                ? 'จังหวัดดังกล่าวอยู่ Response Mode 2 — หากต้องการการสนับสนุนข้ามจังหวัด ให้ยกเป็น Response 1'
                : 'หากจังหวัดบริหารจัดการด้วยทรัพยากรตนเองไม่ได้ ให้พิจารณายกระดับ',
            reported,
        };
    }
    return {
        mode: 'WATCH',
        reason: 'ไม่มีจังหวัดอยู่ใน Response Mode',
        note: null,
        reported,
    };
}

// ข้อความเกณฑ์สำหรับแผงอ้างอิง (ระดับจังหวัด / ระดับเขตสุขภาพ)
export const CRITERIA_TEXT = {
    WATCH: {
        province: ['เมื่อ PM2.5 ≤ 37.5'],
        region: ['ไม่มีจังหวัดอยู่ Response Mode และสามารถบริหารจัดการได้ในระดับจังหวัด'],
    },
    ALERT: {
        province: ['ยกระดับ เมื่อ PM2.5 ≥ 37.6 – 75.0', 'ลดระดับ เมื่อ PM2.5 < 37.6'],
        region: [
            'ยกระดับ เมื่อมี 1 จังหวัดเข้าสู่ Response Mode แต่ยังบริหารจัดการได้ด้วยทรัพยากรจังหวัด',
            'ลดระดับ เมื่อไม่มีจังหวัดอยู่ Response Mode ติดต่อกัน ≥ 3 วัน และแนวโน้มสถานการณ์ไม่เพิ่มขึ้น',
        ],
    },
    RESPONSE_1: {
        province: ['ยกระดับ เมื่อ PM2.5 ≥ 75.1 – 125.0 ติดต่อกัน 2 วัน', 'ลดระดับ เมื่อ PM2.5 < 75.1 ติดต่อกัน 7 วัน'],
        region: [
            'ยกระดับ เมื่อ ① มีจังหวัดอยู่ Response Mode ≥ 2 จังหวัด หรือ ② มี 1 จังหวัดอยู่ Response Mode 2 และต้องการการสนับสนุนข้ามจังหวัด',
            'ลดระดับ เมื่อจังหวัด Response เหลือ < 2 จังหวัด ติดต่อกัน ≥ 3 วัน และจังหวัดที่เหลือจัดการได้เอง',
        ],
    },
    RESPONSE_2: {
        province: ['ยกระดับ เมื่อ PM2.5 ≥ 125.0 ติดต่อ 1 วัน', 'ลดระดับ เมื่อ PM2.5 < 125.0 ติดต่อกัน 7 วัน'],
        region: [
            'ยกระดับ เมื่อ ① จังหวัดอยู่ Response Mode ≥ 3 จังหวัด และมีอย่างน้อย 1 จังหวัดเป็น Response Mode 2 หรือ ② มีจังหวัด Response Mode 2 ≥ 2 จังหวัด หรือ ③ ผลกระทบเกินศักยภาพจังหวัด ต้องระดมทรัพยากรระดับเขต',
            'ลดระดับ เมื่อไม่เข้าเกณฑ์ Response 2 ติดต่อกัน ≥ 3 วัน และไม่มีผลกระทบรุนแรง/ความต้องการทรัพยากรระดับเขต',
        ],
    },
};
