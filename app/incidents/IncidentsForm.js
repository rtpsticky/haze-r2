'use client'

import { useState, useEffect, useTransition } from 'react'
import Select from 'react-select'
import { getIncidentData, saveIncident, updateIncident, deleteIncident } from '@/app/actions/incidents'
import { getProvinces, getDistricts, getSubDistricts } from '@/app/actions/locations'
import { getOperationData } from '@/app/actions/operations' // Use default logic to get location via null if needed

// Custom Styles for React Select
const customStyles = {
    control: (provided, state) => ({
        ...provided,
        borderRadius: '0.75rem', // rounded-xl
        borderColor: state.isFocused ? '#10b981' : '#e2e8f0',
        paddingTop: '3px',
        paddingBottom: '3px',
        boxShadow: 'none',
        '&:hover': { borderColor: '#10b981' }
    })
}

export default function IncidentsForm({ user }) {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])
    const [isLoading, setIsLoading] = useState(true)
    const [isPending, startTransition] = useTransition()
    const [showSuccess, setShowSuccess] = useState(false)
    const [incidents, setIncidents] = useState([])

    // Location Selector State
    const [provinces, setProvinces] = useState([])
    const [districts, setDistricts] = useState([])
    const [subDistricts, setSubDistricts] = useState([])

    const [selectedProvince, setSelectedProvince] = useState(null)
    const [selectedDistrict, setSelectedDistrict] = useState(null)
    const [selectedSubDistrict, setSelectedSubDistrict] = useState(null)
    const [currentLocationId, setCurrentLocationId] = useState(null)
    const [isLocationInitialized, setIsLocationInitialized] = useState(false)
    const [isProvinceLocked, setIsProvinceLocked] = useState(false)

    // Edit Modal State
    const [editingIncident, setEditingIncident] = useState(null)
    const [showEditModal, setShowEditModal] = useState(false)

    // Form State for New Incident
    const [formData, setFormData] = useState({
        staffName: '',
        status: '',
        incidentDetails: ''
    })

    // --- Location Init & Loading ---
    useEffect(() => {
        getProvinces().then(res => {
            if (res.success) setProvinces(res.data.map(p => ({ value: p, label: p })))
        })
    }, [])

    useEffect(() => {
        // Initialize user location once
        if (!isLocationInitialized) {
            // We can trigger a load with null location to get default user location
            getIncidentData(date, null).then(res => {
                if (res.success && res.data.location) {
                    const loc = res.data.location
                    setCurrentLocationId(loc.id)
                    if (user?.role === 'ADMIN') {
                        setIsProvinceLocked(false)
                    } else {
                        setIsProvinceLocked(true)
                    }

                    // Helper to sync selectors
                    const setSelectors = async () => {
                        const provOpt = { value: loc.provinceName, label: loc.provinceName }
                        setSelectedProvince(provOpt)

                        const distRes = await getDistricts(loc.provinceName)
                        if (distRes.success) setDistricts(distRes.data.map(d => ({ value: d, label: d })))
                        const distOpt = { value: loc.districtName, label: loc.districtName }
                        setSelectedDistrict(distOpt)

                        const subRes = await getSubDistricts(loc.provinceName, loc.districtName)
                        if (subRes.success) setSubDistricts(subRes.data.map(s => ({ value: s.subDistrict, label: s.subDistrict, id: s.id })))
                        const subOpt = { value: loc.subDistrict, label: loc.subDistrict, id: loc.id }
                        setSelectedSubDistrict(subOpt)
                    }
                    setSelectors()
                    setIsLocationInitialized(true)
                    setIncidents(res.data.incidents || [])
                    setIsLoading(false)
                } else {
                    setIsLocationInitialized(true)
                    setIsLoading(false)
                }
            })
        }
    }, [isLocationInitialized]) // Run once

    // --- Main Data Loading ---
    useEffect(() => {
        if (isLocationInitialized) {
            loadData()
        }
    }, [date, currentLocationId, isLocationInitialized])

    async function loadData() {
        if (!currentLocationId) return

        setIsLoading(true)
        try {
            const res = await getIncidentData(date, currentLocationId)
            if (res.success) {
                setIncidents(res.data.incidents || [])
            }
        } catch (error) {
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }

    // --- Location Handlers ---
    const handleProvinceChange = async (option) => {
        setSelectedProvince(option); setSelectedDistrict(null); setSelectedSubDistrict(null); setCurrentLocationId(null)
        setDistricts([]); setSubDistricts([]); setIncidents([])
        if (option) {
            const res = await getDistricts(option.value)
            if (res.success) setDistricts(res.data.map(d => ({ value: d, label: d })))
        }
    }
    const handleDistrictChange = async (option) => {
        setSelectedDistrict(option); setSelectedSubDistrict(null); setCurrentLocationId(null); setSubDistricts([]); setIncidents([])
        if (option) {
            const res = await getSubDistricts(selectedProvince.value, option.value)
            if (res.success) setSubDistricts(res.data.map(s => ({ value: s.subDistrict, label: s.subDistrict, id: s.id })))
        }
    }
    const handleSubDistrictChange = (option) => {
        setSelectedSubDistrict(option)
        setCurrentLocationId(option ? option.id : null)
    }

    // Auto-hide success message
    useEffect(() => {
        if (showSuccess) {
            const timer = setTimeout(() => {
                setShowSuccess(false)
            }, 3000)
            return () => clearTimeout(timer)
        }
    }, [showSuccess])

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    async function handleSubmit(e) {
        e.preventDefault()
        if (!currentLocationId) return alert('กรุณาเลือกพื้นที่')

        startTransition(async () => {
            const formDataObj = new FormData()
            formDataObj.append('recordDate', date)
            formDataObj.append('locationId', currentLocationId)
            formDataObj.append('staffName', formData.staffName)
            formDataObj.append('status', formData.status)
            formDataObj.append('incidentDetails', formData.incidentDetails)

            const res = await saveIncident(null, formDataObj)
            if (res.success) {
                setShowSuccess(true)
                setFormData({ staffName: '', status: '', incidentDetails: '' })
                loadData()
            } else {
                alert(res.message || 'เกิดข้อผิดพลาด')
            }
        })
    }

    async function handleEditSubmit(e) {
        e.preventDefault()
        startTransition(async () => {
            const formDataObj = new FormData()
            formDataObj.append('id', editingIncident.id)
            formDataObj.append('staffName', editingIncident.staffName)
            formDataObj.append('status', editingIncident.status)
            formDataObj.append('incidentDetails', editingIncident.incidentDetails)

            const res = await updateIncident(null, formDataObj)
            if (res.success) {
                setShowEditModal(false)
                setEditingIncident(null)
                setShowSuccess(true)
                loadData()
            } else {
                alert(res.message || 'เกิดข้อผิดพลาด')
            }
        })
    }

    async function handleDelete(id) {
        if (!confirm('คุณต้องการลบรายงานนี้ใช่หรือไม่?')) return

        startTransition(async () => {
            const res = await deleteIncident(id)
            if (res.success) loadData()
            else alert(res.message || 'เกิดข้อผิดพลาด')
        })
    }

    // Initial loading state wait
    if (!currentLocationId && isLoading && !isLocationInitialized) return <div className="p-6 text-slate-500">Loading initial location...</div>

    return (
        <div className="relative font-sarabun text-slate-800 animate-fade-in-up">
            {/* Success Modal */}
            {showSuccess && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full transform transition-all animate-bounce-in flex flex-col items-center">
                        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4 text-emerald-600">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">บันทึกข้อมูลสำเร็จ!</h3>
                        <p className="text-slate-500 text-center mb-6 text-sm">การดำเนินการเสร็จสิ้นเรียบร้อยแล้ว</p>
                        <button onClick={() => setShowSuccess(false)} className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-colors">ตกลง</button>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {showEditModal && editingIncident && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-slide-up">
                        <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-slate-800">แก้ไขรายงานเหตุการณ์</h3>
                            <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-600">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-600 mb-1">ชื่อ-นามสกุล</label>
                                <input type="text" required className="block w-full rounded-lg border-slate-200 shadow-sm focus:border-blue-500 focus:ring-blue-500" value={editingIncident.staffName} onChange={(e) => setEditingIncident({ ...editingIncident, staffName: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-600 mb-2">สถานะ</label>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2"><input type="radio" name="editStatus" value="บาดเจ็บ" checked={editingIncident.status === 'บาดเจ็บ'} onChange={(e) => setEditingIncident({ ...editingIncident, status: e.target.value })} className="text-red-600 focus:ring-red-500" /> บาดเจ็บ</label>
                                    <label className="flex items-center gap-2"><input type="radio" name="editStatus" value="เสียชีวิต" checked={editingIncident.status === 'เสียชีวิต'} onChange={(e) => setEditingIncident({ ...editingIncident, status: e.target.value })} className="text-red-600 focus:ring-red-500" /> เสียชีวิต</label>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-600 mb-1">รายละเอียด</label>
                                <textarea required rows={4} className="block w-full rounded-xl border-slate-200 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 py-3 px-4 text-slate-700 transition-all hover:bg-slate-50 focus:bg-white focus:shadow-md placeholder:text-slate-400" value={editingIncident.incidentDetails} onChange={(e) => setEditingIncident({ ...editingIncident, incidentDetails: e.target.value })} />
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={() => setShowEditModal(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg">ยกเลิก</button>
                                <button type="submit" disabled={isPending} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm">บันทึกการแก้ไข</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="space-y-8">
                {/* Header / Location Info */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h2 className="text-xl font-bold mb-6 text-slate-700 flex items-center gap-2">
                        <span className="w-1 h-6 bg-emerald-500 rounded-full"></span>
                        ข้อมูลวันที่และสถานที่
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-semibold text-slate-600 mb-2">จังหวัด อำเภอ ตำบล</label>
                            <div className="grid grid-cols-3 gap-3">
                                <Select placeholder="เลือกจังหวัด" options={provinces} value={selectedProvince} onChange={handleProvinceChange} styles={customStyles} isClearable={!isProvinceLocked} isDisabled={isProvinceLocked} />
                                <Select placeholder="เลือกอำเภอ" options={districts} value={selectedDistrict} onChange={handleDistrictChange} isDisabled={!selectedProvince} styles={customStyles} isClearable />
                                <Select placeholder="เลือกตำบล" options={subDistricts} value={selectedSubDistrict} onChange={handleSubDistrictChange} isDisabled={!selectedDistrict} styles={customStyles} isClearable />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-600 mb-2">วันที่บันทึกข้อมูล</label>
                            <input type="date" className="block w-full rounded-lg border-slate-200 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 text-sm py-2.5 px-3 transition-shadow" value={date} onChange={(e) => setDate(e.target.value)} required />
                        </div>
                    </div>
                </div>

                {/* Create Form */}
                <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-6">
                    <div className="border-b border-slate-100 pb-4 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-red-500"></span>
                        <h2 className="text-xl font-bold text-slate-700">รายงานผลกระทบต่อสุขภาพ (เพิ่มรายการใหม่)</h2>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-semibold text-slate-600 mb-2">ชื่อ-นามสกุล (เจ้าหน้าที่/จิตอาสา ดับไฟป่า) <span className="text-red-500">*</span></label>
                            <input type="text" required className="block w-full rounded-lg border-slate-200 shadow-sm focus:border-red-500 focus:ring-red-500 py-2.5 px-3 text-slate-700 transition-colors" placeholder="ระบุชื่อ-นามสกุล" value={formData.staffName} onChange={(e) => handleChange('staffName', e.target.value)} />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-600 mb-3">สถานะ <span className="text-red-500">*</span></label>
                            <div className="flex gap-6">
                                <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${formData.status === 'บาดเจ็บ' ? 'bg-red-50 border-red-500 text-red-700 shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:border-red-200'}`}>
                                    <input type="radio" name="status" value="บาดเจ็บ" className="w-5 h-5 text-red-600 border-gray-300 focus:ring-red-500" checked={formData.status === 'บาดเจ็บ'} onChange={(e) => handleChange('status', e.target.value)} required />
                                    <span className="font-medium">บาดเจ็บ</span>
                                </label>
                                <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${formData.status === 'เสียชีวิต' ? 'bg-red-50 border-red-500 text-red-700 shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:border-red-200'}`}>
                                    <input type="radio" name="status" value="เสียชีวิต" className="w-5 h-5 text-red-600 border-gray-300 focus:ring-red-500" checked={formData.status === 'เสียชีวิต'} onChange={(e) => handleChange('status', e.target.value)} />
                                    <span className="font-medium">เสียชีวิต</span>
                                </label>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-600 mb-2">รายละเอียดเหตุการณ์ <span className="text-red-500">*</span></label>
                            <textarea required rows={4} className="block w-full rounded-xl border-slate-200 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 py-3 px-4 text-slate-700 transition-all hover:bg-slate-50 focus:bg-white focus:shadow-md placeholder:text-slate-400" placeholder="ระบุรายละเอียดเหตุการณ์..." value={formData.incidentDetails} onChange={(e) => handleChange('incidentDetails', e.target.value)} />
                        </div>
                    </div>

                    <div className="flex justify-end pt-2">
                        <button type="submit" disabled={isPending || !currentLocationId} className="rounded-xl bg-emerald-600 px-10 py-3 text-base font-semibold text-white shadow-lg hover:bg-emerald-500 hover:shadow-emerald-500/30 hover:-translate-y-0.5 transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:bg-slate-300 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-y-0">
                            {isPending ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
                        </button>
                    </div>
                </form>

                {/* Incidents History Table */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-slate-500"></span>
                            <h2 className="text-lg font-bold text-slate-700">ประวัติการรายงาน (วันที่ {new Date(date).toLocaleDateString('th-TH')})</h2>
                        </div>
                        <span className="text-sm text-slate-500">ทั้งหมด {incidents.length} รายการ</span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-100">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th scope="col" className="px-6 py-4 text-left text-sm font-semibold text-slate-600">ชื่อ-นามสกุล</th>
                                    <th scope="col" className="px-6 py-4 text-left text-sm font-semibold text-slate-600">สถานะ</th>
                                    <th scope="col" className="px-6 py-4 text-left text-sm font-semibold text-slate-600">รายละเอียด</th>
                                    <th scope="col" className="px-6 py-4 text-right text-sm font-semibold text-slate-600">จัดการ</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                                {incidents.length > 0 ? (
                                    incidents.map((incident) => (
                                        <tr key={incident.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4 text-sm font-medium text-slate-900">{incident.staffName}</td>
                                            <td className="px-6 py-4 text-sm">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${incident.status === 'เสียชีวิต' ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'}`}>{incident.status}</span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-600 max-w-md truncate">{incident.incidentDetails}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button onClick={() => { setEditingIncident(incident); setShowEditModal(true) }} className="text-blue-600 hover:text-blue-900 mr-4 transition-colors">แก้ไข</button>
                                                <button onClick={() => handleDelete(incident.id)} className="text-red-600 hover:text-red-900 transition-colors">ลบ</button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan="4" className="px-6 py-12 text-center text-slate-400 text-sm">ยังไม่มีรายการเหตุการณ์ในวันนี้</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    )
}
