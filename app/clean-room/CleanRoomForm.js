'use client'

import { useActionState, useState, useEffect } from 'react'
import { saveCleanRoomData, getCleanRoomData, getCleanRoomHistory, deleteCleanRoomReport } from '@/app/actions/clean-room'
import Link from 'next/link'
import Modal from '@/app/pheoc/Modal'
import CleanRoomTable from './CleanRoomTable'

export default function CleanRoomForm({ user }) {
    const [state, formAction, isPending] = useActionState(saveCleanRoomData, { message: '', success: false })
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])
    const [formData, setFormData] = useState({})
    const [isLoadingData, setIsLoadingData] = useState(false)
    const [history, setHistory] = useState([])
    const [isLoadingHistory, setIsLoadingHistory] = useState(true)

    // Edit Modal State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [editingDate, setEditingDate] = useState(null)
    const [editFormData, setEditFormData] = useState({})
    const [isLoadingEditData, setIsLoadingEditData] = useState(false)
    const [isSavingEdit, setIsSavingEdit] = useState(false)

    const fetchHistory = async () => {
        try {
            const data = await getCleanRoomHistory()
            setHistory(data)
        } catch (e) {
            console.error('Failed to fetch history:', e)
        } finally {
            setIsLoadingHistory(false)
        }
    }

    useEffect(() => {
        fetchHistory()
    }, [state.success]) // Refresh history when a new report is saved successfully

    useEffect(() => {
        async function fetchData() {
            setIsLoadingData(true)
            try {
                const data = await getCleanRoomData(date)
                const newData = {}
                data.forEach(record => {
                    newData[`${record.placeType}_placeCount`] = record.placeCount
                    newData[`${record.placeType}_targetRoomCount`] = record.targetRoomCount
                    newData[`${record.placeType}_passedStandard`] = record.passedStandard
                    newData[`${record.placeType}_standard1Count`] = record.standard1Count
                    newData[`${record.placeType}_standard2Count`] = record.standard2Count
                    newData[`${record.placeType}_standard3Count`] = record.standard3Count
                    newData[`${record.placeType}_serviceUserCount`] = record.serviceUserCount
                })
                setFormData(newData)
            } catch (e) {
                console.error(e)
            } finally {
                setIsLoadingData(false)
            }
        }
        fetchData()
    }, [date])

    const handleChange = (key, value) => {
        setFormData(prev => ({ ...prev, [key]: value }))
    }

    const handleEditChange = (key, value) => {
        setEditFormData(prev => ({ ...prev, [key]: value }))
    }

    const handleEdit = async (record) => {
        const d = new Date(record.recordDate)
        const year = d.getFullYear()
        const month = String(d.getMonth() + 1).padStart(2, '0')
        const day = String(d.getDate()).padStart(2, '0')
        const dateStr = `${year}-${month}-${day}`

        setEditingDate(dateStr)
        setIsEditModalOpen(true)
        setIsLoadingEditData(true)

        try {
            const data = await getCleanRoomData(dateStr)
            const newData = {}
            data.forEach(rec => {
                newData[`${rec.placeType}_placeCount`] = rec.placeCount
                newData[`${rec.placeType}_targetRoomCount`] = rec.targetRoomCount
                newData[`${rec.placeType}_passedStandard`] = rec.passedStandard
                newData[`${rec.placeType}_standard1Count`] = rec.standard1Count
                newData[`${rec.placeType}_standard2Count`] = rec.standard2Count
                newData[`${rec.placeType}_standard3Count`] = rec.standard3Count
                newData[`${rec.placeType}_serviceUserCount`] = rec.serviceUserCount
            })
            setEditFormData(newData)
        } catch (e) {
            console.error(e)
        } finally {
            setIsLoadingEditData(false)
        }
    }

    const handleSaveEdit = async () => {
        setIsSavingEdit(true)
        try {
            const formDataObj = new FormData()
            formDataObj.append('recordDate', editingDate)
            Object.keys(editFormData).forEach(key => {
                formDataObj.append(key, editFormData[key])
            })

            const result = await saveCleanRoomData(null, formDataObj)
            if (result.success) {
                setIsEditModalOpen(false)
                fetchHistory()
                // If editing the same date as currently selected in main form, refresh that too
                if (date === editingDate) {
                    // trigger re-fetch basically? 
                    // The main form effectively listens to `date`, but we update `formData` locally.
                    // Ideally we should reload.
                    window.location.reload()
                }
            } else {
                alert(result.message || 'บันทึกไม่สำเร็จ')
            }
        } catch (e) {
            console.error(e)
            alert('เกิดข้อผิดพลาด')
        } finally {
            setIsSavingEdit(false)
        }
    }

    const handleDelete = async (recordDate, locationId) => {
        if (!confirm('ยืนยันการลบข้อมูลนี้?')) return
        const d = new Date(recordDate)
        const year = d.getFullYear()
        const month = String(d.getMonth() + 1).padStart(2, '0')
        const day = String(d.getDate()).padStart(2, '0')
        const dateStr = `${year}-${month}-${day}`

        try {
            const res = await deleteCleanRoomReport(dateStr, locationId)
            if (res.success) {
                fetchHistory()
                if (date === dateStr) {
                    setFormData({}) // Clear form if current date was deleted
                }
            } else {
                alert('ลบข้อมูลไม่สำเร็จ')
            }
        } catch (e) {
            alert('เกิดข้อผิดพลาด')
        }
    }

    if (state.success) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
                    <div className="mx-auto h-16 w-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-emerald-600">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">บันทึกสำเร็จ</h2>
                    <p className="text-slate-500 mb-6">บันทึกข้อมูลห้องปลอดฝุ่นเรียบร้อยแล้ว</p>
                    <div className="flex flex-col gap-3">
                        <Link href="/" className="w-full inline-flex justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600">
                            กลับสู่หน้าหลัก
                        </Link>
                        <button onClick={() => window.location.reload()} className="w-full inline-flex justify-center rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50">
                            บันทึกข้อมูลเพิ่ม
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-8 flex items-center gap-4">
                    <Link href="/" className="p-2 rounded-lg bg-white shadow-sm text-slate-500 hover:text-emerald-600 hover:shadow transition-all">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                        </svg>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">ห้องปลอดฝุ่น (Clean Room)</h1>
                        <p className="text-slate-500 text-sm">
                            {user?.location?.provinceName} {user?.location?.districtName} {user?.location?.subDistrict}
                        </p>
                    </div>
                </div>

                <form action={formAction} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-8">
                    <div className="p-6 space-y-6">
                        {/* Date Selection */}
                        <div>
                            <label htmlFor="recordDate" className="block text-sm font-medium text-slate-800 mb-2">
                                วันที่บันทึกข้อมูล
                            </label>
                            <input
                                type="date"
                                name="recordDate"
                                id="recordDate"
                                required
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="block w-full max-w-sm rounded-lg border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
                            />
                        </div>

                        {/* Table */}
                        <CleanRoomTable formData={formData} handleChange={handleChange} isLoadingData={isLoadingData} />
                    </div>

                    <div className="bg-slate-50 px-6 py-4 flex items-center justify-between border-t border-slate-100">
                        {state?.message ? (
                            <span className="text-sm font-medium text-red-600">{state.message}</span>
                        ) : (<span></span>)}

                        <button
                            type="submit"
                            disabled={isPending || isLoadingData}
                            className="rounded-xl bg-emerald-600 px-8 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isPending ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
                        </button>
                    </div>
                </form>

                {/* History Table */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-6">
                        <h2 className="text-lg font-semibold text-slate-900 mb-4">ประวัติการบันทึกข้อมูล</h2>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">วันที่</th>
                                        {user?.role === 'ADMIN' && <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">หน่วยงาน</th>}
                                        <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">จำนวนสถานที่</th>
                                        <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">เป้าหมาย (ห้อง)</th>
                                        <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">ผ่านมาตรฐาน (ห้อง)</th>
                                        <th scope="col" className="relative px-6 py-3">
                                            <span className="sr-only">Actions</span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-slate-200">
                                    {isLoadingHistory ? (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-4 text-center text-sm text-slate-500">กำลังโหลดข้อมูล...</td>
                                        </tr>
                                    ) : history.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-4 text-center text-sm text-slate-500">ไม่พบประวัติการบันทึก</td>
                                        </tr>
                                    ) : (
                                        history.map((record, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                                                    {new Date(record.recordDate).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}
                                                </td>
                                                {user?.role === 'ADMIN' && (
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                                        {record.locationName || '-'}
                                                    </td>
                                                )}
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 text-center">{record.totalPlaces}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 text-center">{record.totalTarget}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 text-center hover:font-bold hover:text-emerald-600 transition-colors cursor-default">
                                                    {record.totalPassed}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    {(user?.role !== 'ADMIN' || user?.locationId === record.locationId) && (
                                                        <button onClick={() => handleEdit(record)} className="text-emerald-600 hover:text-emerald-900 mr-4">แก้ไข</button>
                                                    )}
                                                    <button onClick={() => handleDelete(record.recordDate, record.locationId)} className="text-red-600 hover:text-red-900">ลบ</button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Edit Modal */}
                <Modal
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    title={`แก้ไขข้อมูลวันที่ ${editingDate ? new Date(editingDate).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' }) : ''}`}
                    maxWidth="sm:max-w-[90%]"
                >
                    <div className="space-y-4 max-h-[80vh] overflow-y-auto p-1">
                        <CleanRoomTable formData={editFormData} handleChange={handleEditChange} isLoadingData={isLoadingEditData} />
                        <div className="pt-4 flex justify-end gap-3">
                            <button
                                onClick={() => setIsEditModalOpen(false)}
                                className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-200"
                            >
                                ยกเลิก
                            </button>
                            <button
                                onClick={handleSaveEdit}
                                disabled={isSavingEdit || isLoadingEditData}
                                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
                            >
                                {isSavingEdit ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}
                            </button>
                        </div>
                    </div>
                </Modal>
            </div>
        </div>
    )
}
