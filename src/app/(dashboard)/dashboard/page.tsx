import { prisma } from "@/lib/prisma";
import { computeAttendanceColor } from "@/lib/attendance-color";
import { AttendanceBadge } from "@/components/AttendanceBadge";
import Link from "next/link";

async function getDashboardStats() {
  const [totalMembers, totalZones, recentSessions, allMembers] = await Promise.all([
    prisma.member.count({ where: { status: "ACTIVE" } }),
    prisma.zone.count(),
    prisma.serviceSession.findMany({
      include: {
        serviceType: true,
        _count: { select: { attendances: true } },
      },
      orderBy: { date: "desc" },
      take: 5,
    }),
    prisma.member.findMany({
      where: { status: "ACTIVE" },
      include: {
        zone: true,
        attendances: {
          include: { serviceSession: true },
          orderBy: { serviceSession: { date: "desc" } },
          take: 20,
        },
      },
    }),
  ]);

  const now = new Date();
  const threeMonthsAgo = new Date(now);
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  const colorCounts = { GREEN: 0, YELLOW: 0, ORANGE: 0, RED: 0, GREY: 0 };
  for (const member of allMembers) {
    const lastAtt = member.attendances[0];
    const lastDate = lastAtt?.serviceSession?.date ?? null;
    const consistent = member.attendances.filter(
      (a) => new Date(a.serviceSession.date) >= threeMonthsAgo
    ).length >= 8;
    const color = computeAttendanceColor(lastDate ? new Date(lastDate) : null, consistent);
    colorCounts[color]++;
  }

  return { totalMembers, totalZones, recentSessions, colorCounts };
}

export default async function DashboardPage() {
  const { totalMembers, totalZones, recentSessions, colorCounts } = await getDashboardStats();

  const statCards = [
    { label: "Total Active Members", value: totalMembers, color: "text-blue-700", bg: "bg-blue-50" },
    { label: "Zones", value: totalZones, color: "text-purple-700", bg: "bg-purple-50" },
    { label: "Consistent Attendees", value: colorCounts.GREEN, color: "text-green-700", bg: "bg-green-50" },
    { label: "Need Follow-up (Red)", value: colorCounts.RED, color: "text-red-700", bg: "bg-red-50" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">KCOC Visitation Ministry Overview</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div key={card.label} className={`${card.bg} rounded-xl p-5`}>
            <p className={`text-3xl font-bold ${card.color}`}>{card.value}</p>
            <p className="text-gray-600 text-sm mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Attendance Color Summary */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Attendance Status Overview</h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {(["GREEN", "YELLOW", "ORANGE", "RED", "GREY"] as const).map((color) => (
            <Link
              key={color}
              href={`/reports?color=${color}`}
              className="flex flex-col items-center p-3 rounded-lg border hover:shadow-sm transition-shadow cursor-pointer"
            >
              <AttendanceBadge color={color} />
              <span className="text-2xl font-bold mt-2 text-gray-800">{colorCounts[color]}</span>
              <span className="text-xs text-gray-500 mt-1">
                {color === "GREEN" && "3+ months active"}
                {color === "YELLOW" && "1 month absent"}
                {color === "ORANGE" && "2 months absent"}
                {color === "RED" && "3 months absent"}
                {color === "GREY" && "No data yet"}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Service Sessions */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">Recent Services</h2>
          <Link href="/attendance" className="text-sm text-blue-600 hover:underline">
            View all →
          </Link>
        </div>
        {recentSessions.length === 0 ? (
          <p className="text-gray-400 text-sm">No services recorded yet.</p>
        ) : (
          <div className="space-y-3">
            {recentSessions.map((session) => (
              <div key={session.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div>
                  <p className="font-medium text-gray-900 text-sm">{session.serviceType.name}</p>
                  <p className="text-gray-500 text-xs">
                    {new Date(session.date).toLocaleDateString("en-GH", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-1 rounded-full">
                  {session._count.attendances} present
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
