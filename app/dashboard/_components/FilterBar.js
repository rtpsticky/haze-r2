'use client';

import Select from 'react-select';
import { RotateCcw } from 'lucide-react';
import { PROVINCES } from '../_lib/pheoc-criteria';

const selectStyles = {
    menu: (b) => ({ ...b, zIndex: 60, borderRadius: 12, overflow: 'hidden', fontSize: 15 }),
    control: (b, s) => ({
        ...b,
        minHeight: 40,
        borderRadius: 12,
        fontSize: 15,
        borderColor: s.isFocused ? '#2563EB' : '#E2E8F0',
        backgroundColor: s.isDisabled ? '#F8FAFC' : '#fff',
        boxShadow: s.isFocused ? '0 0 0 3px rgba(37,99,235,0.15)' : 'none',
        '&:hover': { borderColor: s.isDisabled ? '#E2E8F0' : '#94A3B8' },
    }),
    valueContainer: (b) => ({ ...b, padding: '0 10px' }),
    option: (b, s) => ({
        ...b,
        padding: '8px 12px',
        backgroundColor: s.isSelected ? '#EFF6FF' : s.isFocused ? '#F8FAFC' : '#fff',
        color: s.isSelected ? '#1D4ED8' : '#334155',
    }),
    placeholder: (b) => ({ ...b, color: '#94A3B8' }),
    indicatorSeparator: () => ({ display: 'none' }),
};

const toOpt = (v) => (v ? { value: v, label: v } : null);

export default function FilterBar({
    fiscalYear, fiscalYears = [], currentFiscalYear, onFiscalYear,
    province, district, subDistrict, districts, subDistricts, onProvince, onDistrict, onSubDistrict, onReset,
}) {
    const hasFilter = Boolean(province || district || subDistrict || (fiscalYear && fiscalYear !== currentFiscalYear));
    const fyOpt = (y) => (y ? { value: y, label: `ปีงบ ${y}${y === currentFiscalYear ? ' (ปัจจุบัน)' : ''}` } : null);
    return (
        <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
            <div className="sm:w-[190px] shrink-0">
                <Select instanceId="f-fiscal-year" aria-label="ปีงบประมาณ" placeholder="ปีงบประมาณ" isSearchable={false} styles={selectStyles}
                    options={fiscalYears.map(fyOpt)} value={fyOpt(fiscalYear)} onChange={(o) => o && onFiscalYear(o.value)} />
            </div>
            <div className="grid grid-cols-3 gap-2 flex-1 lg:w-[540px]">
                <Select instanceId="f-province" aria-label="จังหวัด" placeholder="ทุกจังหวัด" isClearable styles={selectStyles}
                    options={PROVINCES.map(toOpt)} value={toOpt(province)} onChange={(o) => onProvince(o?.value || '')} />
                <Select instanceId="f-district" aria-label="อำเภอ" placeholder="ทุกอำเภอ" isClearable isDisabled={!province} styles={selectStyles}
                    options={districts.map(toOpt)} value={toOpt(district)} onChange={(o) => onDistrict(o?.value || '')} />
                <Select instanceId="f-subdistrict" aria-label="ตำบล" placeholder="ทุกตำบล" isClearable isDisabled={!district} styles={selectStyles}
                    options={subDistricts.map(toOpt)} value={toOpt(subDistrict)} onChange={(o) => onSubDistrict(o?.value || '')} />
            </div>
            <button
                type="button"
                onClick={onReset}
                disabled={!hasFilter}
                className="h-10 px-3.5 rounded-xl text-sm font-medium inline-flex items-center justify-center gap-1.5 border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
                <RotateCcw className="w-4 h-4" /> ล้าง
            </button>
        </div>
    );
}
