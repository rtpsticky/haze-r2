'use client'

import { useState } from 'react'
import { updateUser } from '@/app/actions/admin'
import Select from 'react-select'

const roles = [
    { value: 'HEALTH_REGION', label: 'เขตสุขภาพ' },
    { value: 'SSJ', label: 'สสจ.' },
    { value: 'SSO', label: 'สสอ.' },
    { value: 'HOSPITAL', label: 'รพ.' },
    { value: 'PCU', label: 'รพ.สต.' },
    { value: 'ADMIN', label: 'ผู้ดูแลระบบ' }
]

const customStyles = {
    control: (provided) => ({
        ...provided,
        borderRadius: '0.5rem',
        borderColor: '#e2e8f0',
        paddingTop: '2px',
        paddingBottom: '2px',
    })
}

export default function EditUserModal({ user, onClose, onSuccess }) {
    const [formData, setFormData] = useState({
        name: user.name,
        orgName: user.orgName,
        role: user.role,
        password: ''
    })
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')

    const selectedRole = roles.find(r => r.value === formData.role)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setIsLoading(true)
        setError('')

        try {
            const result = await updateUser(user.id, formData)
            if (result.success) {
                onSuccess()
                onClose()
            } else {
                setError(result.message || 'เกิดข้อผิดพลาด')
            }
        } catch (err) {
            setError('เกิดข้อผิดพลาดที่ไม่คาดคิด')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-xl w-full">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-slate-800">แก้ไขข้อมูลผู้ใช้งาน</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">ชื่อ-นามสกุล</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            className="block w-full rounded-lg border border-slate-300 py-2 px-3 text-slate-900 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">หน่วยงาน</label>
                        <input
                            type="text"
                            value={formData.orgName}
                            onChange={e => setFormData({ ...formData, orgName: e.target.value })}
                            className="block w-full rounded-lg border border-slate-300 py-2 px-3 text-slate-900 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">บทบาท</label>
                        <Select
                            options={roles}
                            value={selectedRole}
                            onChange={option => setFormData({ ...formData, role: option.value })}
                            styles={{
                                ...customStyles,
                                menuPortal: (base) => ({ ...base, zIndex: 9999 })
                            }}
                            menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                            placeholder="เลือกบทบาท..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            รหัสผ่านใหม่ <span className="text-slate-400 text-xs font-normal">(เว้นว่างหากไม่ต้องการเปลี่ยน)</span>
                        </label>
                        <input
                            type="password"
                            value={formData.password}
                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                            className="block w-full rounded-lg border border-slate-300 py-2 px-3 text-slate-900 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                            placeholder="ตั้งรหัสผ่านใหม่..."
                        />
                    </div>

                    {error && (
                        <div className="text-red-600 text-sm bg-red-50 p-2 rounded">
                            {error}
                        </div>
                    )}

                    <div className="pt-2 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 rounded-lg border border-slate-300 bg-white py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                        >
                            ยกเลิก
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex-1 rounded-lg bg-emerald-600 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-70"
                        >
                            {isLoading ? 'บันทึก...' : 'บันทึกข้อมูล'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
