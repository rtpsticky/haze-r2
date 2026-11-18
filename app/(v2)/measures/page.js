import prisma from '@/lib/prisma';
import ExportMeasuresButton from '@/app/v1/measures/ExportMeasuresButton';
import PageHeader from '../_components/PageHeader';
import { requireUser } from '../_lib/user';
import MeasuresFormV2 from './MeasuresFormV2';

export const dynamic = 'force-dynamic';

export default async function Page() {
    const user = await requireUser(['SSJ', 'SSO', 'ADMIN', 'HEALTH_REGION']);

    // เหมือน v1: บันทึกมาตรการเป็นรายวัน (วันนี้)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const existing = await prisma.measureLog.findMany({
        where: { locationId: user.locationId, createdAt: { gte: today, lt: tomorrow } },
        select: { measureId: true, status: true, detail: true },
    });

    return (
        <>
            <PageHeader menuKey="measures" subtitle="รายงานผลการดำเนินงานตามมาตรการ 1 – 4 ประจำวัน" user={user} actions={<ExportMeasuresButton role={user.role} />} />
            <main className="max-w-5xl mx-auto px-4 md:px-6 py-5">
                <MeasuresFormV2 existing={existing} />
            </main>
        </>
    );
}
