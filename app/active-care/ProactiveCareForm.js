'use client'

import { useState, useEffect, useTransition } from 'react'
import Select from 'react-select'
import { getActiveCareData, saveActiveCareData, getActiveCareHistory, deleteActiveCareData } from '@/app/actions/active-care'
import { getProvinces, getDistricts, getSubDistricts } from '@/app/actions/locations'
import { getOperationData } from '@/app/actions/operations' // Use this to get initial user location if needed, or we can use getActiveCareData with null

const ACTIVITIES = [
    "การสอบสวนโรค",
    "การดูแลสุขภาพจิต",
    "การรักษาพยาบาลเบื้องต้น"
]

const customStyles = {
    control: (provided, state) => ({
        ...provided,
        borderRadius: '0.75rem',
        borderColor: state.isFocused ? '#10b981' : '#e2e8f0',
        paddingTop: '3px',
        paddingBottom: '3px',
        boxShadow: 'none',
        '&:hover': { borderColor: '#10b981' }
    })
}

export default function ProactiveCareForm() {
    const [isLoading, setIsLoading] = useState(true)
    const [isPending, startTransition] = useTransition()
    const [showSuccess, setShowSuccess] = useState(false)
    const [showModal, setShowModal] = useState(false)

    // History & Location
    const [history, setHistory] = useState([])
    const [provinces, setProvinces] = useState([])
    const [districts, setDistricts] = useState([])
    const [subDistricts, setSubDistricts] = useState([])

    const [selectedProvince, setSelectedProvince] = useState(null)
    const [selectedDistrict, setSelectedDistrict] = useState(null)
    const [selectedSubDistrict, setSelectedSubDistrict] = useState(null)
    const [currentLocationId, setCurrentLocationId] = useState(null)
    const [isLocationInitialized, setIsLocationInitialized] = useState(false)

    // Modal Form State
    const [editDate, setEditDate] = useState(new Date().toISOString().split('T')[0])
    const [formData, setFormData] = useState({
        activeCares: ACTIVITIES.reduce((acc, act) => {
            acc[act] = { households: '', people: '', riskGroups: '' }; return acc
        }, {}),
        localSupport: { orgCount: '', maskSupport: '', dustNetSupport: '', cleanRoomSupport: '' }
    })

    // Init Logic
    useEffect(() => {
        getProvinces().then(res => { if (res.success) setProvinces(res.data.map(p => ({ value: p, label: p }))) })
        fetchHistory(null)
    }, [])

    async function fetchHistory(locId) {
        setIsLoading(true)
        const res = await getActiveCareHistory(locId)
        if (res.success) setHistory(res.data)
        setIsLoading(false)
    }

    // Location Filter Logic (Same as Operations)
    useEffect(() => {
        if (isLocationInitialized) fetchHistory(currentLocationId)
    }, [currentLocationId, isLocationInitialized])

    useEffect(() => {
        if (!isLocationInitialized) {
            // Use getActiveCareData(null, null) to get user default
            getActiveCareData(new Date().toISOString().split('T')[0], null).then(res => {
                if (res.success && res.data.location) {
                    const loc = res.data.location
                    setCurrentLocationId(loc.id)

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
                } else {
                    setIsLocationInitialized(true)
                }
            })
        }
    }, [isLocationInitialized])

    // Location Handlers
    const handleProvinceChange = async (option) => {
        setSelectedProvince(option); setSelectedDistrict(null); setSelectedSubDistrict(null); setCurrentLocationId(null)
        setDistricts([]); setSubDistricts([])
        if (option) {
            const res = await getDistricts(option.value)
            if (res.success) setDistricts(res.data.map(d => ({ value: d, label: d })))
        }
    }
    const handleDistrictChange = async (option) => {
        setSelectedDistrict(option); setSelectedSubDistrict(null); setCurrentLocationId(null); setSubDistricts([])
        if (option) {
            const res = await getSubDistricts(selectedProvince.value, option.value)
            if (res.success) setSubDistricts(res.data.map(s => ({ value: s.subDistrict, label: s.subDistrict, id: s.id })))
        }
    }
    const handleSubDistrictChange = (option) => {
        setSelectedSubDistrict(option); setCurrentLocationId(option ? option.id : null)
    }

    // Modal Logic
    const openModal = async (dateStr = null) => {
        const targetDate = dateStr || new Date().toISOString().split('T')[0]
        setEditDate(targetDate)
        await loadFormData(targetDate)
        setShowModal(true)
    }

    const loadFormData = async (date) => {
        if (!currentLocationId) return
        setIsLoading(true)
        const res = await getActiveCareData(date, currentLocationId)
        if (res.success) {
            const newActiveCares = { ...formData.activeCares }
            Object.keys(newActiveCares).forEach(k => newActiveCares[k] = { households: '', people: '', riskGroups: '' })
            res.data.activeCares.forEach(log => {
                if (newActiveCares[log.activity]) {
                    newActiveCares[log.activity] = {
                        households: log.households || '', people: log.people || '', riskGroups: log.riskGroups || ''
                    }
                }
            })
            const support = res.data.adminSupport || {}
            setFormData({
                activeCares: newActiveCares,
                localSupport: {
                    orgCount: support.orgCount || '',
                    maskSupport: support.maskSupport || '',
                    dustNetSupport: support.dustNetSupport || '',
                    cleanRoomSupport: support.cleanRoomSupport || ''
                }
            })
        }
        setIsLoading(false)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!currentLocationId) return alert('กรุณาเลือกพื้นที่')

        startTransition(async () => {
            const fd = new FormData()
            fd.append('date', editDate)
            fd.append('locationId', currentLocationId)

            Object.entries(formData.activeCares).forEach(([act, vals]) => {
                fd.append(`households_${act}`, vals.households)
                fd.append(`people_${act}`, vals.people)
                fd.append(`riskGroups_${act}`, vals.riskGroups)
            })
            fd.append('orgCount', formData.localSupport.orgCount)
            fd.append('maskSupport', formData.localSupport.maskSupport)
            fd.append('dustNetSupport', formData.localSupport.dustNetSupport)
            fd.append('cleanRoomSupport', formData.localSupport.cleanRoomSupport)

            const res = await saveActiveCareData(null, fd)
            if (res.success) {
                setShowSuccess(true)
                setShowModal(false)
                fetchHistory(currentLocationId)
                setTimeout(() => setShowSuccess(false), 3000)
            } else {
                alert(res.message)
            }
        })
    }

    const handleDelete = async (dateStr) => {
        if (!confirm('ยืนยันการลบข้อมูลของวันที่ ' + dateStr + '?')) return
        startTransition(async () => {
            const res = await deleteActiveCareData(dateStr, currentLocationId)
            if (res.success) fetchHistory(currentLocationId)
            else alert(res.message)
        })
    }

    const handleCareChange = (act, field, val) => setFormData(p => ({ ...p, activeCares: { ...p.activeCares, [act]: { ...p.activeCares[act], [field]: val } } }))
    const handleSupportChange = (field, val) => setFormData(p => ({ ...p, localSupport: { ...p.localSupport, [field]: val } }))

    return (
        <div className="relative font-sarabun text-slate-800 animate-fade-in-up">
            {/* Header + Filters */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-6">
                <h2 className="text-xl font-bold mb-6 text-slate-700 flex items-center gap-2">
                    <span className="w-1 h-6 bg-emerald-500 rounded-full"></span>
                    การดูแลเชิงรุกและการสนับสนุน
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Select placeholder="เลือกจังหวัด" options={provinces} value={selectedProvince} onChange={handleProvinceChange} styles={customStyles} isClearable />
                    <Select placeholder="เลือกอำเภอ" options={districts} value={selectedDistrict} onChange={handleDistrictChange} isDisabled={!selectedProvince} styles={customStyles} isClearable />
                    <Select placeholder="เลือกตำบล" options={subDistricts} value={selectedSubDistrict} onChange={handleSubDistrictChange} isDisabled={!selectedDistrict} styles={customStyles} isClearable />
                </div>
            </div>

            {/* Action Bar */}
            <div className="flex justify-end mb-4">
                <button onClick={() => openModal()} disabled={!currentLocationId}
                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl shadow-lg shadow-emerald-500/20 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                        <path fillRule="evenodd" d="M12 3.75a.75.75 0 01.75.75v6.75h6.75a.75.75 0 010 1.5h-6.75v6.75a.75.75 0 01-1.5 0v-6.75H4.5a.75.75 0 010-1.5h6.75V4.5a.75.75 0 01.75-.75z" clipRule="evenodd" />
                    </svg> เพิ่มรายงาน
                </button>
            </div>

            {/* History Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <table className="min-w-full divide-y divide-slate-100">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">วันที่บันทึก</th>
                            <th className="px-6 py-4 text-center text-sm font-semibold text-slate-600">จัดการ</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                        {history.length === 0 ? (
                            <tr><td colSpan="2" className="px-6 py-8 text-center text-slate-400">ไม่พบข้อมูลประวัติการบันทึก</td></tr>
                        ) : (
                            history.map(dateStr => (
                                <tr key={dateStr} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4 text-sm text-slate-700">
                                        {new Date(dateStr).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}
                                    </td>
                                    <td className="px-6 py-4 text-center flex items-center justify-center gap-3">
                                        <button onClick={() => openModal(dateStr)} className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors">แก้ไข</button>
                                        <button onClick={() => handleDelete(dateStr)} className="text-red-500 hover:text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors">ลบ</button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in overflow-y-auto">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto animate-bounce-in font-sarabun">
                        <div className="sticky top-0 bg-white z-10 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-slate-700">บันทึกข้อมูลการดูแลเชิงรุก</h3>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <div className="p-6">
                            <form onSubmit={handleSubmit} className="space-y-8">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-600 mb-2">วันที่บันทึกข้อมูล</label>
                                    <input type="date" className="block w-full rounded-lg border-slate-200 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 text-sm py-2.5 px-3"
                                        value={editDate} onChange={(e) => { setEditDate(e.target.value); loadFormData(e.target.value) }} required />
                                </div>

                                {/* Active Care Table */}
                                <div className="bg-slate-50/50 rounded-xl border border-slate-100 overflow-hidden">
                                    <div className="px-6 py-3 border-b border-slate-100 flex items-center gap-2 bg-slate-100/50">
                                        <span className="w-2 h-2 rounded-full bg-blue-500"></span><h2 className="text-base font-bold text-slate-700">การปฏิบัติการเชิงรุก</h2>
                                    </div>
                                    <div className="p-4 overflow-x-auto">
                                        <table className="min-w-full divide-y divide-slate-100 text-sm">
                                            <thead>
                                                <tr>
                                                    <th className="py-2 text-left font-semibold text-slate-500">การดำเนินงาน</th>
                                                    <th className="px-2 font-semibold text-slate-500 text-center">ครัวเรือน (หลัง)</th>
                                                    <th className="px-2 font-semibold text-slate-500 text-center">ประชาชน (คน)</th>
                                                    <th className="px-2 font-semibold text-slate-500 text-center">กลุ่มเสี่ยง (คน)</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {ACTIVITIES.map((act) => (
                                                    <tr key={act}>
                                                        <td className="py-2 font-medium text-slate-700">{act}</td>
                                                        {['households', 'people', 'riskGroups'].map(f => (
                                                            <td key={f} className="px-2 py-1"><input type="number" className="w-full text-center border-slate-200 rounded-lg p-1.5"
                                                                value={formData.activeCares[act][f]} onChange={(e) => handleCareChange(act, f, e.target.value)} placeholder="0" /></td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Local Support Table */}
                                <div className="bg-slate-50/50 rounded-xl border border-slate-100 overflow-hidden">
                                    <div className="px-6 py-3 border-b border-slate-100 flex items-center gap-2 bg-slate-100/50">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span><h2 className="text-base font-bold text-slate-700">การสนับสนุนของ อปท.</h2>
                                    </div>
                                    <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {[
                                            { label: 'จำนวน อปท.', key: 'orgCount' },
                                            { label: 'Mask Support', key: 'maskSupport' },
                                            { label: 'มุ้งสู้ฝุ่น', key: 'dustNetSupport' },
                                            { label: 'ห้องปลอดฝุ่น', key: 'cleanRoomSupport' }
                                        ].map(item => (
                                            <div key={item.key}>
                                                <label className="block text-xs font-semibold text-slate-500 mb-1">{item.label}</label>
                                                <input type="number" className="block w-full rounded-lg border-slate-200 text-sm"
                                                    value={formData.localSupport[item.key]} onChange={(e) => handleSupportChange(item.key, e.target.value)} placeholder="0" />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex justify-end pt-4 border-t border-slate-100 gap-3">
                                    <button type="button" onClick={() => setShowModal(false)} className="px-6 py-2.5 rounded-lg text-slate-600 hover:bg-slate-100 font-medium transition-colors">ยกเลิก</button>
                                    <button type="submit" disabled={isPending} className="px-6 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-lg shadow-emerald-500/20 transition-all hover:-translate-y-0.5">
                                        {isPending ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {showSuccess && (
                <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-fade-in-up">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" /></svg>
                    <span className="font-medium">บันทึกข้อมูลเรียบร้อยแล้ว</span>
                </div>
            )}
        </div>
    )
}
