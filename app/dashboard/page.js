'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import {
    Users, Package, HardHat, Building2, HeartPulse, Landmark, BedDouble,
    TriangleAlert, CalendarClock, Table2, Loader2, Stethoscope,
} from 'lucide-react';
import { getDashboardStats } from '@/app/actions/dashboard';
import { getDistricts, getSubDistricts } from '@/app/actions/locations';
import FilterBar from './_components/FilterBar';
import PheocPanel from './_components/PheocBoard';
import MeasuresPanel from './_components/MeasuresPanel';
import SupplyTable from './_components/SupplyTable';
import { SectionTitle, Panel, Kpi, Stat, Progress, BarList, Modal, DashboardSkeleton, Empty, fmt, pct } from './_components/ui';

// สีข้อมูลเชิงปริมาณใช้สีเดียวทั้งหน้า — สีเขียว/เหลือง/ส้ม/แดง สงวนไว้สำหรับระดับ PHEOC
const DATA_BLUE = '#2563EB';

const CLEAN_ROOM_ORDER = [
    'โรงพยาบาลศูนย์', 'โรงพยาบาลทั่วไป', 'โรงพยาบาลชุมชน', 'โรงพยาบาลส่งเสริมสุขภาพตำบล', 'โรงพยาบาลเอกชน',
    'โรงพยาบาลสังกัดกระทรวงกลาโหม', 'โรงพยาบาลมหาวิทยาลัย', 'สสจ./สสอ.', 'หน่วยงานภาครัฐ (อบจ/อบต./สนง.ต่างๆ)',
    'ศูนย์ดูแลผู้สูงอายุ', 'โรงเรียน', 'ศูนย์เด็กเล็ก',
];

const PPE_TARGETS = [
    { id: 'GENERAL_PUBLIC', label: 'ประชาชนทั่วไป' },
    { id: 'SMALL_CHILDREN', label: 'เด็กเล็ก' },
    { id: 'PREGNANT_WOMEN', label: 'หญิงตั้งครรภ์' },
    { id: 'ELDERLY', label: 'ผู้สูงอายุ' },
    { id: 'BEDRIDDEN', label: 'ผู้ป่วยติดเตียง' },
    { id: 'HEART_DISEASE', label: 'ผู้ป่วยโรคหัวใจ' },
    { id: 'RESPIRATORY_DISEASE', label: 'ผู้ป่วยโรคทางเดินหายใจ' },
];

const maskType = (name) => {
    const n = (name || '').toLowerCase();
    if (n.includes('surgical') || n.includes('หน้ากากอนามัย')) return 'Surgical';
    if (n.includes('n95')) return 'N95';
    if (n.includes('carbon') || n.includes('คาร์บอน')) return 'คาร์บอน';
    if (n.includes('cloth') || n.includes('ผ้า')) return 'ผ้า';
    return 'อื่นๆ';
};

const isInventoryItem = (name) => !!name && (name.includes('(ชิ้น)') || name.includes('(หลัง)')) && !name.includes('(รายวัน)');
const sumBy = (arr, key = 'value') => arr.reduce((a, c) => a + (c[key] || 0), 0);

