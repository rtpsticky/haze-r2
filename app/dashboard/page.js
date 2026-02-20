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

    const vulnerableData = stats.vulnerable?.byGroup?.filter(g => g.name !== 'BEDRIDDEN_OP').map(g => ({
        name: g.name,
        value: g.count
    })) || [];

    const vulnerableTotal = vulnerableData.reduce((acc, curr) => acc + curr.value, 0);

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

    const cleanRoomOrder = [
        'โรงพยาบาลศูนย์', 'โรงพยาบาลทั่วไป', 'โรงพยาบาลชุมชน',
        'โรงพยาบาลส่งเสริมสุขภาพตำบล', 'โรงพยาบาลเอกชน',
        'โรงพยาบาลสังกัดกระทรวงกลาโหม', 'โรงพยาบาลมหาวิทยาลัย',
        'สสจ./สสอ.', 'หน่วยงานภาครัฐ (อบจ/อบต./สนง.ต่างๆ)',
        'ศูนย์ดูแลผู้สูงอายุ'
    ];

    const VULNERABLE_COLORS = [
        '#EC4899', // Pink 500
        '#8B5CF6', // Violet 500
        '#3B82F6', // Blue 500
        '#10B981', // Emerald 500
        '#F59E0B', // Amber 500
        '#EF4444', // Red 500
        '#6366F1', // Indigo 500
        '#14B8A6', // Teal 500
    ];

    const EXTENDED_COLORS = [
        '#2563EB', '#3B82F6', '#60A5FA', '#93C5FD', // Blues
        '#059669', '#10B981', '#34D399', '#6EE7B7', // Greens
        '#D97706', '#F59E0B' // Yellows/Oranges
    ];

    const cleanRoomData = stats.cleanRoom?.byType ? cleanRoomOrder.map(type => {
        const found = stats.cleanRoom.byType.find(t => t.name === type);
        return {
            name: type,
            value: found?.total || 0,
            details: found || { standard1: 0, standard2: 0, standard3: 0 }
        };
    }).filter(d => d.value > 0) : [];

    // Calculate total from chart data to ensure consistency
    const cleanRoomTotal = cleanRoomData.reduce((acc, curr) => acc + curr.value, 0);

    const handleCleanRoomClick = (data) => {
        if (!data || !data.details) return;
        const list = [
            `แบบ 1: ${data.details.standard1?.toLocaleString() || 0} ห้อง`,
            `แบบ 2: ${data.details.standard2?.toLocaleString() || 0} ห้อง`,
            `แบบ 3: ${data.details.standard3?.toLocaleString() || 0} ห้อง`
        ];
        openModal(`${data.name} (รูปแบบมาตรฐาน)`, list, 'green');
    };

    // Prepare PPE Distribution Data (By Target Group)
    const ppeDistribution = stats.operation?.detailed?.filter(o => o.activity !== 'มุ้งสู้ฝุ่น') || [];

    // Map English Enum to Thai Labels
    const ppeTargetGroups = [
        { id: 'GENERAL_PUBLIC', label: 'ประชาชนทั่วไป' },
        { id: 'SMALL_CHILDREN', label: 'เด็กเล็ก' },
        { id: 'PREGNANT_WOMEN', label: 'หญิงตั้งครรภ์' },
        { id: 'ELDERLY', label: 'ผู้สูงอายุ' },
        { id: 'BEDRIDDEN', label: 'ผู้ป่วยติดเตียง' },
        { id: 'HEART_DISEASE', label: 'ผู้ป่วยโรคหัวใจ' },
        { id: 'RESPIRATORY_DISEASE', label: 'ผู้ป่วยโรคทางเดินหายใจ' }
    ];

    const ppeByTarget = {};
    // Init keys
    [...new Set(ppeTargetGroups.map(g => g.label))].forEach(label => {
        ppeByTarget[label] = { total: 0, types: {} };
    });
    // Init 'Others'
    ppeByTarget['อื่นๆ'] = { total: 0, types: {} };

    let ppeTotal = 0;

    ppeDistribution.forEach(item => {
        const target = item.target || '';
        // Match exact or partial? DB uses exact strings like 'GENERAL_PUBLIC'.
        const group = ppeTargetGroups.find(g => target === g.id || target.includes(g.id));

        ppeTotal += item.amount;

        const label = group ? group.label : 'อื่นๆ';

        const name = item.item?.toLowerCase() || '';
        let type = 'อื่นๆ';
        if (name.includes('surgical') || name.includes('หน้ากากอนามัย')) type = 'Surgical Mask';
        else if (name.includes('n95')) type = 'N95';
        else if (name.includes('carbon') || name.includes('คาร์บอน')) type = 'Carbon Mask';
        else if (name.includes('cloth') || name.includes('ผ้า')) type = 'Cloth Mask';

        if (!ppeByTarget[label]) ppeByTarget[label] = { total: 0, types: {} }; // Safety
        ppeByTarget[label].total += item.amount;
        if (!ppeByTarget[label].types[type]) ppeByTarget[label].types[type] = 0;
        ppeByTarget[label].types[type] += item.amount;
    });

    // Map ordered labels to chart data
    const orderedLabels = [...new Set(ppeTargetGroups.map(g => g.label)), 'อื่นๆ'];
    const ppeChartData = orderedLabels.map(label => ({
        name: label,
        value: ppeByTarget[label]?.total || 0,
        details: ppeByTarget[label]?.types || {}
    })).filter(d => d.value > 0);

    const handlePPEClick = (data) => {
        if (!data || !data.details) return;
        const list = Object.entries(data.details).map(([type, count]) => `${type}: ${count.toLocaleString()} ชิ้น`);
        openModal(`${data.name} (รายการ PPE)`, list, 'orange');
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 p-4 md:p-8 font-sarabun">
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-3xl md:text-4xl font-bold text-slate-800 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                        Dashboard รายงานผลการดำเนินงาน
                    </h1>
                    <p className="text-slate-500 mt-2 text-lg">ภาพรวมมาตรการ ทรัพยากร และกลุ่มเปราะบาง (Haze-r2)</p>
                </div>
                <div className="text-sm text-slate-400 bg-white px-3 py-1 rounded-full shadow-sm border border-slate-100">
                    ข้อมูลล่าสุด: {new Date().toLocaleDateString('th-TH')}
                </div>
            </header>



            {/* 1. Measures and Management Section */}
            <section className="mb-8">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold text-slate-800">มาตรการและการจัดการ</h2>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Situation Status */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                        <h3 className="text-slate-500 font-semibold mb-4 uppercase tracking-wider text-xs">สถานการณ์ภาพรวม (จังหวัด)</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div
                                onClick={() => openModal('ภาวะปกติ', stats.situation?.lists?.normal, 'green')}
                                className="group cursor-pointer p-4 rounded-xl bg-green-50/50 border border-green-100 hover:border-green-300 transition-all hover:shadow-md"
                            >
                                <div className="text-3xl font-bold text-green-700 group-hover:scale-110 transition-transform origin-left">{stats.situation?.normal || 0}</div>
                                <div className="text-sm text-green-600 mt-1 font-medium">ภาวะปกติ</div>
                            </div>
                            <div
                                onClick={() => openModal('Alert / เฝ้าระวัง', stats.situation?.lists?.alert, 'red')}
                                className="group cursor-pointer p-4 rounded-xl bg-red-50/50 border border-red-100 hover:border-red-300 transition-all hover:shadow-md"
                            >
                                <div className="text-3xl font-bold text-red-600 group-hover:scale-110 transition-transform origin-left">{stats.situation?.alert || 0}</div>
                                <div className="text-sm text-red-500 mt-1 font-medium">Alert / เฝ้าระวัง</div>
                            </div>
                        </div>
                    </div>

                    {/* Response Levels */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                        <h3 className="text-slate-500 font-semibold mb-4 uppercase tracking-wider text-xs">ระดับการตอบโต้ (Response Level)</h3>
                        <div className="grid grid-cols-3 gap-4">
                            <div
                                onClick={() => openModal('Response Level 1', stats.situation?.lists?.level1, 'yellow')}
                                className="cursor-pointer p-4 rounded-xl bg-yellow-50/50 border border-yellow-100 hover:border-yellow-300 transition-all hover:shadow-md text-center"
                            >
                                <div className="bg-yellow-100 text-yellow-700 text-xs font-bold px-2 py-1 rounded-full inline-block mb-2">ระดับ 1</div>
                                <div className="text-2xl font-bold text-slate-800">{stats.situation?.level1 || 0}</div>
                                <div className="text-xs text-slate-400 mt-1">จังหวัด</div>
                            </div>
                            <div
                                onClick={() => openModal('Response Level 2', stats.situation?.lists?.level2, 'orange')}
                                className="cursor-pointer p-4 rounded-xl bg-orange-50/50 border border-orange-100 hover:border-orange-300 transition-all hover:shadow-md text-center"
                            >
                                <div className="bg-orange-100 text-orange-700 text-xs font-bold px-2 py-1 rounded-full inline-block mb-2">ระดับ 2</div>
                                <div className="text-2xl font-bold text-slate-800">{stats.situation?.level2 || 0}</div>
                                <div className="text-xs text-slate-400 mt-1">จังหวัด</div>
                            </div>
                            <div
                                onClick={() => openModal('Response Level 3', stats.situation?.lists?.level3, 'red')}
                                className="cursor-pointer p-4 rounded-xl bg-red-50/50 border border-red-100 hover:border-red-300 transition-all hover:shadow-md text-center"
                            >
                                <div className="bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded-full inline-block mb-2">ระดับ 3</div>
                                <div className="text-2xl font-bold text-slate-800">{stats.situation?.level3 || 0}</div>
                                <div className="text-xs text-slate-400 mt-1">จังหวัด</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Filter Section */}
            <div className="mb-8 p-6 bg-white rounded-2xl shadow-sm border border-slate-100">
                <div className="flex flex-col lg:flex-row gap-6 items-end">
                    <div className="flex-1 w-full">
                        <label className="block text-sm font-semibold text-slate-600 mb-2">จังหวัด</label>
                        <Select
                            placeholder="เลือกจังหวัด"
                            isClearable
                            classNamePrefix="select"
                            options={['พิษณุโลก', 'อุตรดิตถ์', 'ตาก', 'สุโขทัย', 'เพชรบูรณ์'].map(p => ({ value: p, label: p }))}
                            value={selectedProvince ? { value: selectedProvince, label: selectedProvince } : null}
                            onChange={(option) => setSelectedProvince(option ? option.value : '')}
                            styles={{
                                menu: (base) => ({ ...base, zIndex: 9999 }),
                                control: (base, state) => ({
                                    ...base,
                                    borderRadius: '0.75rem',
                                    borderColor: state.isFocused ? '#3B82F6' : '#E2E8F0',
                                    boxShadow: 'none',
                                    padding: '4px',
                                    '&:hover': { borderColor: '#94A3B8' }
                                }),
                                option: (base, state) => ({
                                    ...base,
                                    backgroundColor: state.isSelected ? '#EFF6FF' : state.isFocused ? '#F8FAFC' : 'white',
                                    color: state.isSelected ? '#1D4ED8' : '#334155',
                                })
                            }}
                        />
                    </div>
                    <div className="flex-1 w-full">
                        <label className="block text-sm font-semibold text-slate-600 mb-2">อำเภอ</label>
                        <Select
                            placeholder={!selectedProvince ? "กรุณาเลือกจังหวัดก่อน" : "เลือกอำเภอ"}
                            isClearable
                            isDisabled={!selectedProvince}
                            classNamePrefix="select"
                            options={districts.map(d => ({ value: d, label: d }))}
                            value={selectedDistrict ? { value: selectedDistrict, label: selectedDistrict } : null}
                            onChange={(option) => setSelectedDistrict(option ? option.value : '')}
                            styles={{
                                menu: (base) => ({ ...base, zIndex: 9999 }),
                                control: (base, state) => ({
                                    ...base,
                                    borderRadius: '0.75rem',
                                    borderColor: state.isFocused ? '#3B82F6' : '#E2E8F0',
                                    backgroundColor: state.isDisabled ? '#F1F5F9' : 'white',
                                    boxShadow: 'none',
                                    padding: '4px',
                                    '&:hover': { borderColor: state.isDisabled ? '#E2E8F0' : '#94A3B8' }
                                })
                            }}
                        />
                    </div>
                    <div className="flex-1 w-full">
                        <label className="block text-sm font-semibold text-slate-600 mb-2">ตำบล</label>
                        <Select
                            placeholder={!selectedDistrict ? "กรุณาเลือกอำเภอก่อน" : "เลือกตำบล"}
                            isClearable
                            isDisabled={!selectedDistrict}
                            classNamePrefix="select"
                            options={subDistricts.map(s => ({ value: s, label: s }))}
                            value={selectedSubDistrict ? { value: selectedSubDistrict, label: selectedSubDistrict } : null}
                            onChange={(option) => setSelectedSubDistrict(option ? option.value : '')}
                            styles={{
                                menu: (base) => ({ ...base, zIndex: 9999 }),
                                control: (base, state) => ({
                                    ...base,
                                    borderRadius: '0.75rem',
                                    borderColor: state.isFocused ? '#3B82F6' : '#E2E8F0',
                                    backgroundColor: state.isDisabled ? '#F1F5F9' : 'white',
                                    boxShadow: 'none',
                                    padding: '4px',
                                    '&:hover': { borderColor: state.isDisabled ? '#E2E8F0' : '#94A3B8' }
                                })
                            }}
                        />
                    </div>
                    <div className="w-full lg:w-auto">
                        <button
                            onClick={() => {
                                setSelectedProvince('');
                                setSelectedDistrict('');
                                setSelectedSubDistrict('');
                            }}
                            className="w-full lg:w-auto px-6 h-[46px] bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-sm font-semibold transition-all hover:shadow-sm active:scale-95 flex items-center justify-center gap-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            ล้างตัวกรอง
                        </button>
                    </div>
                </div>
            </div>


            {/* 2. Vulnerable Group Section */}
            < section className="mb-8 p-6 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden relative" >
                <div className="absolute top-0 right-0 w-32 h-32 bg-pink-50 rounded-bl-full -mr-8 -mt-8 opacity-50"></div>
                <div className="flex items-center gap-3 mb-8 relative z-10">
                    <div className="p-2 bg-pink-100 rounded-lg text-pink-600">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold text-slate-800">กลุ่มเปราะบาง</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center relative z-10">
                    {/* Total Count */}
                    <div className="text-center p-8 bg-pink-50/50 rounded-2xl border border-pink-100">
                        <h3 className="text-lg text-pink-800 font-semibold mb-4">จำนวนทั้งหมด</h3>
                        <div className="text-5xl font-extrabold text-pink-600 mb-2 tracking-tight">
                            {vulnerableTotal.toLocaleString()}
                        </div>
                        <div className="text-slate-500 font-medium">คน</div>
                    </div>
                    {/* Donut Chart */}
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={vulnerableData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={70}
                                    outerRadius={110}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {vulnerableData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={VULNERABLE_COLORS[index % VULNERABLE_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'white', borderColor: '#E5E7EB', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    itemStyle={{ color: '#374151' }}
                                />
                                <Legend verticalAlign="middle" align="right" layout="vertical" iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </section >

            {/* 3. Resources and Locations Section */}
            < section className="mb-8 p-6 bg-white rounded-2xl shadow-sm border border-slate-100" >
                <div className="flex items-center gap-3 mb-8">
                    <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold text-slate-800">ทรัพยากรและสถานที่</h2>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
                    {/* Inventory Stats */}
                    <div className="px-4">
                        <h3 className="text-slate-500 font-semibold mb-6 flex items-center gap-2">
                            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                            หน้ากากอนามัย
                        </h3>
                        <div className="text-center mb-6">
                            <div className="text-4xl font-bold text-blue-600">{stats.inventory?.totalStock?.toLocaleString()}</div>
                            <div className="text-sm text-slate-400 mt-1">จำนวนคงเหลือ (ชิ้น)</div>
                        </div>
                        <div className="h-48">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={inventoryData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={50}
                                        outerRadius={70}
                                        paddingAngle={5}
                                        dataKey="stock"
                                    >
                                        {inventoryData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS.chart[index % COLORS.chart.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Clean Room Stats */}
                    <div className="px-4 pt-8 lg:pt-0">
                        <h3 className="text-slate-500 font-semibold mb-6 flex items-center gap-2">
                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                            ห้องปลอดฝุ่น (Clean Room)
                        </h3>
                        <div className="text-center mb-6">
                            <div className="text-4xl font-bold text-green-600">{cleanRoomTotal.toLocaleString()}</div>
                            <div className="text-sm text-slate-400 mt-1">จำนวนห้องทั้งหมด (ห้อง)</div>
                        </div>
                        <div className="h-48">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={cleanRoomData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={50}
                                        outerRadius={70}
                                        paddingAngle={5}
                                        dataKey="value"
                                        onClick={(data) => handleCleanRoomClick(data.payload)}
                                        cursor="pointer"
                                    >
                                        {cleanRoomData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={EXTENDED_COLORS[index % EXTENDED_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* PPE Stats */}
                    <div className="px-4 pt-8 lg:pt-0">
                        <h3 className="text-slate-500 font-semibold mb-6 flex items-center gap-2">
                            <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                            แจกจ่าย PPE
                        </h3>
                        <div className="text-center mb-6">
                            <div className="text-4xl font-bold text-orange-600">{ppeTotal.toLocaleString()}</div>
                            <div className="text-sm text-slate-400 mt-1">แจกจ่ายแล้ว (ชิ้น)</div>
                        </div>
                        <div className="h-48">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={ppeChartData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={50}
                                        outerRadius={70}
                                        paddingAngle={5}
                                        dataKey="value"
                                        onClick={(data) => handlePPEClick(data.payload)}
                                        cursor="pointer"
                                    >
                                        {ppeChartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={EXTENDED_COLORS[index % EXTENDED_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </section >

            {/* 4. Operations and Support Grid */}
            < div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8" >
                {/* Proactive Care */}
                < section className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6" >
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-slate-800">การปฏิบัติการเชิงรุก</h2>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="text-center p-4 bg-purple-50 rounded-xl border border-purple-100">
                            <div className="text-2xl font-bold text-purple-700">{stats.activeCare?.households?.toLocaleString() || 0}</div>
                            <div className="text-xs text-purple-600 font-medium mt-1">เยี่ยมบ้าน (หลัง)</div>
                        </div>
                        <div className="text-center p-4 bg-purple-50 rounded-xl border border-purple-100">
                            <div className="text-2xl font-bold text-purple-700">{stats.activeCare?.people?.toLocaleString() || 0}</div>
                            <div className="text-xs text-purple-600 font-medium mt-1">คัดกรอง (คน)</div>
                        </div>
                        <div className="text-center p-4 bg-purple-50 rounded-xl border border-purple-100">
                            <div className="text-2xl font-bold text-purple-700">{stats.activeCare?.riskGroups?.toLocaleString() || 0}</div>
                            <div className="text-xs text-purple-600 font-medium mt-1">พบกลุ่มเสี่ยง</div>
                        </div>
                    </div>
                </section >

                {/* Local Admin Support */}
                < section className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6" >
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-teal-100 rounded-lg text-teal-600">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-slate-800">การสนับสนุนจาก อปท.</h2>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-teal-50 rounded-xl border border-teal-100 flex flex-col justify-center items-center">
                            <div className="text-3xl font-bold text-teal-700">{stats.localAdmin?.orgCount?.toLocaleString() || 0}</div>
                            <div className="text-sm text-teal-600 mt-1">จำนวนแห่ง</div>
                        </div>
                        <div className="grid grid-rows-3 gap-2 w-full">
                            <div className="flex justify-between items-center px-3 py-2 bg-white rounded-lg border border-teal-100/50 shadow-sm">
                                <span className="text-xs text-slate-500">หน้ากาก</span>
                                <span className="font-bold text-teal-700">{stats.localAdmin?.maskSupport?.toLocaleString() || 0}</span>
                            </div>
                            <div className="flex justify-between items-center px-3 py-2 bg-white rounded-lg border border-teal-100/50 shadow-sm">
                                <span className="text-xs text-slate-500">มุ้งสู้ฝุ่น</span>
                                <span className="font-bold text-teal-700">{stats.localAdmin?.dustNetSupport?.toLocaleString() || 0}</span>
                            </div>
                            <div className="flex justify-between items-center px-3 py-2 bg-white rounded-lg border border-teal-100/50 shadow-sm">
                                <span className="text-xs text-slate-500">ห้องปลอดฝุ่น</span>
                                <span className="font-bold text-teal-700">{stats.localAdmin?.cleanRoomSupport?.toLocaleString() || 0}</span>
                            </div>
                        </div>
                    </div>
                </section >
            </div >

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-12">
                {/* Dust Nets */}
                <section className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-cyan-100 rounded-lg text-cyan-600">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-slate-800">มุ้งสู้ฝุ่น</h2>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-center">
                        <div className="p-4 bg-cyan-50 rounded-xl border border-cyan-100">
                            <div className="text-2xl font-bold text-cyan-700">
                                {stats.operation?.detailed?.filter(o => o.target?.includes('BEDRIDDEN') && o.activity === 'DUST_NET').reduce((acc, curr) => acc + curr.amount, 0)?.toLocaleString() || 0}
                            </div>
                            <div className="text-xs text-cyan-600 mt-1">ผู้ป่วยติดเตียง (คน)</div>
                        </div>
                        <div className="p-4 bg-cyan-50 rounded-xl border border-cyan-100">
                            <div className="text-2xl font-bold text-cyan-700">
                                {stats.operation?.detailed?.filter(o => o.target === 'PATIENTS' && o.activity === 'DUST_NET').reduce((acc, curr) => acc + curr.amount, 0)?.toLocaleString() || 0}
                            </div>
                            <div className="text-xs text-cyan-600 mt-1">ประชาชน (หลัง)</div>
                        </div>
                        <div className="p-4 bg-cyan-50 rounded-xl border border-cyan-100">
                            <div className="text-2xl font-bold text-cyan-700">
                                {stats.localAdmin?.dustNetSupport?.toLocaleString() || 0}
                            </div>
                            <div className="text-xs text-cyan-600 mt-1">อปท. สนับสนุน</div>
                        </div>
                    </div>
                </section>

                {/* Staff Incidents */}
                <section className="bg-red-50 rounded-2xl shadow-sm border border-red-100 p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-red-100 rounded-bl-full -mr-4 -mt-4 opacity-50"></div>
                    <div className="flex items-center gap-3 mb-6 relative z-10">
                        <div className="p-2 bg-red-200 rounded-lg text-red-700">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-red-900">อุบัติการณ์เจ้าหน้าที่</h2>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-center relative z-10">
                        <div className="bg-white/60 backdrop-blur-sm p-4 rounded-xl border border-red-100 shadow-sm">
                            <div className="text-3xl font-bold text-red-600">
                                {(stats.staffIncident?.reduce((acc, curr) => acc + curr.count, 0) || 0).toLocaleString()}
                            </div>
                            <div className="text-xs text-red-800 mt-1 font-medium">รวมทั้งหมด (ราย)</div>
                        </div>
                        <div className="bg-white/60 backdrop-blur-sm p-4 rounded-xl border border-red-100 shadow-sm">
                            <div className="text-3xl font-bold text-orange-500">
                                {(stats.staffIncident?.find(s => s.status?.includes('บาดเจ็บ'))?.count || 0).toLocaleString()}
                            </div>
                            <div className="text-xs text-red-800 mt-1 font-medium">บาดเจ็บ</div>
                        </div>
                        <div className="bg-white/60 backdrop-blur-sm p-4 rounded-xl border border-red-100 shadow-sm">
                            <div className="text-3xl font-bold text-gray-700">
                                {(stats.staffIncident?.find(s => s.status?.includes('เสียชีวิต'))?.count || 0).toLocaleString()}
                            </div>
                            <div className="text-xs text-red-800 mt-1 font-medium">เสียชีวิต</div>
                        </div>
                    </div>
                </section>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
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
                                className={`transition-colors p-1 rounded-full hover:bg-black/5 ${modalData.color === 'green' ? 'text-green-600' :
                                    modalData.color === 'red' ? 'text-red-600' :
                                        'text-gray-400'
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
                                    {modalData.list.map((item, idx) => (
                                        <li key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                                            <span className={`w-2 h-2 rounded-full ${modalData.color === 'green' ? 'bg-green-500' :
                                                modalData.color === 'red' ? 'bg-red-500' :
                                                    modalData.color === 'yellow' ? 'bg-yellow-500' :
                                                        modalData.color === 'orange' ? 'bg-orange-500' :
                                                            'bg-gray-500'
                                                }`}></span>
                                            <span className="text-gray-700 font-medium">{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="text-center py-12 text-gray-400 flex flex-col items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                    </svg>
                                    ไม่พบข้อมูล
                                </div>
                            )}
                        </div>
                        <div className="p-4 border-t border-gray-100 bg-gray-50/50 text-right">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="px-5 py-2.5 bg-white border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 font-semibold shadow-sm transition-all active:scale-95"
                            >
                                ปิดหน้าต่าง
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
