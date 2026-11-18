// ปีงบประมาณไทย: เริ่ม 1 ตุลาคม สิ้นสุด 30 กันยายนของปีถัดไป (เวลาประเทศไทย UTC+7)
// เช่น ปีงบ 2570 = 1 ต.ค. 2569 – 30 ก.ย. 2570

const TH_OFFSET_MS = 7 * 60 * 60 * 1000;
const BE_OFFSET = 543;

/** ปีงบประมาณ (พ.ศ.) ของวันที่ที่ระบุ */
export function fiscalYearOf(date = new Date()) {
    const th = new Date(new Date(date).getTime() + TH_OFFSET_MS);
    const year = th.getUTCFullYear() + (th.getUTCMonth() >= 9 ? 1 : 0); // เดือน 9 = ตุลาคม
    return year + BE_OFFSET;
}

/** ช่วงวันที่ของปีงบประมาณ (พ.ศ.) → { gte, lt } สำหรับ Prisma where */
export function fiscalYearRange(fyBE) {
    const ce = Number(fyBE) - BE_OFFSET;
    return {
        gte: new Date(`${ce - 1}-10-01T00:00:00+07:00`),
        lt: new Date(`${ce}-10-01T00:00:00+07:00`),
    };
}

/** รายการปีงบประมาณจากปีแรกที่มีข้อมูลจนถึงปีงบปัจจุบัน (ใหม่ → เก่า) */
export function fiscalYearList(earliestDate) {
    const current = fiscalYearOf();
    const first = earliestDate ? Math.min(fiscalYearOf(earliestDate), current) : current;
    return Array.from({ length: current - first + 1 }, (_, i) => current - i);
}

const TH_MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

/** ข้อความช่วงวันที่ เช่น "1 ต.ค. 69 – 30 ก.ย. 70" */
export function fiscalYearLabel(fyBE) {
    const short = (y) => String(y).slice(-2);
    return `1 ${TH_MONTHS[9]} ${short(fyBE - 1)} – 30 ${TH_MONTHS[8]} ${short(fyBE)}`;
}