/** แปลงข้อมูลดิบจาก getDashboardStats ให้พร้อมแสดงผล */
function useDerived(stats) {
    return useMemo(() => {
        if (!stats) return null;

        const vulnerable = (stats.vulnerable?.byGroup || [])
            .filter((g) => g.name !== 'BEDRIDDEN_OP')
            .map((g) => ({ name: g.name, value: g.count }));

        const inventory = (stats.inventory?.byItem || [])
            .filter((i) => isInventoryItem(i.name))
            .map((i) => ({ name: i.name, value: i.count }));

        // ห้องปลอดฝุ่น: เรียงตามลำดับมาตรฐาน + ประเภทอื่นที่ไม่อยู่ในรายการต่อท้าย (ไม่ให้ข้อมูลหาย)
        const byType = stats.cleanRoom?.byType || [];
        const types = [...CLEAN_ROOM_ORDER, ...byType.map((t) => t.name).filter((n) => !CLEAN_ROOM_ORDER.includes(n))];
        const cleanRoomRows = types
            .map((name) => {
                const f = byType.find((t) => t.name === name);
                return { name: name || 'ไม่ระบุ', target: f?.total || 0, passed: f?.count || 0, s1: f?.standard1 || 0, s2: f?.standard2 || 0, s3: f?.standard3 || 0 };
            })
            .filter((r) => r.target || r.passed || r.s1 || r.s2 || r.s3);

        // PPE ตามกลุ่มเป้าหมาย (ไม่รวมมุ้งสู้ฝุ่น)
        const ppeMap = {};
        (stats.operation?.detailed || [])
            .filter((o) => o.activity !== 'มุ้งสู้ฝุ่น' && o.activity !== 'DUST_NET')
            .forEach((o) => {
                const g = PPE_TARGETS.find((t) => o.target === t.id || (o.target || '').includes(t.id));
                const label = g ? g.label : 'อื่นๆ';
                ppeMap[label] ??= { total: 0, types: {} };
                ppeMap[label].total += o.amount;
                const t = maskType(o.item);
                ppeMap[label].types[t] = (ppeMap[label].types[t] || 0) + o.amount;
            });
        const ppe = Object.entries(ppeMap).map(([name, v]) => ({
            name,
            value: v.total,
            sub: Object.entries(v.types).sort((a, b) => b[1] - a[1]).map(([t, n]) => `${t} ${fmt(n)}`).join(' · '),
        }));

        const detailed = stats.operation?.detailed || [];
        const dustNet = {
            bedridden: detailed.filter((o) => o.target?.includes('BEDRIDDEN') && o.activity === 'DUST_NET').reduce((a, c) => a + c.amount, 0),
            public: detailed.filter((o) => o.target === 'PATIENTS' && o.activity === 'DUST_NET').reduce((a, c) => a + c.amount, 0),
            localAdmin: stats.localAdmin?.dustNetSupport || 0,
        };

        const incidents = stats.staffIncident || [];
        const incident = {
            total: sumBy(incidents, 'count'),
            injured: incidents.find((s) => s.status?.includes('บาดเจ็บ'))?.count || 0,
            dead: incidents.find((s) => s.status?.includes('เสียชีวิต'))?.count || 0,
        };

        const latestReport = (stats.situation?.latestByProvince || []).map((r) => r.reportDate).sort().at(-1);

        return {
            vulnerable, inventory, cleanRoomRows, ppe, dustNet, incident, latestReport,
            totals: {
                vulnerable: sumBy(vulnerable),
                inventory: sumBy(inventory),
                ppe: sumBy(ppe),
                roomTarget: stats.cleanRoom?.targetRoomCount || sumBy(cleanRoomRows, 'target'),
                roomPassed: stats.cleanRoom?.passedStandard || sumBy(cleanRoomRows, 'passed'),
            },
        };
    }, [stats]);
}

