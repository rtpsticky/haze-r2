'use client'

import { useState, useEffect, useRef } from 'react'
import { updateVulnerableRecords } from '@/app/actions/vulnerable'
import VulnerableInputs, { groups } from './VulnerableInputs'

export default function EditVulnerableModal({ isOpen, onClose, date, initialRecords, isReadOnly = false }) {
    const [counts, setCounts] = useState({})
    const [recordIds, setRecordIds] = useState({})
    const [isPending, setIsPending] = useState(false)
    const [message, setMessage] = useState({ text: '', success: false })

    // Reset state when modal opens/changes
    useEffect(() => {
        if (isOpen && initialRecords) {
            const newCounts = {}
            const newRecordIds = {}
            initialRecords.forEach(record => {
                const group = groups.find(g => g.label === record.groupType)
                if (group) {
                    newCounts[group.key] = record.targetCount
                    newRecordIds[group.key] = record.id
                }
            })
            setCounts(newCounts)
            setRecordIds(newRecordIds)
            setMessage({ text: '', success: false })
        }
    }, [isOpen, initialRecords, date])

    if (!isOpen) return null

    const handleCountChange = (key, value) => {
        setCounts(prev => ({ ...prev, [key]: value }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setIsPending(true)
        setMessage({ text: '', success: false })

        const formData = new FormData()
        // ส่ง record_id_{id} = count สำหรับแต่ละกลุ่ม
        groups.forEach(group => {
            const id = recordIds[group.key]
            if (id) {
                formData.append(`record_id_${id}`, counts[group.key] || 0)
            }
        })

        try {
            const res = await updateVulnerableRecords(null, formData)
            setMessage({ text: res.message, success: res.success })
            if (res.success) {
                setTimeout(() => onClose(true), 800) // ปิด modal หลังแสดงข้อความสำเร็จ
            }
        } catch (err) {
            setMessage({ text: 'เกิดข้อผิดพลาด', success: false })
        } finally {
            setIsPending(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            {/* Backdrop */}
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity" onClick={() => onClose(false)}></div>

            <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
                <div className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl">
                    <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                        <div className="sm:flex sm:items-start w-full">
                            <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
                                <h3 className="text-xl font-semibold leading-6 text-slate-900" id="modal-title">
                                    {isReadOnly ? 'รายละเอียด' : 'แก้ไข'}ข้อมูลวันที่ {new Date(date).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}
                                </h3>

                                <form onSubmit={handleSubmit} className="mt-6 space-y-6">
                                    <VulnerableInputs counts={counts} onChange={handleCountChange} disabled={isReadOnly} />

                                    {message.text && (
                                        <div className={`p-4 rounded-lg ${message.success ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                                            {message.text}
                                        </div>
                                    )}

                                    <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                                        {!isReadOnly && (
                                            <button
                                                type="submit"
                                                disabled={isPending}
                                                className="inline-flex w-full justify-center rounded-xl bg-emerald-600 px-3 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 sm:col-start-2 disabled:opacity-70"
                                            >
                                                {isPending ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => onClose(false)}
                                            className={`mt-3 inline-flex w-full justify-center rounded-xl bg-white px-3 py-3 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50 sm:mt-0 ${!isReadOnly ? 'sm:col-start-1' : 'col-span-2'}`}
                                        >
                                            ปิด
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
