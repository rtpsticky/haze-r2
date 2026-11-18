import Link from 'next/link';
import { ChevronRight, LayoutDashboard, LogOut, ShieldCheck, Users } from 'lucide-react';
import { logout } from '@/app/actions/auth';
import { requireUser, isRegionAdmin } from './_lib/user';
import { SECTIONS, canAccess, ROLE_LABEL } from './_lib/menu';

export const dynamic = 'force-dynamic';

function MenuCard({ item }) {
    const Icon = item.icon;
    return (
        <Link href={item.href} className="group flex items-center gap-4 bg-white rounded-2xl border border-slate-200 p-4 md:p-5 hover:border-blue-300 hover:shadow-md transition">
            <span className="grid place-items-center w-12 h-12 rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors shrink-0">
                <Icon className="w-6 h-6" />
            </span>
            <span className="flex-1 min-w-0">
                <span className="block text-base font-semibold text-slate-900 leading-snug">{item.title}</span>
                <span className="block text-sm text-slate-500 mt-0.5">{item.desc}</span>
            </span>
            <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-600 shrink-0" />
        </Link>
    );
}

export default async function V2Home() {
    const user = await requireUser();
    const sections = SECTIONS
        .map((s) => ({ ...s, items: s.items.filter((i) => canAccess(i, user.role)) }))
        .filter((s) => s.items.length);
    const place = [user.location?.provinceName && `จ.${user.location.provinceName}`, user.location?.districtName && `อ.${user.location.districtName}`, user.location?.subDistrict && `ต.${user.location.subDistrict}`]
        .filter(Boolean).join(' › ');

    return (
        <>
            <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-slate-200">
                <div className="max-w-5xl mx-auto px-4 md:px-6 py-3 flex flex-wrap items-center gap-3">
                    <div className="flex-1 min-w-0">
                        <h1 className="text-xl md:text-2xl font-semibold leading-tight">บันทึกข้อมูล PM2.5</h1>
                        <p className="text-sm text-slate-500 mt-0.5">เขตสุขภาพที่ 2 · เลือกหัวข้อที่ต้องการบันทึก</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <form action={logout}>
                            <button type="submit" className="h-10 px-3 rounded-xl text-sm font-medium inline-flex items-center gap-1.5 border border-slate-200 bg-white text-slate-600 hover:bg-red-50 hover:text-red-700">
                                <LogOut className="w-4 h-4" /> ออกจากระบบ
                            </button>
                        </form>
                    </div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-4 md:px-6 py-5 space-y-5">
                {/* ผู้ใช้งาน */}
                <div className="bg-white rounded-2xl border border-slate-200 p-4 md:p-5 flex flex-wrap items-center gap-4">
                    <div className="flex-1 min-w-0">
                        <div className="text-sm text-slate-500">ผู้บันทึก</div>
                        <div className="text-lg font-semibold text-slate-900">{user.name || user.username}</div>
                        <div className="text-sm text-slate-600">
                            {user.orgName || '—'}
                            <span className="ml-2 inline-block text-[13px] font-medium text-blue-800 bg-blue-50 border border-blue-100 rounded-full px-2 py-0.5">{ROLE_LABEL[user.role] || user.role}</span>
                        </div>
                        {place && <div className="text-[13px] text-slate-500 mt-0.5">{place}</div>}
                    </div>
                    <Link href="/dashboard" className="h-11 px-4 rounded-xl text-[15px] font-medium inline-flex items-center gap-2 bg-slate-800 text-white hover:bg-slate-900">
                        <LayoutDashboard className="w-5 h-5" /> ดู Dashboard
                    </Link>
                </div>

                {sections.map((s) => (
                    <section key={s.no} className="space-y-3">
                        <div className="flex items-center gap-3 pt-1">
                            <span className="grid place-items-center w-7 h-7 rounded-lg bg-slate-800 text-white text-sm font-semibold">{s.no}</span>
                            <h2 className="text-lg font-semibold text-slate-900">{s.title}</h2>
                            <div className="flex-1 h-px bg-slate-200" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {s.items.map((i) => <MenuCard key={i.key} item={i} />)}
                        </div>
                    </section>
                ))}

                {isRegionAdmin(user.role) && (
                    <section className="space-y-3">
                        <div className="flex items-center gap-3 pt-1">
                            <span className="grid place-items-center w-7 h-7 rounded-lg bg-slate-200 text-slate-700"><ShieldCheck className="w-4 h-4" /></span>
                            <h2 className="text-lg font-semibold text-slate-900">ผู้ดูแลระบบ</h2>
                            <div className="flex-1 h-px bg-slate-200" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <MenuCard item={{ href: '/admin/users', icon: Users, title: 'อนุมัติผู้ใช้งาน', desc: 'ตรวจสอบและอนุมัติผู้ใช้งานใหม่' }} />
                            <MenuCard item={{ href: '/admin/tracking', icon: LayoutDashboard, title: 'ติดตามการบันทึกข้อมูล', desc: 'สถานะการส่งรายสัปดาห์' }} />
                        </div>
                    </section>
                )}
            </main>
        </>
    );
}