function CleanRoomPanel({ cleanRoom, rows }) {
    const tot = { target: sumBy(rows, 'target'), passed: sumBy(rows, 'passed'), s1: sumBy(rows, 's1'), s2: sumBy(rows, 's2'), s3: sumBy(rows, 's3') };
    return (
        <Panel icon={Building2} title="ห้องปลอดฝุ่น" subtitle="แยกตามประเภทสถานที่ และรูปแบบมาตรฐาน">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mb-4">
                <Stat label="สถานที่" value={cleanRoom?.placeCount} unit="แห่ง" />
                <Stat label="ห้องเป้าหมาย" value={cleanRoom?.targetRoomCount} unit="ห้อง" />
                <Stat label="ผ่านมาตรฐาน" value={cleanRoom?.passedStandard} unit="ห้อง" />
                <Stat label="ผู้รับบริการ" value={cleanRoom?.serviceUserCount} unit="คน" />
            </div>
            {rows.length === 0 ? <Empty /> : (
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full min-w-[640px] text-[15px]">
                        <thead className="bg-slate-50 text-sm text-slate-600">
                            <tr>
                                <th className="text-left px-3 py-2.5 font-semibold">ประเภทสถานที่</th>
                                <th className="text-right px-3 py-2.5 font-semibold">เป้าหมาย</th>
                                <th className="text-left px-3 py-2.5 font-semibold w-44">ผ่านมาตรฐาน</th>
                                <th className="text-right px-3 py-2.5 font-semibold">แบบ 1</th>
                                <th className="text-right px-3 py-2.5 font-semibold">แบบ 2</th>
                                <th className="text-right px-3 py-2.5 font-semibold">แบบ 3</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((r) => (
                                <tr key={r.name} className="border-t border-slate-100 hover:bg-slate-50/60">
                                    <td className="px-3 py-2 text-slate-800">{r.name}</td>
                                    <td className="px-3 py-2 text-right tabular-nums">{fmt(r.target)}</td>
                                    <td className="px-3 py-2">
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1"><Progress value={r.passed} max={r.target} color={DATA_BLUE} height="h-1.5" /></div>
                                            <span className="tabular-nums text-sm w-20 text-right">{fmt(r.passed)} <span className="text-slate-400">({pct(r.passed, r.target)}%)</span></span>
                                        </div>
                                    </td>
                                    {['s1', 's2', 's3'].map((k) => (
                                        <td key={k} className={`px-3 py-2 text-right tabular-nums ${r[k] ? 'text-slate-800' : 'text-slate-300'}`}>{r[k] ? fmt(r[k]) : '–'}</td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="border-t-2 border-slate-200 bg-slate-50 font-semibold">
                            <tr>
                                <td className="px-3 py-2.5">รวม</td>
                                <td className="px-3 py-2.5 text-right tabular-nums">{fmt(tot.target)}</td>
                                <td className="px-3 py-2.5 tabular-nums">{fmt(tot.passed)} <span className="text-sm font-normal text-slate-500">({pct(tot.passed, tot.target)}%)</span></td>
                                <td className="px-3 py-2.5 text-right tabular-nums">{fmt(tot.s1)}</td>
                                <td className="px-3 py-2.5 text-right tabular-nums">{fmt(tot.s2)}</td>
                                <td className="px-3 py-2.5 text-right tabular-nums">{fmt(tot.s3)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            )}
        </Panel>
    );
}

export default function DashboardPage() {
    const [stats, setStats] = useState(null);
    const [modal, setModal] = useState({ open: false, title: '', items: [], accent: '#334155' });

    const [province, setProvince] = useState('');
    const [district, setDistrict] = useState('');
    const [subDistrict, setSubDistrict] = useState('');
    const [districts, setDistricts] = useState([]);
    const [subDistricts, setSubDistricts] = useState([]);

    const openList = useCallback((title, items, accent = '#334155') => setModal({ open: true, title, items: items || [], accent }), []);
    const closeModal = useCallback(() => setModal((m) => ({ ...m, open: false })), []);

    // เปลี่ยนพื้นที่ระดับบน → ล้างระดับล่างใน handler
    const changeProvince = (v) => { setProvince(v); setDistrict(''); setSubDistrict(''); setDistricts([]); setSubDistricts([]); };
    const changeDistrict = (v) => { setDistrict(v); setSubDistrict(''); setSubDistricts([]); };

    useEffect(() => {
        if (!province) return;
        let cancelled = false;
        getDistricts(province).then((res) => !cancelled && res.success && setDistricts(res.data));
        return () => { cancelled = true; };
    }, [province]);

    useEffect(() => {
        if (!district) return;
        let cancelled = false;
        getSubDistricts(province, district).then((res) => !cancelled && res.success && setSubDistricts(res.data.map((s) => s.subDistrict)));
        return () => { cancelled = true; };
    }, [province, district]);

    const filterKey = `${province}|${district}|${subDistrict}`;
    const [loadedKey, setLoadedKey] = useState(null);
    const loading = loadedKey === null;
    const refreshing = !loading && loadedKey !== filterKey;

    useEffect(() => {
        let cancelled = false;
        getDashboardStats({ province, district, subDistrict }).then((data) => {
            if (cancelled) return;
            setStats(data);
            setLoadedKey(`${province}|${district}|${subDistrict}`);
        });
        return () => { cancelled = true; };
    }, [province, district, subDistrict]);

    const d = useDerived(stats);
    const scope = [province && `จ.${province}`, district && `อ.${district}`, subDistrict && `ต.${subDistrict}`].filter(Boolean).join(' › ') || 'ทั้ง 5 จังหวัด';
    const dim = refreshing ? 'opacity-50 pointer-events-none' : '';

    return (
        <div className="min-h-screen bg-slate-100/70 text-slate-900 text-[15px]">
            {/* ส่วนหัว + ตัวกรอง (ติดบนสุด) */}
            <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-slate-200">
                <div className="max-w-[1600px] mx-auto px-4 md:px-6 py-3 flex flex-col lg:flex-row lg:items-center gap-3">
                    <div className="flex-1 min-w-0">
                        <h1 className="text-xl md:text-2xl font-semibold leading-tight">Dashboard รายงานผลการดำเนินงาน</h1>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500 mt-0.5">
                            <span>เขตสุขภาพที่ 2 · PM2.5 ปี 2570</span>
                            <span className="inline-flex items-center gap-1">
                                <CalendarClock className="w-4 h-4" />
                                PHEOC ล่าสุด {d?.latestReport ? new Date(d.latestReport).toLocaleDateString('th-TH', { dateStyle: 'medium' }) : '—'}
                            </span>
                        </div>
                    </div>
                    <FilterBar
                        province={province} district={district} subDistrict={subDistrict}
                        districts={districts} subDistricts={subDistricts}
                        onProvince={changeProvince} onDistrict={changeDistrict} onSubDistrict={setSubDistrict}
                        onReset={() => changeProvince('')}
                    />
                </div>
            </header>

            <main className="max-w-[1600px] mx-auto px-4 md:px-6 py-5 space-y-4">
                {loading ? <DashboardSkeleton /> : !stats ? (
                    <div className="py-24 text-center text-lg text-slate-500">ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง</div>
                ) : (
                    <>
                        {/* ขอบเขตข้อมูล */}
                        <div className="flex items-center gap-2 text-sm">
                            <span className="text-slate-500">กำลังแสดง</span>
                            <span className="font-medium text-blue-800 bg-blue-50 border border-blue-100 rounded-full px-2.5 py-0.5">{scope}</span>
                            {refreshing && <Loader2 className="w-4 h-4 text-slate-400 animate-spin" aria-label="กำลังโหลด" />}
                        </div>

                        {/* สรุปตัวเลขสำคัญ */}
                        <div className={`grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 transition-opacity ${dim}`}>
                            <Kpi icon={Users} label="กลุ่มเปราะบาง" value={d.totals.vulnerable} unit="คน" sub={`${d.vulnerable.filter((v) => v.value > 0).length} กลุ่ม`} />
                            <Kpi icon={Package} label="เวชภัณฑ์คงเหลือ" value={d.totals.inventory} unit="ชิ้น" sub={`${d.inventory.filter((v) => v.value > 0).length} รายการ`} />
                            <Kpi icon={HardHat} label="แจกหน้ากาก / PPE" value={d.totals.ppe} unit="ชิ้น" sub={`${d.ppe.length} กลุ่มเป้าหมาย`} />
                            <Kpi icon={Building2} label="ห้องปลอดฝุ่นผ่านมาตรฐาน" value={d.totals.roomPassed} unit="ห้อง" sub={`จากเป้าหมาย ${fmt(d.totals.roomTarget)} ห้อง (${pct(d.totals.roomPassed, d.totals.roomTarget)}%)`} />
                            <Kpi icon={Stethoscope} label="คัดกรองเชิงรุก" value={stats.activeCare?.people || 0} unit="คน" sub={`พบกลุ่มเสี่ยง ${fmt(stats.activeCare?.riskGroups)} คน`} />
                            <Kpi icon={TriangleAlert} label="อุบัติการณ์เจ้าหน้าที่" value={d.incident.total} unit="ราย" alert={d.incident.total > 0}
                                sub={d.incident.total ? `บาดเจ็บ ${fmt(d.incident.injured)} · เสียชีวิต ${fmt(d.incident.dead)}` : 'ไม่มีรายงาน'} />
                        </div>

                        {/* 1. มาตรการและการจัดการ */}
                        <SectionTitle no="1" title="มาตรการและการจัดการ" />
                        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
                            <PheocPanel latestByProvince={stats.situation?.latestByProvince} onOpenList={openList} className="xl:col-span-8" />
                            <MeasuresPanel measure={stats.measure} className={`xl:col-span-4 transition-opacity ${dim}`} />
                        </div>

                        <div className={`space-y-4 transition-opacity ${dim}`}>
                            {/* 2. กลุ่มเปราะบาง */}
                            <SectionTitle no="2" title="กลุ่มเปราะบาง / กลุ่มเสี่ยง" note={scope} />
                            <Panel icon={Users} title="จำนวนกลุ่มเปราะบางแยกตามกลุ่ม" aside={<span className="text-sm text-slate-500">รวม <b className="text-lg text-slate-900 tabular-nums">{fmt(d.totals.vulnerable)}</b> คน</span>}>
                                <BarList data={d.vulnerable} unit="คน" color={DATA_BLUE} twoCol />
                            </Panel>

                            {/* 3. ทรัพยากรและสถานที่ */}
                            <SectionTitle no="3" title="ทรัพยากรและสถานที่" note={scope} />
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                                <Panel icon={Package} title="เวชภัณฑ์และทรัพยากรคงเหลือ" subtitle="ยอดคงคลังล่าสุดของแต่ละหน่วย"
                                    aside={<span className="text-sm text-slate-500">รวม <b className="text-lg text-slate-900 tabular-nums">{fmt(d.totals.inventory)}</b> ชิ้น</span>}>
                                    <BarList data={d.inventory} unit="ชิ้น" color={DATA_BLUE} />
                                </Panel>
                                <Panel icon={HardHat} title="การแจกหน้ากาก / PPE" subtitle="ตามกลุ่มเป้าหมาย พร้อมชนิดหน้ากาก"
                                    aside={<span className="text-sm text-slate-500">รวม <b className="text-lg text-slate-900 tabular-nums">{fmt(d.totals.ppe)}</b> ชิ้น</span>}>
                                    <BarList data={d.ppe} unit="ชิ้น" color={DATA_BLUE} />
                                </Panel>
                            </div>
                            <CleanRoomPanel cleanRoom={stats.cleanRoom} rows={d.cleanRoomRows} />
                            <Panel icon={Table2} title="เวชภัณฑ์รายจังหวัด" subtitle="การจ่ายและคงคลัง (Snapshot)">
                                <SupplyTable snapshot={stats.supplySnapshot} />
                            </Panel>

                            {/* 4. การปฏิบัติการ */}
                            <SectionTitle no="4" title="การปฏิบัติการและการสนับสนุน" note={scope} />
                            <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-4 gap-4">
                                <Panel icon={HeartPulse} title="การปฏิบัติการเชิงรุก">
                                    <div className="grid grid-cols-3 gap-2">
                                        <Stat label="เยี่ยมบ้าน" value={stats.activeCare?.households} unit="หลัง" />
                                        <Stat label="คัดกรอง" value={stats.activeCare?.people} unit="คน" />
                                        <Stat label="กลุ่มเสี่ยง" value={stats.activeCare?.riskGroups} unit="คน" />
                                    </div>
                                </Panel>
                                <Panel icon={BedDouble} title="มุ้งสู้ฝุ่น">
                                    <div className="grid grid-cols-3 gap-2">
                                        <Stat label="ผู้ป่วยติดเตียง" value={d.dustNet.bedridden} unit="คน" />
                                        <Stat label="ประชาชน" value={d.dustNet.public} unit="หลัง" />
                                        <Stat label="อปท. สนับสนุน" value={d.dustNet.localAdmin} unit="หลัง" />
                                    </div>
                                </Panel>
                                <Panel icon={Landmark} title="การสนับสนุนจาก อปท." aside={<span className="text-sm text-slate-500"><b className="text-slate-900 tabular-nums">{fmt(stats.localAdmin?.orgCount)}</b> แห่ง</span>}>
                                    <div className="grid grid-cols-3 gap-2">
                                        <Stat label="หน้ากาก" value={stats.localAdmin?.maskSupport} unit="ชิ้น" />
                                        <Stat label="มุ้งสู้ฝุ่น" value={stats.localAdmin?.dustNetSupport} unit="หลัง" />
                                        <Stat label="ห้องปลอดฝุ่น" value={stats.localAdmin?.cleanRoomSupport} unit="ห้อง" />
                                    </div>
                                </Panel>
                                <Panel icon={TriangleAlert} title="อุบัติการณ์เจ้าหน้าที่" className={d.incident.total ? 'border-red-300 ring-1 ring-red-200' : ''}>
                                    <div className="grid grid-cols-3 gap-2">
                                        <Stat label="รวม" value={d.incident.total} unit="ราย" tone={d.incident.total ? 'red' : undefined} />
                                        <Stat label="บาดเจ็บ" value={d.incident.injured} unit="ราย" tone={d.incident.injured ? 'orange' : undefined} />
                                        <Stat label="เสียชีวิต" value={d.incident.dead} unit="ราย" tone={d.incident.dead ? 'red' : undefined} />
                                    </div>
                                </Panel>
                            </div>
                        </div>
                    </>
                )}
            </main>

            <Modal open={modal.open} onClose={closeModal} title={modal.title} items={modal.items} accent={modal.accent} />
        </div>
    );
}
