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
  if (!dbStatus) return 'not_opened';
  if (dbStatus === 'เปิด PHEOC') return 'opened';
  if (dbStatus === 'ปิดศูนย์') return 'closed';
  if (dbStatus === 'ยังไม่เปิด') return 'not_opened';
  if (dbStatus === 'เฝ้าระวังปกติ') return 'normal_watch';
  if (dbStatus === 'เฝ้าระวังใกล้ชิด') return 'close_watch';
  return 'not_opened';
};

const mapIncidentStatus = (status) => {
  if (status === 'บาดเจ็บ') return 'injured';
  if (status === 'เสียชีวิต') return 'dead';
  return status || 'unknown';
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
    const [pheocReports, vulnerableData, cleanRoomReports, staffIncidents] = await Promise.all([
      prisma.pheocReport.findMany({
        where: {
          locationId: { in: locationIds },
          reportDate: { gte: startOfDay, lte: endOfDay }
        }
      }),
      prisma.vulnerableData.findMany({
        where: {
          locationId: { in: locationIds },
          recordDate: { gte: startOfDay, lte: endOfDay }
        }
      }),
      prisma.cleanRoomReport.findMany({
        where: {
          locationId: { in: locationIds },
          recordDate: { gte: startOfDay, lte: endOfDay }
        }
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
          eoc_status: 'not_opened', // default
          vulnerable_groups_target: 0,
          clean_room_usage: 0
        },
        health: {
          target_small_child: 0,
          target_pregnant: 0,
          target_elderly: 0,
          clean_room_users: 0
        },
        impacts: []
      };
    }

    // Process PHEOC - grab highest priority status
    const statusPriority = { 'เปิด PHEOC': 4, 'เฝ้าระวังใกล้ชิด': 3, 'เฝ้าระวังปกติ': 2, 'ปิดศูนย์': 1, 'ยังไม่เปิด': 0 };
    const currentStatusPriority = {};
    for (const report of pheocReports) {
      const loc = locations.find(l => l.id === report.locationId);
      if (loc && aggregatedData[loc.provinceName]) {
        const pName = loc.provinceName;
        const pStatus = currentStatusPriority[pName] || -1;
        const rStatus = statusPriority[report.status] !== undefined ? statusPriority[report.status] : -1;
        if (rStatus > pStatus) {
           currentStatusPriority[pName] = rStatus;
           aggregatedData[pName].emergency.eoc_status = mapEocStatus(report.status);
        }
      }
    }

    // Process Vulnerable Data
    for (const data of vulnerableData) {
      const loc = locations.find(l => l.id === data.locationId);
      if (loc && aggregatedData[loc.provinceName]) {
        const pName = loc.provinceName;
        const count = data.targetCount || 0;
        
        // Add to total vulnerable target
        aggregatedData[pName].emergency.vulnerable_groups_target += count;
        
        // Add to specific health segments (using actual database labels)
        if (data.groupType === 'กลุ่มเด็กเล็ก (0-5 ปี)') {
           aggregatedData[pName].health.target_small_child += count;
        } else if (data.groupType === 'กลุ่มหญิงตั้งครรภ์') {
           aggregatedData[pName].health.target_pregnant += count;
        } else if (data.groupType === 'กลุ่มผู้สูงอายุ') {
           aggregatedData[pName].health.target_elderly += count;
        } else if (data.groupType === 'เด็กเล็ก') {
           // Adding fallback for older data forms (schema says เด็กเล็ก, หญิงตั้งครรภ์, ผู้สูงอายุ)
           aggregatedData[pName].health.target_small_child += count;
        } else if (data.groupType === 'หญิงตั้งครรภ์') {
           aggregatedData[pName].health.target_pregnant += count;
        } else if (data.groupType === 'ผู้สูงอายุ') {
           aggregatedData[pName].health.target_elderly += count;
        }
      }
    }

    // Process Clean Room
    for (const report of cleanRoomReports) {
      const loc = locations.find(l => l.id === report.locationId);
      if (loc && aggregatedData[loc.provinceName]) {
        const pName = loc.provinceName;
        // Map clean_room_usage to passed rooms, and clean_room_users to serviceUserCount
        aggregatedData[pName].emergency.clean_room_usage += (report.passedStandard || 0);
        aggregatedData[pName].health.clean_room_users += (report.serviceUserCount || 0);
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
