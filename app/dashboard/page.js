'use client';

import { useEffect, useState } from 'react';
import Select from 'react-select';
import { getDashboardStats } from '@/app/actions/dashboard';
import { getProvinces, getDistricts, getSubDistricts } from '@/app/actions/locations';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line
} from 'recharts';

// Color Palette
const COLORS = {
    bg: '#FFFFFF',      // Pure White Background
    card: '#FFFFFF',    // White Card
    primary: '#1F2937', // Dark Gray (Formal)
    secondary: '#E5E7EB', // Light Gray Secondary
    text: '#111827',    // Near Black Text
    accent: '#2563EB',  // Royal Blue Accent
    chart: ['#2563EB', '#4B5563', '#9CA3AF', '#D1D5DB', '#E5E7EB'] // Blue & Grays
};

export default function DashboardPage() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalData, setModalData] = useState({ title: '', list: [], color: 'gray' });

    const openModal = (title, list, color = 'gray') => {
        setModalData({ title, list: list || [], color });
        setIsModalOpen(true);
    };

    // Filter States
    const [provinces, setProvinces] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [subDistricts, setSubDistricts] = useState([]);

    const [selectedProvince, setSelectedProvince] = useState('');
    const [selectedDistrict, setSelectedDistrict] = useState('');
    const [selectedSubDistrict, setSelectedSubDistrict] = useState('');

    // No need to fetch provinces, using hardcoded list
    // useEffect(() => {
    //     async function loadProvinces() {
    //         const res = await getProvinces();
    //         if (res.success) setProvinces(res.data);
    //     }
    //     loadProvinces();
    // }, []);

    useEffect(() => {
        if (selectedProvince) {
            async function loadDistricts() {
                const res = await getDistricts(selectedProvince);
                if (res.success) setDistricts(res.data);
            }
            loadDistricts();
        }
        setDistricts([]);
        // Reset children
        setSelectedDistrict('');
        setSelectedSubDistrict('');
    }, [selectedProvince]);

    useEffect(() => {
        if (selectedDistrict) {
            async function loadSubDistricts() {
                const res = await getSubDistricts(selectedProvince, selectedDistrict);
                if (res.success) setSubDistricts(res.data.map(s => s.subDistrict));
            }
            loadSubDistricts();
        } else {
            setSubDistricts([]);
        }
        setSelectedSubDistrict('');
    }, [selectedDistrict]);

    useEffect(() => {
        async function fetchData() {
            // Pass filters to the action
            const data = await getDashboardStats({
                province: selectedProvince,
                district: selectedDistrict,
                subDistrict: selectedSubDistrict
            });
            setStats(data);
            setLoading(false);
        }
        fetchData();
    }, [selectedProvince, selectedDistrict, selectedSubDistrict]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: COLORS.bg, color: COLORS.primary }}>
                <div className="animate-pulse text-2xl font-semibold">กำลังโหลดข้อมูล...</div>
            </div>
        );
    }

    if (!stats) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: COLORS.bg, color: COLORS.text }}>
                <div className="text-xl">ไม่สามารถโหลดข้อมูลได้</div>
            </div>
        );
    }

    // Data preparation for charts
    const measureData = [
        { name: 'ดำเนินการแล้ว', value: stats.measure?.completed || 0 },
        { name: 'รอดำเนินการ', value: stats.measure?.pending || 0 },
    ];

    const vulnerableData = stats.vulnerable?.byGroup?.map(g => ({
        name: g.name,
        value: g.count
    })) || [];

    const inventoryData = stats.inventory?.byItem?.map(i => ({
        name: i.name,
        stock: i.count
    })) || [];

    const operationData = stats.operation?.byActivity?.map(o => ({
        name: o.name,
        count: o.count
    })) || [];

    const staffIncidentData = stats.staffIncident?.map(s => ({
        name: s.status,
        count: s.count
    })) || [];

    return (
        <div className="min-h-screen p-6 md:p-8" style={{ backgroundColor: COLORS.bg, color: COLORS.text }}>
            <header className="mb-8">
                <h1 className="text-3xl font-bold mb-2" style={{ color: COLORS.accent }}>Dashboard รายงานผลการดำเนินงาน Haze-r2</h1>
                <p className="text-lg opacity-80">ภาพรวมมาตรการ ทรัพยากร และกลุ่มเปราะบาง</p>
            </header>



            {/* 1. Measures and Management Section */}
            <div className="mb-8 p-6 rounded-xl border" style={{ backgroundColor: COLORS.card, borderColor: COLORS.secondary }}>
                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                    <span className="w-2 h-6 bg-blue-600 rounded-full"></span>
                    มาตรการและการจัดการ
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Situation Status */}
                    <div className="bg-gray-50 rounded-lg p-6 border border-gray-100">
                        <h3 className="text-gray-500 font-medium mb-4 uppercase tracking-wider text-sm">สถานการณ์ภาพรวม (จังหวัด)</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div
                                onClick={() => openModal('ภาวะปกติ', stats.situation?.lists?.normal, 'green')}
                                className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-green-500 cursor-pointer hover:shadow-md transition-shadow"
                            >
                                <div className="text-3xl font-bold text-gray-800">{stats.situation?.normal || 0}</div>
                                <div className="text-sm text-gray-500 mt-1">ภาวะปกติ</div>
                            </div>
                            <div
                                onClick={() => openModal('Alert / เฝ้าระวัง', stats.situation?.lists?.alert, 'red')}
                                className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-red-500 cursor-pointer hover:shadow-md transition-shadow"
                            >
                                <div className="text-3xl font-bold text-gray-800">{stats.situation?.alert || 0}</div>
                                <div className="text-sm text-gray-500 mt-1">Alert / เฝ้าระวัง</div>
                            </div>
                        </div>
                    </div>

                    {/* Response Levels */}
                    <div className="bg-gray-50 rounded-lg p-6 border border-gray-100">
                        <h3 className="text-gray-500 font-medium mb-4 uppercase tracking-wider text-sm">ระดับการตอบโต้ (Response Level)</h3>
                        <div className="grid grid-cols-3 gap-4">
                            <div
                                onClick={() => openModal('Response Level 1', stats.situation?.lists?.level1, 'yellow')}
                                className="text-center bg-white p-4 rounded-lg shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                            >
                                <div className="inline-block px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full font-semibold mb-2 text-xs">Response Level 1</div>
                                <div className="text-2xl font-bold text-gray-800">{stats.situation?.level1 || 0}</div>
                                <div className="text-xs text-gray-400 mt-1">จังหวัด</div>
                            </div>
                            <div
                                onClick={() => openModal('Response Level 2', stats.situation?.lists?.level2, 'orange')}
                                className="text-center bg-white p-4 rounded-lg shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                            >
                                <div className="inline-block px-3 py-1 bg-orange-100 text-orange-800 rounded-full font-semibold mb-2 text-xs">Response Level 2</div>
                                <div className="text-2xl font-bold text-gray-800">{stats.situation?.level2 || 0}</div>
                                <div className="text-xs text-gray-400 mt-1">จังหวัด</div>
                            </div>
                            <div
                                onClick={() => openModal('Response Level 3', stats.situation?.lists?.level3, 'red')}
                                className="text-center bg-white p-4 rounded-lg shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                            >
                                <div className="inline-block px-3 py-1 bg-red-100 text-red-800 rounded-full font-semibold mb-2 text-xs">Response Level 3</div>
                                <div className="text-2xl font-bold text-gray-800">{stats.situation?.level3 || 0}</div>
                                <div className="text-xs text-gray-400 mt-1">จังหวัด</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter Section */}
            <div className="mb-8 p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
                <div className="flex flex-col md:flex-row gap-6 items-end">
                    <div className="flex-1 min-w-[240px] w-full">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">จังหวัด</label>
                        <Select
                            placeholder="เลือกจังหวัด"
                            isClearable
                            classNamePrefix="select"
                            options={['พิษณุโลก', 'อุตรดิตถ์', 'ตาก', 'สุโขทัย', 'เพชรบูรณ์'].map(p => ({ value: p, label: p }))}
                            value={selectedProvince ? { value: selectedProvince, label: selectedProvince } : null}
                            onChange={(option) => setSelectedProvince(option ? option.value : '')}
                            styles={{
                                control: (base) => ({
                                    ...base,
                                    borderColor: '#E5E7EB',
                                    borderRadius: '0.5rem',
                                    padding: '2px',
                                    boxShadow: 'none',
                                    '&:hover': {
                                        borderColor: '#3B82F6'
                                    }
                                }),
                                option: (base, state) => ({
                                    ...base,
                                    backgroundColor: state.isSelected ? '#EFF6FF' : state.isFocused ? '#F3F4F6' : 'white',
                                    color: state.isSelected ? '#1D4ED8' : '#374151',
                                    cursor: 'pointer'
                                })
                            }}
                        />
                    </div>
                    <div className="flex-1 min-w-[240px] w-full">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">อำเภอ</label>
                        <Select
                            placeholder={!selectedProvince ? "กรุณาเลือกจังหวัดก่อน" : "เลือกอำเภอ"}
                            isClearable
                            isDisabled={!selectedProvince}
                            classNamePrefix="select"
                            options={districts.map(d => ({ value: d, label: d }))}
                            value={selectedDistrict ? { value: selectedDistrict, label: selectedDistrict } : null}
                            onChange={(option) => setSelectedDistrict(option ? option.value : '')}
                            styles={{
                                control: (base, state) => ({
                                    ...base,
                                    borderColor: '#E5E7EB',
                                    borderRadius: '0.5rem',
                                    padding: '2px',
                                    boxShadow: 'none',
                                    backgroundColor: state.isDisabled ? '#F9FAFB' : 'white',
                                    '&:hover': {
                                        borderColor: state.isDisabled ? '#E5E7EB' : '#3B82F6'
                                    }
                                })
                            }}
                        />
                    </div>
                    <div className="flex-1 min-w-[240px] w-full">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">ตำบล</label>
                        <Select
                            placeholder={!selectedDistrict ? "กรุณาเลือกอำเภอก่อน" : "เลือกตำบล"}
                            isClearable
                            isDisabled={!selectedDistrict}
                            classNamePrefix="select"
                            options={subDistricts.map(s => ({ value: s, label: s }))}
                            value={selectedSubDistrict ? { value: selectedSubDistrict, label: selectedSubDistrict } : null}
                            onChange={(option) => setSelectedSubDistrict(option ? option.value : '')}
                            styles={{
                                control: (base, state) => ({
                                    ...base,
                                    borderColor: '#E5E7EB',
                                    borderRadius: '0.5rem',
                                    padding: '2px',
                                    boxShadow: 'none',
                                    backgroundColor: state.isDisabled ? '#F9FAFB' : 'white',
                                    '&:hover': {
                                        borderColor: state.isDisabled ? '#E5E7EB' : '#3B82F6'
                                    }
                                })
                            }}
                        />
                    </div>
                    <div className="pb-1 w-full md:w-auto">
                        <button
                            onClick={() => {
                                setSelectedProvince('');
                                setSelectedDistrict('');
                                setSelectedSubDistrict('');
                            }}
                            className="w-full md:w-auto px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-sm font-medium transition-colors h-[42px] flex items-center justify-center gap-2"
                        >
                            <span>ล้างตัวกรอง</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* 2. Key Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <SummaryCard
                    title="กลุ่มเปราะบางทั้งหมด"
                    value={stats.vulnerable?.total?.toLocaleString()}
                    subtitle="ประชากรที่บันทึกในระบบ"
                />
                <SummaryCard
                    title="คลังเวชภัณฑ์/อุปกรณ์"
                    value={stats.inventory?.totalStock?.toLocaleString()}
                    subtitle="ชิ้นในคลัง"
                />
                <SummaryCard
                    title="มาตรการที่ดำเนินการ"
                    value={`${stats.measure?.completed}/${stats.measure?.total}`}
                    subtitle={`ดำเนินการแล้ว ${Math.round((stats.measure?.completed / (stats.measure?.total || 1)) * 100)}%`}
                />
                <SummaryCard
                    title="ห้องปลอดฝุ่น"
                    value={stats.cleanRoom?.targetRoomCount?.toLocaleString()}
                    subtitle={`ผ่านมาตรฐาน ${stats.cleanRoom?.passedStandard?.toLocaleString() || 0} ห้อง`}
                />
            </div>

            {/* 3. Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">

                {/* Vulnerable Groups Chart */}
                <ChartCard title="การกระจายตัวของกลุ่มเปราะบาง">
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={vulnerableData} layout="vertical" margin={{ left: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={COLORS.secondary} />
                            <XAxis type="number" stroke={COLORS.text} fontSize={12} />
                            <YAxis dataKey="name" type="category" width={100} stroke={COLORS.text} fontSize={12} />
                            <Tooltip
                                contentStyle={{ backgroundColor: COLORS.card, borderColor: COLORS.secondary, borderRadius: '8px' }}
                            />
                            <Bar dataKey="value" fill={COLORS.primary} radius={[0, 4, 4, 0]}>
                                {vulnerableData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS.chart[index % COLORS.chart.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>

                {/* Inventory Chart */}
                <ChartCard title="ปริมาณคงคลังเวชภัณฑ์">
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={inventoryData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={100}
                                paddingAngle={5}
                                dataKey="stock"
                            >
                                {inventoryData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS.chart[index % COLORS.chart.length]} />
                                ))}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: COLORS.card, borderColor: COLORS.secondary, borderRadius: '8px' }} />
                            <Legend verticalAlign="bottom" height={36} iconType="circle" />
                        </PieChart>
                    </ResponsiveContainer>
                </ChartCard>

            </div>

            {/* 4. Detailed Stats Grid */}
            <div className="mb-8 p-6 rounded-xl border" style={{ backgroundColor: COLORS.card, borderColor: COLORS.secondary }}>
                <h2 className="text-xl font-semibold mb-6">การดูแลเชิงรุกและการสนับสนุน</h2>

                <div className="grid grid-cols-1 gap-8">
                    {/* Proactive Operations (formerly Active Care) */}
                    <div>
                        <h3 className="text-lg font-medium mb-4 opacity-80">การปฏิบัติการเชิงรุก</h3>
                        <div className="grid grid-cols-3 gap-4 text-center">
                            <StatBox label="ลงเยี่ยมบ้าน (หลัง)" value={stats.activeCare?.households} />
                            <StatBox label="คัดกรองประชาชน (คน)" value={stats.activeCare?.people} />
                            <StatBox label="พบกลุ่มเสี่ยง (คน)" value={stats.activeCare?.riskGroups} />
                        </div>
                    </div>

                    {/* Local Admin Support */}
                    <div>
                        <h3 className="text-lg font-medium mb-4 opacity-80">การสนับสนุนจาก อปท.</h3>
                        <div className="grid grid-cols-2 gap-4 text-center">
                            <StatBox label="จำนวนแห่ง" value={stats.localAdmin?.orgCount} />
                            <StatBox label="สนับสนุนหน้ากาก (ชิ้น)" value={stats.localAdmin?.maskSupport} />
                            <StatBox label="สนับสนุนมุ้ง (หลัง)" value={stats.localAdmin?.dustNetSupport} />
                            <StatBox label="สนับสนุนห้องปลอดฝุ่น (แห่ง)" value={stats.localAdmin?.cleanRoomSupport} />
                        </div>
                    </div>
                </div>
            </div>

            {/* 5. Incidents and Operations */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Dust Nets Block */}
                <div className="p-6 rounded-xl border col-span-1 md:col-span-2" style={{ backgroundColor: COLORS.card, borderColor: COLORS.secondary }}>
                    <h3 className="text-lg font-semibold mb-6">มุ้งสู้ฝุ่น</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                        <StatBox
                            label="ผู้ป่วยติดเตียงที่รับมอบ (คน)"
                            value={stats.operation?.detailed?.filter(o => o.target?.includes('ติดเตียง') && o.activity === 'มุ้งสู้ฝุ่น').reduce((acc, curr) => acc + curr.amount, 0) || 0}
                        />
                        <StatBox
                            label="มุ้งที่มอบให้ประชาชน (หลัง)"
                            value={stats.operation?.detailed?.filter(o => o.target === 'ประชาชนทั่วไป' && o.activity === 'มุ้งสู้ฝุ่น').reduce((acc, curr) => acc + curr.amount, 0) || 0}
                        />
                        <StatBox
                            label="มุ้งที่ อปท. สนับสนุน (หลัง)"
                            value={stats.localAdmin?.dustNetSupport || 0}
                        />
                    </div>
                </div>

                {/* PPE Support Block */}
                <div className="p-6 rounded-xl border col-span-1 md:col-span-2" style={{ backgroundColor: COLORS.card, borderColor: COLORS.secondary }}>
                    <h3 className="text-lg font-semibold mb-6">อุปกรณ์ป้องกัน (PPE)</h3>
                    <div className="overflow-hidden rounded-lg border border-gray-200 shadow-sm">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-100 text-gray-700 font-semibold border-b border-gray-200">
                                <tr>
                                    <th className="py-3 px-4 font-semibold text-gray-900 border-r border-gray-200 last:border-r-0">กลุ่มเป้าหมาย</th>
                                    <th className="py-3 px-4 text-center font-semibold text-gray-900 border-r border-gray-200 last:border-r-0">Surgical Mask</th>
                                    <th className="py-3 px-4 text-center font-semibold text-gray-900 border-r border-gray-200 last:border-r-0">N95</th>
                                    <th className="py-3 px-4 text-center font-semibold text-gray-900 border-r border-gray-200 last:border-r-0">Carbon Mask</th>
                                    <th className="py-3 px-4 text-center font-semibold text-gray-900">Cloth Mask</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white">
                                {[
                                    { id: 'ประชาชนทั่วไป', label: 'ประชาชนทั่วไป' },
                                    { id: 'เด็กเล็ก', label: 'เด็กเล็ก' },
                                    { id: 'หญิงตั้งครรภ์', label: 'หญิงตั้งครรภ์' },
                                    { id: 'ผู้สูงอายุ', label: 'ผู้สูงอายุ' },
                                    { id: 'ติดเตียง', label: 'ผู้ป่วยติดเตียง' },
                                    { id: 'โรคหัวใจ', label: 'ผู้ป่วยโรคหัวใจ' },
                                    { id: 'โรคทางเดินหายใจ', label: 'ผู้ป่วยโรคทางเดินหายใจ' },
                                ].map((group, index) => {
                                    const groupStats = stats.operation?.detailed?.filter(o => o.target?.includes(group.id) && o.activity !== 'มุ้งสู้ฝุ่น') || [];
                                    const getAmount = (keyword) => groupStats.filter(o => o.item?.toLowerCase().includes(keyword)).reduce((acc, curr) => acc + curr.amount, 0);

                                    return (
                                        <tr key={group.id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors`}>
                                            <td className="py-3 px-4 font-medium text-gray-900 border-r border-gray-200 last:border-r-0">{group.label}</td>
                                            <td className="py-3 px-4 text-center border-r border-gray-200 last:border-r-0">
                                                {getAmount('surgical') + getAmount('หน้ากากอนามัย') > 0 ? (
                                                    <span className="font-bold text-lg text-blue-600">
                                                        {(getAmount('surgical') + getAmount('หน้ากากอนามัย')).toLocaleString()}
                                                    </span>
                                                ) : <span className="text-gray-300">-</span>}
                                            </td>
                                            <td className="py-3 px-4 text-center border-r border-gray-200 last:border-r-0">
                                                {getAmount('n95') > 0 ? (
                                                    <span className="font-bold text-lg text-blue-600">
                                                        {getAmount('n95').toLocaleString()}
                                                    </span>
                                                ) : <span className="text-gray-300">-</span>}
                                            </td>
                                            <td className="py-3 px-4 text-center border-r border-gray-200 last:border-r-0">
                                                {getAmount('carbon') + getAmount('คาร์บอน') > 0 ? (
                                                    <span className="font-bold text-lg text-blue-600">
                                                        {(getAmount('carbon') + getAmount('คาร์บอน')).toLocaleString()}
                                                    </span>
                                                ) : <span className="text-gray-300">-</span>}
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                {getAmount('cloth') + getAmount('ผ้า') > 0 ? (
                                                    <span className="font-bold text-lg text-blue-600">
                                                        {(getAmount('cloth') + getAmount('ผ้า')).toLocaleString()}
                                                    </span>
                                                ) : <span className="text-gray-300">-</span>}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-opacity-40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[80vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
                        {/* Dynamic Header */}
                        <div className={`p-6 border-b flex justify-between items-center ${modalData.color === 'green' ? 'bg-green-50 border-green-100 text-green-800' :
                            modalData.color === 'red' ? 'bg-red-50 border-red-100 text-red-800' :
                                modalData.color === 'yellow' ? 'bg-yellow-50 border-yellow-100 text-yellow-800' :
                                    modalData.color === 'orange' ? 'bg-orange-50 border-orange-100 text-orange-800' :
                                        'bg-gray-50 border-gray-100 text-gray-800'
                            }`}>
                            <h3 className="text-xl font-bold">{modalData.title}</h3>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className={`transition-colors ${modalData.color === 'green' ? 'text-green-600 hover:text-green-800' :
                                    modalData.color === 'red' ? 'text-red-600 hover:text-red-800' :
                                        'text-gray-400 hover:text-gray-600'
                                    }`}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto">
                            {modalData.list.length > 0 ? (
                                <ul className="space-y-2">
                                    {modalData.list.map((province, idx) => (
                                        <li key={idx} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                                            <span className={`w-2.5 h-2.5 rounded-full ${modalData.color === 'green' ? 'bg-green-500' :
                                                modalData.color === 'red' ? 'bg-red-500' :
                                                    modalData.color === 'yellow' ? 'bg-yellow-500' :
                                                        modalData.color === 'orange' ? 'bg-orange-500' :
                                                            'bg-gray-500'
                                                }`}></span>
                                            <span className="text-gray-700 font-medium">{province}</span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    ไม่พบข้อมูลจังหวัดในกลุ่มนี้
                                </div>
                            )}
                        </div>
                        <div className="p-4 border-t border-gray-100 bg-gray-50 text-right">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors"
                            >
                                ปิด
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}

// Sub-components for cleaner code
function SummaryCard({ title, value, subtitle }) {
    return (
        <div className="p-6 rounded-xl shadow-sm border transition-transform hover:-translate-y-1 duration-300" style={{ backgroundColor: COLORS.card, borderColor: COLORS.secondary }}>
            <h3 className="text-sm uppercase tracking-wide opacity-60 mb-1">{title}</h3>
            <div className="text-3xl font-bold mb-1" style={{ color: '#4A4742' }}>{value || 0}</div>
            <div className="text-xs opacity-70">{subtitle}</div>
        </div>
    );
}

function ChartCard({ title, children }) {
    return (
        <div className="p-6 rounded-xl border shadow-sm" style={{ backgroundColor: COLORS.bg, borderColor: COLORS.secondary }}>
            <h3 className="text-lg font-semibold mb-6 text-center opacity-80">{title}</h3>
            {children}
        </div>
    );
}



function StatBox({ label, value }) {
    return (
        <div className="p-3 rounded-lg border" style={{ backgroundColor: '#F3F4F6', borderColor: COLORS.secondary }}>
            <div className="text-2xl font-bold" style={{ color: COLORS.primary }}>{value?.toLocaleString() || 0}</div>
            <div className="text-xs opacity-70">{label}</div>
        </div>
    )
}


