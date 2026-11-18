import {
    ClipboardCheck, Siren, Users, Package, Building2, HardHat, HeartPulse, TriangleAlert,
} from 'lucide-react';

const ALL = null; // ทุกบทบาท

// เมนูกรอกข้อมูล — เลขหมวดตรงกับ Dashboard (1–4) และสิทธิ์ตรงกับหน้า v1
export const SECTIONS = [
    {
        no: '1', title: 'มาตรการและการจัดการ',
        items: [
            { key: 'measures', href: '/measures', v1: '/v1/measures', icon: ClipboardCheck, title: 'บันทึกมาตรการ', desc: 'ติ๊กสถานะมาตรการ 1.1 – 4.2 ประจำวัน', roles: ['SSJ', 'SSO', 'ADMIN', 'HEALTH_REGION'] },
            { key: 'pheoc', href: '/pheoc', v1: '/v1/pheoc', icon: Siren, title: 'รายงาน PHEOC', desc: 'สถานะศูนย์ปฏิบัติการฉุกเฉิน', roles: ['SSJ', 'ADMIN', 'HEALTH_REGION'] },
        ],
    },
    {
        no: '2', title: 'กลุ่มเปราะบาง / กลุ่มเสี่ยง',
        items: [
            { key: 'vulnerable', href: '/vulnerable', v1: '/v1/vulnerable', icon: Users, title: 'ข้อมูลกลุ่มเปราะบาง', desc: 'จำนวนเป้าหมาย 6 กลุ่ม', roles: ['SSJ', 'SSO', 'ADMIN', 'HEALTH_REGION', 'HOSPITAL', 'RPS', 'PCU'] },
        ],
    },
    {
        no: '3', title: 'ทรัพยากรและสถานที่',
        items: [
            { key: 'inventory', href: '/inventory', v1: '/v1/inventory', icon: Package, title: 'เวชภัณฑ์คงคลัง', desc: 'หน้ากาก และมุ้งสู้ฝุ่นคงเหลือ', roles: ALL },
            { key: 'clean-room', href: '/clean-room', v1: '/v1/clean-room', icon: Building2, title: 'ห้องปลอดฝุ่น', desc: 'จำนวนห้อง และผลผ่านมาตรฐาน', roles: ALL },
        ],
    },
    {
        no: '4', title: 'การปฏิบัติการและการสนับสนุน',
        items: [
            { key: 'operations', href: '/operations', v1: '/v1/operations', icon: HardHat, title: 'แจกหน้ากาก / มุ้งสู้ฝุ่น', desc: 'ผลการแจก PPE ตามกลุ่มเป้าหมาย', roles: ALL },
            { key: 'active-care', href: '/active-care', v1: '/v1/active-care', icon: HeartPulse, title: 'การดูแลเชิงรุก', desc: 'เยี่ยมบ้าน คัดกรอง และการสนับสนุน อปท.', roles: ALL },
            { key: 'incidents', href: '/incidents', v1: '/v1/incidents', icon: TriangleAlert, title: 'อุบัติการณ์เจ้าหน้าที่', desc: 'บาดเจ็บ / เสียชีวิต จากการปฏิบัติงาน', roles: ['SSJ', 'ADMIN', 'HEALTH_REGION', 'HOSPITAL', 'RPS', 'PCU'] },
        ],
    },
];

export const canAccess = (item, role) => !item.roles || item.roles.includes(role);

export const menuItem = (key) => SECTIONS.flatMap((s) => s.items).find((i) => i.key === key);

export const ROLE_LABEL = {
    HOSPITAL: 'โรงพยาบาล',
    PCU: 'รพ.สต.',
    RPS: 'รพ.สต.',
    SSO: 'สสอ.',
    SSJ: 'สสจ.',
    HEALTH_REGION: 'เขตสุขภาพ',
    ADMIN: 'ผู้ดูแลระบบ',
};
