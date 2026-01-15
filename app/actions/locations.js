'use server'

import prisma from '@/lib/prisma'

export async function getProvinces() {
    try {
        const provinces = await prisma.location.findMany({
            distinct: ['provinceName'],
            select: { provinceName: true },
            orderBy: { provinceName: 'asc' }
        })
        return { success: true, data: provinces.map(p => p.provinceName) }
    } catch (error) {
        console.error('getProvinces error:', error)
        return { success: false, data: [] }
    }
}

export async function getDistricts(provinceName) {
    try {
        const districts = await prisma.location.findMany({
            where: { provinceName },
            distinct: ['districtName'],
            select: { districtName: true },
            orderBy: { districtName: 'asc' }
        })
        return { success: true, data: districts.map(d => d.districtName) }
    } catch (error) {
        console.error('getDistricts error:', error)
        return { success: false, data: [] }
    }
}

export async function getSubDistricts(provinceName, districtName) {
    try {
        const subDistricts = await prisma.location.findMany({
            where: { provinceName, districtName },
            distinct: ['subDistrict'],
            select: { id: true, subDistrict: true },
            orderBy: { subDistrict: 'asc' }
        })
        return { success: true, data: subDistricts }
    } catch (error) {
        console.error('getSubDistricts error:', error)
        return { success: false, data: [] }
    }
}
