'use client'

import { useState, useEffect } from 'react'
import { getWeeklyStaffTracking, getOverallTrackingExport } from '@/app/actions/tracking'
import { getProvinces, getDistricts } from '@/app/actions/locations'
import { logout } from '@/app/actions/auth'
import Link from 'next/link'
import Select from 'react-select'
import * as XLSX from 'xlsx'

export default function TrackingPage({ user }) {
    const [trackingData, setTrackingData] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [filterProvince, setFilterProvince] = useState('all')
    const [filterDistrict, setFilterDistrict] = useState('all')
    const [filterStatus, setFilterStatus] = useState('all')
    const [provinces, setProvinces] = useState([])
    const [districts, setDistricts] = useState([])
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
    const [weekRange, setWeekRange] = useState({ start: '', end: '' })
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [totalItems, setTotalItems] = useState(0)
    const [globalStats, setGlobalStats] = useState({ totalAtLeastOne: 0, totalNotStarted: 0 })
    const [isExportingWeekly, setIsExportingWeekly] = useState(false)
    const [isExportingOverall, setIsExportingOverall] = useState(false)

    const PROVINCES_LIST = [
        { value: 'all', label: 'ทุกจังหวัด' },
        { value: 'พิษณุโลก', label: 'พิษณุโลก' },
        { value: 'ตาก', label: 'ตาก' },
        { value: 'เพชรบูรณ์', label: 'เพชรบูรณ์' },
        { value: 'สุโขทัย', label: 'สุโขทัย' },
        { value: 'อุตรดิตถ์', label: 'อุตรดิตถ์' }
    ]

    useEffect(() => {
        async function loadDistricts() {
            if (filterProvince !== 'all') {
                const res = await getDistricts(filterProvince)
                if (res.success) {
                    setDistricts([
                        { value: 'all', label: 'ทุกอำเภอ' },
                        ...res.data.map(d => ({ value: d, label: d }))
                    ])
                }
            } else {
                setDistricts([])
                setFilterDistrict('all')
            }
        }
        loadDistricts()
    }, [filterProvince])

    useEffect(() => {
        async function fetchData() {
            setLoading(true)
            const result = await getWeeklyStaffTracking({ 
                page, 
                filterStatus, 
                refDate: selectedDate,
                filterProvince,
                filterDistrict
            })
            if (result.success) {
                setTrackingData(result.data)
                setWeekRange(result.weekRange)
                setTotalPages(result.totalPages)
                setTotalItems(result.totalItems)
                setGlobalStats(result.globalStats)
            }
            setLoading(false)
        }
        fetchData()
    }, [page, filterStatus, selectedDate, filterProvince, filterDistrict])


    const filteredData = trackingData // Let's keep it simple with pagination for now

    const formatDate = (isoStr) => {
        if (!isoStr) return ''
        const d = new Date(isoStr)
        return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })
    }

    const customSelectStyles = {
        control: (base, state) => ({
            ...base,
            borderRadius: '0.5rem',
            borderColor: state.isFocused ? '#10b981' : '#e2e8f0',
            boxShadow: state.isFocused ? '0 0 0 2px rgba(16, 185, 129, 0.1)' : 'none',
            '&:hover': {
                borderColor: state.isFocused ? '#10b981' : '#cbd5e1',
            },
            fontSize: '14px',
            minHeight: '38px',
        }),
        option: (base, state) => ({
            ...base,
            backgroundColor: state.isSelected ? '#10b981' : state.isFocused ? '#f0fdf4' : 'transparent',
            color: state.isSelected ? 'white' : '#475569',
            fontSize: '14px',
            '&:active': {
                backgroundColor: '#10b981',
            }
        })
    }

    const StatusBadge = ({ reported }) => (
        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold ${reported ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-400 border border-rose-100'}`}>
            {reported ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                </svg>
            ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                </svg>
            )}
        </span>
    )

    const handleWeeklyExport = async () => {
        try {
            setIsExportingWeekly(true)
            const result = await getWeeklyStaffTracking({ 
                page: 1, // We'll handle this specially on server to maybe return more, or use what we have
                filterStatus, 
                refDate: selectedDate,
                filterProvince,
                filterDistrict
            })

            if (!result.success || !result.allData) {
                alert('ไม่พบข้อมูลสำหรับส่งออก')
                return
            }

            const exportData = result.allData.map(item => ({
                'หน่วยงาน': item.orgName,
                'จังหวัด': item.province,
                'อำเภอ': item.district,
                'ตำบล': item.subDistrict,
                'เวชภัณฑ์': item.reports.inventory ? '✔️' : '❌',
                'ห้องปลอดฝุ่น': item.reports.cleanRoom ? '✔️' : '❌',
                'การดำเนินงาน': item.reports.operations ? '✔️' : '❌',
                'ดูแลเชิงรุก': item.reports.activeCare ? '✔️' : '❌',
                'อุบัติการณ์': item.reports.incidents ? '✔️' : '❌',
                'กลุ่มเสี่ยง': item.reports.vulnerable ? '✔️' : '❌',
                'มาตรการ': item.reports.measures ? '✔️' : '❌',
                'ความสำเร็จ (%)': item.completionRate
            }))

            const ws = XLSX.utils.json_to_sheet(exportData)
            const wb = XLSX.utils.book_new()
            XLSX.utils.book_append_sheet(wb, ws, "Weekly_Tracking")
            XLSX.writeFile(wb, `Weekly_Tracking_${formatDate(weekRange.start)}.xlsx`)
        } catch (error) {
            console.error('Export failed:', error)
            alert('เกิดข้อผิดพลาดในการส่งออก')
        } finally {
            setIsExportingWeekly(false)
        }
    }

    const handleOverallExport = async () => {
        try {
            setIsExportingOverall(true)
            const data = await getOverallTrackingExport()
            if (!data || data.length === 0) {
                alert('ไม่พบข้อมูลสำหรับส่งออก')
                return
            }

            const exportData = data.map(item => ({
                'หน่วยงาน': item.orgName,
                'จังหวัด': item.province,
                'อำเภอ': item.district,
                'ตำบล': item.subDistrict,
                'สถานะการใช้งาน': item.hasEverReported,
                'Active Status': item.status
            }))

            const ws = XLSX.utils.json_to_sheet(exportData)
            const wb = XLSX.utils.book_new()
            XLSX.utils.book_append_sheet(wb, ws, "Overall_Tracking")
            XLSX.writeFile(wb, `Overall_Ever_Reported_${new Date().toLocaleDateString('th-TH').replace(/\//g, '-')}.xlsx`)
        } catch (error) {
            console.error('Export failed:', error)
            alert('เกิดข้อผิดพลาดในการส่งออก')
        } finally {
            setIsExportingOverall(false)
        }
    }

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b border-slate-100 sticky top-0 z-10">
                <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <Link href="/" className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-slate-600">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                            </svg>
                        </Link>
                        <div>
                            <h1 className="text-xl font-bold text-slate-800 leading-tight">ติดตามการบันทึกข้อมูล</h1>
                            <p className="text-xs text-slate-500">รายงานรายสัปดาห์: {formatDate(weekRange.start)} - {formatDate(weekRange.end)}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-medium text-slate-900">{user?.name}</p>
                            <p className="text-xs text-slate-500">{user?.orgName} ({user?.role})</p>
                        </div>
                        <form action={logout}>
                            <button type="submit" className="rounded-lg bg-white px-3 py-2 text-sm font-semibold text-slate-600 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50 hover:text-red-600 transition-colors">
                                ออกจากระบบ
                            </button>
                        </form>
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                {/* Stats Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <p className="text-sm font-medium text-slate-500">หน่วยงานทั้งหมด</p>
                        <p className="text-3xl font-bold text-slate-800">{totalItems}</p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 text-emerald-600">
                        <p className="text-sm font-medium text-slate-500">หน่วยงานที่บันทึกแล้ว</p>
                        <div className="flex items-baseline gap-2">
                            <p className="text-3xl font-bold">{globalStats.totalAtLeastOne}</p>
                            <p className="text-sm font-medium opacity-70">จาก {totalItems} แห่ง</p>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1 font-medium">* อย่างน้อย 1 รายการในสัปดาห์นี้</p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 text-rose-500">
                        <p className="text-sm font-medium text-slate-500">ยังไม่มีการบันทึก</p>
                        <div className="flex items-baseline gap-2">
                            <p className="text-3xl font-bold">{globalStats.totalNotStarted}</p>
                            <p className="text-sm font-medium opacity-70">จาก {totalItems} แห่ง</p>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 mb-6 grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                    <div className="md:col-span-1">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 ml-1">เลือกสัปดาห์ (วันที่ใดก็ได้)</label>
                        <input
                            type="date"
                            className="block w-full py-2 px-3 border border-slate-200 bg-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            value={selectedDate}
                            onChange={(e) => { setSelectedDate(e.target.value); setPage(1); }}
                        />
                    </div>

                    <div className="md:col-span-2 flex flex-col">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 ml-1">กรองสถานะการบันทึก</label>
                        <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-lg border border-slate-100">
                            <button
                                onClick={() => { setFilterStatus('all'); setPage(1); }}
                                className={`flex-1 py-1.5 px-3 rounded-md text-xs font-bold transition-all ${filterStatus === 'all' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                ทั้งหมด
                            </button>
                            <button
                                onClick={() => { setFilterStatus('recorded'); setPage(1); }}
                                className={`flex-1 py-1.5 px-3 rounded-md text-xs font-bold transition-all ${filterStatus === 'recorded' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                บันทึกแล้ว
                            </button>
                            <button
                                onClick={() => { setFilterStatus('pending'); setPage(1); }}
                                className={`flex-1 py-1.5 px-3 rounded-md text-xs font-bold transition-all ${filterStatus === 'pending' ? 'bg-white text-rose-500 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                ยังไม่บันทึก
                            </button>
                        </div>
                    </div>

                    <div className="md:col-span-1">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 ml-1">ค้นหา</label>
                        <input
                            type="text"
                            placeholder="อยู่ระหว่างพัฒนา"
                            className="block w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 cursor-not-allowed opacity-50"
                            disabled
                        />
                    </div>
                    
                    <div className="md:col-span-1">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 ml-1">จังหวัด</label>
                        <Select
                            options={PROVINCES_LIST}
                            value={PROVINCES_LIST.find(p => p.value === filterProvince)}
                            onChange={(opt) => { setFilterProvince(opt.value); setFilterDistrict('all'); setPage(1); }}
                            styles={customSelectStyles}
                            placeholder="เลือกจังหวัด..."
                        />
                    </div>

                    <div className="md:col-span-1">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 ml-1">อำเภอ</label>
                        <Select
                            options={districts}
                            value={districts.find(d => d.value === filterDistrict) || { value: 'all', label: 'ทุกอำเภอ' }}
                            onChange={(opt) => { setFilterDistrict(opt.value); setPage(1); }}
                            styles={customSelectStyles}
                            placeholder="เลือกอำเภอ..."
                            isDisabled={filterProvince === 'all'}
                            isSearchable={true}
                        />
                    </div>
                </div>

                {/* Export Buttons */}
                <div className="flex flex-wrap gap-3 mb-6">
                    <button
                        onClick={handleWeeklyExport}
                        disabled={isExportingWeekly || loading}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50 text-sm font-bold"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                        </svg>
                        {isExportingWeekly ? 'กำลังส่งออก...' : 'ส่งออกรายงานรายสัปดาห์'}
                    </button>
                    <button
                        onClick={handleOverallExport}
                        disabled={isExportingOverall || loading}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 hover:text-emerald-600 transition-colors shadow-sm disabled:opacity-50 text-sm font-bold"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                        </svg>
                        {isExportingOverall ? 'กำลังส่งออก...' : 'ส่งออกรายงานภาพรวม (Active/Inactive)'}
                    </button>
                </div>

                {/* Table */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    {loading ? (
                        <div className="p-20 text-center">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-emerald-500 border-t-transparent mb-4"></div>
                            <p className="text-slate-500">กำลังโหลดข้อมูล...</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-100">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">หน่วยงาน / จังหวัด / อำเภอ</th>
                                        <th className="px-4 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">เวชภัณฑ์</th>
                                        <th className="px-4 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">ห้องปลอดฝุ่น</th>
                                        <th className="px-4 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">การดำเนินงาน</th>
                                        <th className="px-4 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">ดูแลเชิงรุก</th>
                                        <th className="px-4 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">อุบัติการณ์</th>
                                        <th className="px-4 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">กลุ่มเสี่ยง</th>
                                        <th className="px-4 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">มาตรการ</th>
                                        <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">ความสำเร็จ</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-slate-100">
                                    {filteredData.map((item) => (
                                        <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-bold text-slate-900">{item.orgName}</div>
                                                <div className="text-[11px] text-slate-500 font-medium">จ.{item.province} อ.{item.district} ต.{item.subDistrict}</div>
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap text-center">
                                                <StatusBadge reported={item.reports.inventory} />
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap text-center">
                                                <StatusBadge reported={item.reports.cleanRoom} />
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap text-center">
                                                <StatusBadge reported={item.reports.operations} />
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap text-center">
                                                <StatusBadge reported={item.reports.activeCare} />
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap text-center">
                                                <StatusBadge reported={item.reports.incidents} />
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap text-center">
                                                <StatusBadge reported={item.reports.vulnerable} />
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap text-center">
                                                <StatusBadge reported={item.reports.measures} />
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <div className="flex flex-col items-center gap-1">
                                                    <span className={`text-sm font-bold ${item.completionRate === 100 ? 'text-emerald-600' : item.completionRate > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                                                        {item.completionRate}%
                                                    </span>
                                                    <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                        <div 
                                                            className={`h-full rounded-full ${item.completionRate === 100 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                                                            style={{ width: `${item.completionRate}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Pagination Controls */}
                {!loading && totalPages > 1 && (
                    <div className="mt-8 flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                        <p className="text-sm text-slate-500 font-medium order-2 md:order-1">
                            แสดง <span className="text-slate-900 font-bold">{((page - 1) * 20) + 1} - {Math.min(page * 20, totalItems)}</span> จาก <span className="text-slate-900 font-bold">{totalItems}</span> รายการ
                        </p>
                        
                        <div className="flex items-center gap-1 order-1 md:order-2">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors mr-1"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                                </svg>
                            </button>

                            <div className="flex items-center gap-1">
                                {(() => {
                                    const pages = []
                                    const maxVisible = 5
                                    let start = Math.max(1, page - 2)
                                    let end = Math.min(totalPages, start + maxVisible - 1)
                                    
                                    if (end - start < maxVisible - 1) {
                                        start = Math.max(1, end - maxVisible + 1)
                                    }

                                    for (let i = start; i <= end; i++) {
                                        pages.push(
                                            <button
                                                key={i}
                                                onClick={() => setPage(i)}
                                                className={`min-w-[36px] h-9 rounded-lg text-sm font-bold transition-all ${page === i ? 'bg-emerald-500 text-white shadow-md shadow-emerald-200' : 'text-slate-600 hover:bg-slate-50 border border-transparent'}`}
                                            >
                                                {i}
                                            </button>
                                        )
                                    }
                                    return pages
                                })()}
                            </div>

                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors ml-1"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                                </svg>
                            </button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    )
}
