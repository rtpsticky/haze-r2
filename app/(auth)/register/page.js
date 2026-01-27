'use client'

import { useActionState, useState, useEffect } from 'react'
import { register } from '@/app/actions/auth'
import { getProvinces, getDistricts, getSubDistricts } from '@/app/actions/locations'
import Link from 'next/link'
import Select from 'react-select'

const initialState = {
    message: '',
}

const customStyles = {
    control: (provided, state) => ({
        ...provided,
        borderRadius: '0.5rem', // rounded-lg
        borderColor: '#e2e8f0', // slate-200
        paddingTop: '3px',
        paddingBottom: '3px',
        boxShadow: state.isFocused ? '0 0 0 2px #10b981' : 'none', // ring-emerald-600
        '&:hover': { borderColor: '#cbd5e1' } // slate-300
    }),
    singleValue: (provided) => ({
        ...provided,
        color: '#1e293b', // slate-800
        fontSize: '0.875rem' // text-sm
    }),
    placeholder: (provided) => ({
        ...provided,
        color: '#94a3b8', // slate-400
        fontSize: '0.875rem'
    })
}

export default function RegisterPage() {
    const [state, formAction, isPending] = useActionState(register, initialState)

    // Location State
    const [provinces, setProvinces] = useState([])
    const [districts, setDistricts] = useState([])
    const [subDistricts, setSubDistricts] = useState([])
    const [selectedRole, setSelectedRole] = useState(null)

    const roles = [
        { value: 'HEALTH_REGION', label: 'เขตสุขภาพ' },
        { value: 'SSJ', label: 'สสจ.' },
        { value: 'SSO', label: 'สสอ.' },
        { value: 'HOSPITAL', label: 'รพ.' },
        { value: 'PCU', label: 'รพ.สต.' }
    ]

    const [selectedProvince, setSelectedProvince] = useState(null)
    const [selectedDistrict, setSelectedDistrict] = useState(null)
    const [selectedSubDistrict, setSelectedSubDistrict] = useState(null)
    const [currentLocationId, setCurrentLocationId] = useState('')

    useEffect(() => {
        getProvinces().then(res => {
            if (res.success) setProvinces(res.data.map(p => ({ value: p, label: p })))
        })
    }, [])

    const handleProvinceChange = async (option) => {
        setSelectedProvince(option)
        setSelectedDistrict(null)
        setSelectedSubDistrict(null)
        setCurrentLocationId('')
        setDistricts([])
        setSubDistricts([])

        if (option) {
            const res = await getDistricts(option.value)
            if (res.success) setDistricts(res.data.map(d => ({ value: d, label: d })))
        }
    }

    const handleDistrictChange = async (option) => {
        setSelectedDistrict(option)
        setSelectedSubDistrict(null)
        setCurrentLocationId('')
        setSubDistricts([])

        if (option) {
            const res = await getSubDistricts(selectedProvince.value, option.value)
            if (res.success) setSubDistricts(res.data.map(s => ({ value: s.subDistrict, label: s.subDistrict, id: s.id })))
        }
    }

    const handleSubDistrictChange = (option) => {
        setSelectedSubDistrict(option)
        setCurrentLocationId(option ? option.id : '')
    }

    return (
        <div className="space-y-6">
            <div className="text-center space-y-2">
                <div className="mx-auto h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-emerald-600">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3.75 15h2.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621.504-1.125 1.125-1.125h3c.621 0 1.125.504 1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125h2.25c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 0 1-2.25 2.25h-13.5A2.25 2.25 0 0 1 2.25 18v-1.875c0-.621.504-1.125 1.125-1.125Z" />
                    </svg>
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-800">
                    สมัครสมาชิก
                </h1>
                <p className="text-slate-500 text-sm">
                    เข้าร่วมระบบบันทึกข้อมูลสถานการณ์ฝุ่น PM 2.5
                </p>
            </div>

            <form className="space-y-4" action={formAction}>
                {/* Hidden input to pass location data to server action */}
                <input type="hidden" name="locationId" value={currentLocationId} />
                <input type="hidden" name="provinceName" value={selectedProvince?.value || ''} />
                <input type="hidden" name="districtName" value={selectedDistrict?.value || ''} />
                <input type="hidden" name="role" value={selectedRole?.value || ''} />

                <div className="space-y-3">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="col-span-1 sm:col-span-2">
                            <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">
                                ชื่อ-นามสกุล
                            </label>
                            <input type="text" id="name" name="name" required className="block w-full rounded-lg border border-slate-300 py-2.5 px-3 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-emerald-600 focus:border-emerald-600 sm:text-sm sm:leading-6 transition-shadow" placeholder="กรอกชื่อ-นามสกุล" />
                        </div>
                        <div className="col-span-1 sm:col-span-2">
                            <label htmlFor="role" className="block text-sm font-medium text-slate-700 mb-1">
                                ประเภทหน่วยงาน
                            </label>
                            <Select
                                placeholder="เลือกประเภทหน่วยงาน..."
                                options={roles}
                                value={selectedRole}
                                onChange={setSelectedRole}
                                styles={customStyles}
                                isClearable
                                required
                                instanceId="role-select"
                            />
                        </div>
                        <div className="col-span-1 sm:col-span-2">
                            <label htmlFor="orgName" className="block text-sm font-medium text-slate-700 mb-1">
                                ชื่อหน่วยงาน
                            </label>
                            <input type="text" id="orgName" name="orgName" required className="block w-full rounded-lg border border-slate-300 py-2.5 px-3 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-emerald-600 focus:border-emerald-600 sm:text-sm sm:leading-6 transition-shadow" placeholder="กรอกชื่อหน่วยงาน" />
                        </div>

                        {/* Location Selectors */}
                        <div className="col-span-1 sm:col-span-2 space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <p className="text-sm font-medium text-slate-700 mb-2 border-b border-slate-200 pb-2">เลือกพื้นที่ปฏิบัติงาน <span className="text-emerald-600 text-xs font-normal">(เลือกจังหวัดเป็นอย่างน้อย)</span></p>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">จังหวัด <span className="text-red-500">*</span></label>
                                    <Select placeholder="เลือก..." options={provinces} value={selectedProvince} onChange={handleProvinceChange} styles={customStyles} isClearable required />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">อำเภอ</label>
                                    <Select placeholder="เลือก..." options={districts} value={selectedDistrict} onChange={handleDistrictChange} isDisabled={!selectedProvince} styles={customStyles} isClearable />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">ตำบล</label>
                                    <Select placeholder="เลือก..." options={subDistricts} value={selectedSubDistrict} onChange={handleSubDistrictChange} isDisabled={!selectedDistrict} styles={customStyles} isClearable />
                                </div>
                            </div>
                        </div>

                        <div className="col-span-1 sm:col-span-2">
                            <label htmlFor="username" className="block text-sm font-medium text-slate-700 mb-1">
                                ชื่อผู้ใช้
                            </label>
                            <input
                                type="text"
                                id="username"
                                name="username"
                                required
                                pattern="[a-zA-Z0-9._-]+"
                                title="ภาษาอังกฤษ ตัวเลข . _ - เท่านั้น"
                                className="block w-full rounded-lg border border-slate-300 py-2.5 px-3 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-emerald-600 focus:border-emerald-600 sm:text-sm sm:leading-6 transition-shadow"
                                placeholder="ตั้งชื่อผู้ใช้ (ภาษาอังกฤษเท่านั้น)"
                            />
                            <p className="mt-1 text-xs text-slate-500">อนุญาตเฉพาะภาษาอังกฤษ ตัวเลข และเครื่องหมาย . _ -</p>
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
                                รหัสผ่าน
                            </label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                required
                                pattern="[a-zA-Z0-9]+"
                                title="ภาษาอังกฤษและตัวเลขเท่านั้น"
                                className="block w-full rounded-lg border border-slate-300 py-2.5 px-3 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-emerald-600 focus:border-emerald-600 sm:text-sm sm:leading-6 transition-shadow"
                                placeholder="ตั้งรหัสผ่าน (ภาษาอังกฤษและตัวเลข)"
                            />
                            <p className="mt-1 text-xs text-slate-500">ภาษาอังกฤษและตัวเลขเท่านั้น (ห้ามใช้อักขระพิเศษ)</p>
                        </div>
                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-1">
                                ยืนยันรหัสผ่าน
                            </label>
                            <input
                                type="password"
                                id="confirmPassword"
                                name="confirmPassword"
                                required
                                pattern="[a-zA-Z0-9]+"
                                className="block w-full rounded-lg border border-slate-300 py-2.5 px-3 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-emerald-600 focus:border-emerald-600 sm:text-sm sm:leading-6 transition-shadow"
                                placeholder="ยืนยันรหัสผ่านอีกครั้ง"
                            />
                        </div>
                    </div>
                </div>

                {state?.message && (
                    <div className={state.success ? "bg-emerald-50 border border-emerald-200 text-emerald-600 text-sm rounded-lg p-3 text-center" : "bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg p-3 text-center"}>
                        {state.message}
                    </div>
                )}

                <div className="pt-2">
                    <button
                        type="submit"
                        disabled={isPending || !selectedProvince}
                        className="flex w-full justify-center rounded-lg bg-emerald-600 py-2.5 px-4 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isPending ? (
                            <span className="flex items-center gap-2">
                                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                กำลังสมัครสมาชิก...
                            </span>
                        ) : 'ยืนยันการสมัคร'}
                    </button>
                </div>

                <div className="text-center pt-2 border-t border-slate-100 mt-4">
                    <p className="text-sm text-slate-500 mt-4">
                        มีบัญชีผู้ใช้งานแล้ว?{' '}
                        <Link href="/login" className="font-semibold text-emerald-600 hover:text-emerald-500 transition-colors">
                            เข้าสู่ระบบที่นี่
                        </Link>
                    </p>
                </div>
            </form>
        </div>
    )
}
