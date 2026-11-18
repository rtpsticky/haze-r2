import prisma from '@/lib/prisma';
import ExportPheocButton from '@/app/v1/pheoc/ExportPheocButton';
import PageHeader from '../_components/PageHeader';
import { requireUser, isRegionAdmin } from '../_lib/user';
import PheocFormV2 from './PheocFormV2';

export const dynamic = 'force-dynamic';

export default async function Page() {
    const user = await requireUser(['SSJ', 'ADMIN', 'HEALTH_REGION']);
    const reports = await prisma.pheocReport.findMany({
        where: isRegionAdmin(user.role) ? {} : { locationId: user.locationId },
        orderBy: { reportDate: 'desc' },
        include: { location: true },
        take: 50,
    });
    const rows = reports.map((r) => ({
        id: r.id,
        reportDate: r.reportDate.toISOString(),
        status: r.status,
        responseLevel: r.responseLevel,
        pdfUrl: r.pdfUrl,
        provinceName: r.location?.provinceName,
        districtName: r.location?.districtName,
        subDistrict: r.location?.subDistrict,
    }));

    return (
        <>
            <PageHeader menuKey="pheoc" subtitle="สถานะศูนย์ปฏิบัติการฉุกเฉินด้านการแพทย์และสาธารณสุข" user={user} actions={<ExportPheocButton role={user.role} />} />
            <main className="max-w-5xl mx-auto px-4 md:px-6 py-5">
                <PheocFormV2 reports={rows} />
            </main>
        </>
    );
}
