import ExportOperationsButton from '@/app/operations/ExportOperationsButton';
import PageHeader from '../_components/PageHeader';
import { requireUser } from '../_lib/user';
import OperationsFormV2 from './OperationsFormV2';

export const dynamic = 'force-dynamic';

export default async function Page() {
    const user = await requireUser();
    return (
        <>
            <PageHeader menuKey="operations" subtitle="จำนวนที่แจกในวันนั้น (ไม่ใช่ยอดคงเหลือ)" user={user} actions={<ExportOperationsButton role={user.role} />} />
            <main className="max-w-5xl mx-auto px-4 md:px-6 py-5">
                <OperationsFormV2 user={user} />
            </main>
        </>
    );
}
