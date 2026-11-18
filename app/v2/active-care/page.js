import ExportActiveCareButton from '@/app/active-care/ExportActiveCareButton';
import PageHeader from '../_components/PageHeader';
import { requireUser } from '../_lib/user';
import ActiveCareFormV2 from './ActiveCareFormV2';

export const dynamic = 'force-dynamic';

export default async function Page() {
    const user = await requireUser();
    return (
        <>
            <PageHeader menuKey="active-care" subtitle="การปฏิบัติการเชิงรุกในพื้นที่ และการสนับสนุนของ อปท." user={user} actions={<ExportActiveCareButton />} />
            <main className="max-w-5xl mx-auto px-4 md:px-6 py-5">
                <ActiveCareFormV2 user={user} />
            </main>
        </>
    );
}
