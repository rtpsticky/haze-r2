import ExportIncidentsButton from '@/app/incidents/ExportIncidentsButton';
import PageHeader from '../_components/PageHeader';
import { requireUser } from '../_lib/user';
import IncidentsFormV2 from './IncidentsFormV2';

export const dynamic = 'force-dynamic';

export default async function Page() {
    const user = await requireUser(['SSJ', 'ADMIN', 'HEALTH_REGION', 'HOSPITAL', 'RPS', 'PCU']);
    return (
        <>
            <PageHeader menuKey="incidents" subtitle="ผลกระทบต่อสุขภาพของเจ้าหน้าที่และจิตอาสาดับไฟป่า" user={user} actions={<ExportIncidentsButton />} />
            <main className="max-w-5xl mx-auto px-4 md:px-6 py-5">
                <IncidentsFormV2 user={user} />
            </main>
        </>
    );
}
