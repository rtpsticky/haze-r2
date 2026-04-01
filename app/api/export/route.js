import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Reference province mapping
const provinceMapping = {
  'อุตรดิตถ์': 53,
  'ตาก': 63,
  'สุโขทัย': 64,
  'พิษณุโลก': 65,
  'เพชรบูรณ์': 67
};

const mapEocStatus = (dbStatus) => {
  if (dbStatus === 'เปิด PHEOC') return 'opened';
  return 'closed';
};

const mapIncidentStatus = (status) => {
  if (status === 'บาดเจ็บ') return 'injured';
  if (status === 'เสียชีวิต') return 'dead';
  return status || 'unknown';
};

const mapTargetGroup = (dbGroup) => {
  if (!dbGroup) return '';
  const g = dbGroup.toUpperCase();
  if (g.includes('เด็กเล็ก') || g.includes('SMALL_CHILD')) return 'small_child';
  if (g.includes('ตั้งครรภ์') || g.includes('PREGNANT')) return 'pregnant';
  if (g.includes('ผู้สูงอายุ') || g.includes('ELDERLY')) return 'elderly';
  if (g.includes('ติดเตียง') || g.includes('BEDRIDDEN')) return 'bedridden';
  if (g.includes('โรคหัวใจ') || g.includes('HEART_DISEASE')) return 'heart_disease';
  if (g.includes('ทางเดินหายใจ') || g.includes('RESPIRATORY')) return 'respiratory';
  if (g.includes('ประชาชนทั่วไป') || g.includes('GENERAL')) return 'general_public';
  if (g.includes('608')) return 'group_608';
  return dbGroup.toLowerCase(); // Fallback
};

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date');

    if (!dateParam) {
      return NextResponse.json({ error: 'Missing date parameter. Please use ?date=YYYY-MM-DD' }, { status: 400 });
    }

    const targetDate = new Date(dateParam);
    if (isNaN(targetDate.getTime())) {
      return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
    }

    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Fetch all relevant locations
    const targetProvinceNames = Object.keys(provinceMapping);
    const locations = await prisma.location.findMany({
      where: {
        provinceName: {
          in: targetProvinceNames
        }
      }
    });

    const locationIds = locations.map(loc => loc.id);

    if (locationIds.length === 0) {
      return NextResponse.json({ error: 'No matching locations found in database' }, { status: 404 });
    }

    // Fetch data concurrently for the specific date and locations
    const [pheocReports, vulnerableData, cleanRoomReports, operationLogs, staffIncidents] = await Promise.all([
      prisma.pheocReport.findMany({
        where: {
          locationId: { in: locationIds },
          reportDate: { lte: endOfDay } // Get latest status up to the end of the selected day
        },
        orderBy: [
          { reportDate: 'desc' },
          { recordedAt: 'desc' }
        ]
      }),
      prisma.vulnerableData.findMany({
        where: {
          locationId: { in: locationIds },
          recordDate: { lte: endOfDay }
        },
        orderBy: [
          { recordDate: 'desc' },
          { id: 'desc' }
        ]
      }),
      prisma.cleanRoomReport.findMany({
        where: {
          locationId: { in: locationIds },
          recordDate: { lte: endOfDay }
        },
        orderBy: [
          { recordDate: 'desc' },
          { id: 'desc' }
        ]
      }),
      prisma.operationLog.findMany({
        where: {
          locationId: { in: locationIds },
          recordDate: { lte: endOfDay }
        },
        orderBy: [
          { recordDate: 'desc' },
          { id: 'desc' }
        ]
      }),
      prisma.staffIncident.findMany({
        where: {
          locationId: { in: locationIds },
          recordDate: { gte: startOfDay, lte: endOfDay }
        }
      })
    ]);

    // Grouping by province Name
    const aggregatedData = {};
    for (const pName of targetProvinceNames) {
      aggregatedData[pName] = {
        province_id: provinceMapping[pName],
        report_date: dateParam,
        emergency: {
          eoc_status: 'closed', // default
          vulnerable_groups_target: 0,
          clean_room_usage: 0,
          clean_room_users: 0
        },
        vulnerable: {
          small_child: 0,
          pregnant: 0,
          elderly: 0,
          bedridden: 0,
          heart_disease: 0,
          respiratory: 0
        },
        operations: {},
        impacts: []
      };
    }

    // Process PHEOC - grab the latest status for each province
    const handledProvincesForEoc = {};
    for (const report of pheocReports) {
      const loc = locations.find(l => l.id === report.locationId);
      if (loc && aggregatedData[loc.provinceName]) {
        const pName = loc.provinceName;
        // Since pheocReports is ordered by date descending, the first one we see is the latest
        if (!handledProvincesForEoc[pName]) {
           handledProvincesForEoc[pName] = true;
           aggregatedData[pName].emergency.eoc_status = mapEocStatus(report.status);
        }
      }
    }

    // Process Vulnerable Data (Latest Snapshot by Location + Group)
    const vulnerableSeen = new Set();
    for (const data of vulnerableData) {
      const uniqueKey = `${data.locationId}-${data.groupType}`;
      if (vulnerableSeen.has(uniqueKey)) continue; // We only want the latest record
      vulnerableSeen.add(uniqueKey);

      const loc = locations.find(l => l.id === data.locationId);
      if (loc && aggregatedData[loc.provinceName]) {
        const pName = loc.provinceName;
        const count = data.targetCount || 0;
        
        // Add to total vulnerable target
        aggregatedData[pName].emergency.vulnerable_groups_target += count;
        
        // Add to specific vulnerable segments
        if (data.groupType === 'กลุ่มเด็กเล็ก (0-5 ปี)' || data.groupType === 'เด็กเล็ก') {
           aggregatedData[pName].vulnerable.small_child += count;
        } else if (data.groupType === 'กลุ่มหญิงตั้งครรภ์' || data.groupType === 'หญิงตั้งครรภ์') {
           aggregatedData[pName].vulnerable.pregnant += count;
        } else if (data.groupType === 'กลุ่มผู้สูงอายุ' || data.groupType === 'ผู้สูงอายุ') {
           aggregatedData[pName].vulnerable.elderly += count;
        } else if (data.groupType === 'กลุ่มติดเตียง' || data.groupType === 'ติดเตียง') {
           aggregatedData[pName].vulnerable.bedridden += count;
        } else if (data.groupType === 'กลุ่มผู้ที่มีโรคหัวใจ' || data.groupType === 'โรคหัวใจ') {
           aggregatedData[pName].vulnerable.heart_disease += count;
        } else if (data.groupType === 'กลุ่มผู้ที่มีโรคระบบทางเดินหายใจ' || data.groupType === 'โรคทางเดินหายใจ') {
           aggregatedData[pName].vulnerable.respiratory += count;
        }
      }
    }

    // Process Clean Room (Latest Snapshot by Location + Place Type)
    const cleanRoomSeen = new Set();
    for (const report of cleanRoomReports) {
      const uniqueKey = `${report.locationId}-${report.placeType}`;
      if (cleanRoomSeen.has(uniqueKey)) continue; // We only want the latest record
      cleanRoomSeen.add(uniqueKey);

      const loc = locations.find(l => l.id === report.locationId);
      if (loc && aggregatedData[loc.provinceName]) {
        const pName = loc.provinceName;
        // Map clean_room_usage to passed rooms, and clean_room_users to serviceUserCount
        aggregatedData[pName].emergency.clean_room_usage += (report.passedStandard || 0);
        aggregatedData[pName].emergency.clean_room_users += (report.serviceUserCount || 0);
      }
    }

    // Process Operations Data (Latest Snapshot by Location + Activity + Target Group + Item)
    const operationsSeen = new Set();
    for (const op of operationLogs) {
      const uniqueKey = `${op.locationId}-${op.activityType}-${op.targetGroup}-${op.itemName}`;
      if (operationsSeen.has(uniqueKey)) continue; // We only want the latest record for this combo
      operationsSeen.add(uniqueKey);

      const loc = locations.find(l => l.id === op.locationId);
      if (loc && aggregatedData[loc.provinceName]) {
        const pName = loc.provinceName;
        const mappedTargetGroup = mapTargetGroup(op.targetGroup);
        
        if (!mappedTargetGroup) continue;

        if (!aggregatedData[pName].operations[mappedTargetGroup]) {
            aggregatedData[pName].operations[mappedTargetGroup] = [];
        }

        aggregatedData[pName].operations[mappedTargetGroup].push({
           item_name: op.itemName || '',
           amount: op.amount || 0
        });
      }
    }

    // Process Staff Incidents
    for (const incident of staffIncidents) {
      const loc = locations.find(l => l.id === incident.locationId);
      if (loc && aggregatedData[loc.provinceName]) {
        const pName = loc.provinceName;
        aggregatedData[pName].impacts.push({
           name: incident.staffName || '',
           status: mapIncidentStatus(incident.status),
           incident_details: incident.incidentDetails || ''
        });
      }
    }

    // Map object to final array and return single JSON
    const result = Object.values(aggregatedData);

    return NextResponse.json(result, { status: 200 });

  } catch (error) {
    console.error('Error generating export endpoint data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
