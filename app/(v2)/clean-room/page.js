import { getCleanRoomHistory } from '@/app/actions/clean-room';
import ExportCleanRoomButton from '@/app/clean-room/ExportCleanRoomButton';
import PageHeader from '../_components/PageHeader';
import { requireUser } from '../_lib/user';
import CleanRoomFormV2 from './CleanRoomFormV2';

export const dynamic = 'force-dynamic';

export default async function Page() {
    const user = await requireUser();
    const history = await getCleanRoomHistory();
    const rows = history.map((h) => ({
        recordDate: new Date(h.recordDate).toISOString(), locationId: h.locationId, locationName: h.locationName,
        provinceName: h.provinceName, districtName: h.districtName, subDistrict: h.subDistrict,
        totalPlaces: h.totalPlaces, totalTarget: h.totalTarget, totalPassed: h.totalPassed,
    }));
    return (
        <>
            <PageHeader menuKey="clean-room" subtitle="จำนวนห้องปลอดฝุ่น แยกตามประเภทสถานที่" user={user} actions={<ExportCleanRoomButton />} />
            <main className="max-w-5xl mx-auto px-4 md:px-6 py-5">
                <CleanRoomFormV2 user={user} history={rows} />
            </main>
        </>
    );
}
