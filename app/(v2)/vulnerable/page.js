import { getVulnerableHistory } from '@/app/actions/vulnerable';
import ExportVulnerableButton from '@/app/vulnerable/ExportVulnerableButton';
import PageHeader from '../_components/PageHeader';
import { requireUser } from '../_lib/user';
import VulnerableFormV2 from './VulnerableFormV2';

export const dynamic = 'force-dynamic';

export default async function Page() {
    const user = await requireUser(['SSJ', 'SSO', 'ADMIN', 'HEALTH_REGION', 'HOSPITAL', 'RPS', 'PCU']);
    const history = await getVulnerableHistory();
    const rows = history.map((h) => ({
        date: h.date, locationId: h.locationId, provinceName: h.provinceName, districtName: h.districtName, subDistrict: h.subDistrict,
        totalCount: h.totalCount, isByPass: h.isByPass,
        records: h.records.map((r) => ({ groupType: r.groupType, targetCount: r.targetCount })),
    }));
    return (
        <>
            <PageHeader menuKey="vulnerable" subtitle="จำนวนกลุ่มเป้าหมายในพื้นที่ที่รับผิดชอบ" user={user} actions={<ExportVulnerableButton role={user.role} />} />
            <main className="max-w-5xl mx-auto px-4 md:px-6 py-5">
                <VulnerableFormV2 user={user} history={rows} />
            </main>
        </>
    );
}
