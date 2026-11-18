import Link from 'next/link';
import { ArrowLeft, MapPin, History } from 'lucide-react';
import { menuItem, ROLE_LABEL } from '../_lib/menu';

/** ส่วนหัวหน้ากรอกข้อมูล (ติดบนสุด) — โทนเดียวกับ Dashboard */
export default function PageHeader({ menuKey, title, subtitle, user, actions }) {
    const item = menuKey ? menuItem(menuKey) : null;
    const Icon = item?.icon;
    const place = [user?.location?.provinceName && `จ.${user.location.provinceName}`, user?.location?.districtName && `อ.${user.location.districtName}`]
        .filter(Boolean).join(' ');
    return (
        <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-slate-200">
            <div className="max-w-5xl mx-auto px-4 md:px-6 py-3 flex flex-wrap items-center gap-3">
                <Link href="/v2" aria-label="กลับหน้าเมนู" className="grid place-items-center w-10 h-10 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 shrink-0">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div className="flex-1 min-w-0">
                    <h1 className="text-xl md:text-2xl font-semibold leading-tight flex items-center gap-2">
                        {Icon && <Icon className="w-6 h-6 text-blue-600 shrink-0" />}
                        <span className="truncate">{title || item?.title}</span>
                    </h1>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-slate-500 mt-0.5">
                        {subtitle && <span>{subtitle}</span>}
                        {user && (
                            <span className="inline-flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5" />
                                {user.orgName || place || '—'}
                                {user.role && <span className="text-slate-400">· {ROLE_LABEL[user.role] || user.role}</span>}
                            </span>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {actions}
                    {item?.v1 && (
                        <Link href={item.v1} className="h-10 px-3 rounded-xl text-sm font-medium inline-flex items-center gap-1.5 border border-slate-200 bg-white text-slate-600 hover:bg-slate-100" title="เปิดหน้ากรอกแบบเดิม">
                            <History className="w-4 h-4" /> แบบเดิม (v1)
                        </Link>
                    )}
                </div>
            </div>
        </header>
    );
}
