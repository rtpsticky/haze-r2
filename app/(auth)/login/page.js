'use client'

import { useActionState } from 'react'
import { login } from '@/app/actions/auth'
import Link from 'next/link'

const initialState = {
    message: '',
}

export default function LoginPage() {
    const [state, formAction, isPending] = useActionState(login, initialState)

    return (
        <div className="space-y-6">
            <div className="text-center space-y-2">
                <div className="mx-auto h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-emerald-600">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                    </svg>
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-800">
                    ยินดีต้อนรับ
                </h1>
                <p className="text-slate-500 text-sm">
                    ระบบบันทึกข้อมูลสถานการณ์ฝุ่น PM 2.5
                    <br />
                    <span className="text-emerald-600 font-semibold">เขตสุขภาพที่ 2 (Haze-r2)</span>
                </p>
            </div>

            <form className="space-y-5" action={formAction}>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="username" className="block text-sm font-medium text-slate-700 mb-1">
                            ชื่อผู้ใช้
                        </label>
                        <input
                            id="username"
                            name="username"
                            type="text"
                            required
                            className="block w-full rounded-lg border border-slate-300 py-2.5 px-3 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-emerald-600 focus:border-emerald-600 sm:text-sm sm:leading-6 transition-shadow"
                            placeholder="กรอกชื่อผู้ใช้"
                        />
                    </div>
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
                            รหัสผ่าน
                        </label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            required
                            className="block w-full rounded-lg border border-slate-300 py-2.5 px-3 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-emerald-600 focus:border-emerald-600 sm:text-sm sm:leading-6 transition-shadow"
                            placeholder="กรอกรหัสผ่าน"
                        />
                    </div>
                </div>

                {state?.message && (
                    <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg p-3 text-center">
                        {state.message}
                    </div>
                )}

                <div>
                    <button
                        type="submit"
                        disabled={isPending}
                        className="flex w-full justify-center rounded-lg bg-emerald-600 py-2.5 px-4 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isPending ? (
                            <span className="flex items-center gap-2">
                                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                กำลังเข้าสู่ระบบ...
                            </span>
                        ) : (
                            'เข้าสู่ระบบ'
                        )}
                    </button>
                </div>

                <div className="text-center pt-2 border-t border-slate-100 mt-4">
                    <p className="text-sm text-slate-500 mt-4">
                        ยังไม่มีบัญชีผู้ใช้งาน?{' '}
                        <Link href="/register" className="font-semibold text-emerald-600 hover:text-emerald-500 transition-colors">
                            สมัครสมาชิกใหม่
                        </Link>
                    </p>
                </div>
            </form>
        </div>
    )
}
