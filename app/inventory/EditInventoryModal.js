'use client'

import { useState, useEffect } from 'react'
import { useActionState } from 'react'
import { saveInventoryData } from '@/app/actions/inventory'
import InventoryInputs, { items } from './InventoryInputs'

export default function EditInventoryModal({ isOpen, onClose, date, initialRecords }) {
    const [state, formAction, isPending] = useActionState(saveInventoryData, { message: '', success: false })
    const [counts, setCounts] = useState({})

    // Reset state when modal opens/changes
    useEffect(() => {
        if (isOpen && initialRecords) {
            const newCounts = {}
            initialRecords.forEach(record => {
                const item = items.find(i => i.label === record.itemName)
                if (item) {
                    newCounts[item.key] = record.stockCount
                }
            })
            setCounts(newCounts)
        }
    }, [isOpen, initialRecords, date])

    // Close on success
    useEffect(() => {
        if (state?.success) {
            onClose(true) // true = indicate refresh needed
        }
    }, [state?.success, onClose])

    if (!isOpen) return null

    const handleCountChange = (key, value) => {
        setCounts(prev => ({ ...prev, [key]: value }))
    }

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto" ari-labelledby="modal-title" role="dialog" aria-modal="true">
            {/* Backdrop */}
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity" onClick={() => onClose(false)}></div>

            <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
                <div
                    className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl"
                >
                    <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                        <div className="sm:flex sm:items-start w-full">
                            <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
                                <h3 className="text-xl font-semibold leading-6 text-slate-900" id="modal-title">
                                    แก้ไขข้อมูลวันที่ {new Date(date).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}
                                </h3>

                                <form action={formAction} className="mt-6 space-y-6">
                                    <input type="hidden" name="recordDate" value={date} />

                                    <InventoryInputs counts={counts} onChange={handleCountChange} />

                                    {state?.message && (
                                        <div className={`p-4 rounded-lg ${state.success ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                                            {state.message}
                                        </div>
                                    )}

                                    <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                                        <button
                                            type="submit"
                                            disabled={isPending}
                                            className="inline-flex w-full justify-center rounded-xl bg-emerald-600 px-3 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 sm:col-start-2 disabled:opacity-70"
                                        >
                                            {isPending ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => onClose(false)}
                                            className="mt-3 inline-flex w-full justify-center rounded-xl bg-white px-3 py-3 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50 sm:col-start-1 sm:mt-0"
                                        >
                                            ยกเลิก
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
