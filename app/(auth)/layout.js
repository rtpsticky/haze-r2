export default function AuthLayout({ children }) {
    return (
        <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-emerald-50 via-slate-50 to-emerald-50 relative overflow-hidden">

            {/* Background Decor */}
            <div className="absolute top-0 left-0 w-full h-[300px] bg-gradient-to-b from-emerald-100/50 to-transparent skew-y-[-3deg] transform origin-top-left -translate-y-20"></div>

            <div className="max-w-5xl w-full mx-4 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-10">
                <div className="p-8 sm:p-10">
                    {children}
                </div>
            </div>

            <div className="mt-6 text-center z-10">
                <p className="text-slate-500 text-xs font-medium">
                    ระบบบันทึกข้อมูลสุขภาพเขต 2 (Haze-r2) • เพื่อสุขภาพที่ดีของประชาชน
                </p>
            </div>
        </div>
    )
}
