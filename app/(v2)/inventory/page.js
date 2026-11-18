import { getInventoryHistory } from '@/app/actions/inventory';
import ExportInventoryButton from '@/app/inventory/ExportInventoryButton';
import PageHeader from '../_components/PageHeader';
import { requireUser } from '../_lib/user';
import InventoryFormV2 from './InventoryFormV2';

export const dynamic = 'force-dynamic';

export default async function Page() {
    const user = await requireUser();
    const history = await getInventoryHistory();
    const rows = history.map((h) => ({
        date: h.date, locationId: h.locationId, locationName: h.locationName,
        provinceName: h.provinceName, districtName: h.districtName, subDistrict: h.subDistrict,
        totalItems: h.totalItems,
        records: h.records.map((r) => ({ itemName: r.itemName, stockCount: r.stockCount })),
    }));
    return (
        <>
            <PageHeader menuKey="inventory" subtitle="ยอดคงเหลือในคลัง ณ วันที่บันทึก" user={user} actions={<ExportInventoryButton role={user.role} />} />
            <main className="max-w-5xl mx-auto px-4 md:px-6 py-5">
                <InventoryFormV2 user={user} history={rows} />
            </main>
        </>
    );
}
