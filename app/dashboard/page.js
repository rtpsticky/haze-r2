'use client';

import { useEffect, useState } from 'react';
import { getDashboardStats } from '@/app/actions/dashboard';
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

    useEffect(() => {
        async function fetchData() {
            const data = await getDashboardStats();
            setStats(data);
            setLoading(false);
        }
        fetchData();
    }, []);

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


