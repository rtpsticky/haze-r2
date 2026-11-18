import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';

/** ผู้ใช้ปัจจุบัน (พร้อม location) — ไม่ login ส่งไปหน้า login, ไม่มีสิทธิ์ส่งกลับหน้าหลัก v2 */
export async function requireUser(allowedRoles = null) {
    const session = await getSession();
    if (!session) redirect('/login');

    const user = await prisma.user.findUnique({
        where: { id: session.userId },
        include: { location: true },
    });
    if (!user) redirect('/login');
    if (allowedRoles && !allowedRoles.includes(user.role)) redirect('/v2');

    // ส่งเฉพาะฟิลด์ที่หน้าใช้ ไปยัง client component (ไม่ส่ง password hash)
    return {
        id: user.id,
        name: user.name,
        username: user.username,
        orgName: user.orgName,
        role: user.role,
        locationId: user.locationId,
        location: user.location
            ? {
                id: user.location.id,
                provinceName: user.location.provinceName,
                districtName: user.location.districtName,
                subDistrict: user.location.subDistrict,
            }
            : null,
    };
}

export const isRegionAdmin = (role) => role === 'ADMIN' || role === 'HEALTH_REGION';
