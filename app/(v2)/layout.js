import { Kanit } from 'next/font/google';

const kanit = Kanit({
    weight: ['300', '400', '500', '600', '700'],
    subsets: ['thai', 'latin'],
    display: 'swap',
});

export const metadata = {
    title: 'บันทึกข้อมูล | Haze-r2',
};

// หน้ากรอกข้อมูล v2 — ใช้ฟอนต์/โทนสีเดียวกับ Dashboard (หน้าเดิมย้ายไปอยู่ที่ /v1)
export default function V2Layout({ children }) {
    return (
        <div className={`${kanit.className} antialiased min-h-screen bg-slate-100/70 text-slate-900 text-[15px]`}>
            {children}
        </div>
    );
}
