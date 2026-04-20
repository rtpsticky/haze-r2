'use client'

import Link from 'next/link'

export default function MaintenancePage() {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
            <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl border border-slate-100 text-center">
                <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-amber-500 animate-pulse">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.83-5.83m0 0a2.978 2.978 0 01-3.693-3.693L19.75 3A2.652 2.652 0 0016.25.5L8.783 8.017a2.978 2.978 0 01-3.693 3.693L.75 5.954a2.652 2.652 0 00-3.5 3.5l5.83 5.83m0 0a2.978 2.978 0 01-3.693 3.693L.5 16.25A2.652 2.652 0 003 19.75l7.5-7.5" />
                    </svg>
                </div>
                
                <h1 className="text-2xl font-bold text-slate-800 mb-2">ปรับปรุงระบบชั่วคราว</h1>
                <p className="text-slate-500 mb-8 leading-relaxed">
                    ขออภัยในความไม่สะดวก ขณะนี้ระบบ Dashboard กำลังอยู่ระหว่างการปรับปรุงข้อมูลเพื่อให้มีความแม่นยำและรวดเร็วยิ่งขึ้น
                </p>

                <div className="space-y-3">
                    <Link 
                        href="/" 
                        className="block w-full py-3 px-6 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-md shadow-emerald-100"
                    >
                        กลับหน้าหลัก
                    </Link>
                    <p className="text-xs text-slate-400">
                        คาดว่าจะกลับมาเปิดใช้งานได้ในเร็วๆ นี้
                    </p>
                </div>
            </div>
            
            <p className="mt-8 text-sm text-slate-400 font-medium">
                © {new Date().getFullYear()} Haze Monitoring System R2
            </p>
        </div>
    )
}
