import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { computeAttendanceColor } from "@/lib/attendance-color";
import { AttendanceBadge } from "@/components/AttendanceBadge";
import { ArrowLeft } from "lucide-react";

export default async function MemberDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const member = await prisma.member.findUnique({
    where: { id },
    include: {
      zone: true,
      community: true,
      ministry: true,
      attendances: {
        include: { serviceSession: true, serviceType: true },
        orderBy: { serviceSession: { date: "desc" } },
        take: 30,
      },
      visitationLogs: {
        include: { visitedBy: true },
        orderBy: { visitDate: "desc" },
      },
      brothersKeeperLogs: {
        include: { checkedBy: true },
        orderBy: { checkDate: "desc" },
      },
    },
  });

  if (!member) notFound();

  const now = new Date();
  const threeMonthsAgo = new Date(now);
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  const lastAtt = member.attendances[0];
  const lastDate = lastAtt?.serviceSession?.date ?? null;
  const consistent = member.attendances.filter(
    (a) => new Date(a.serviceSession.date) >= threeMonthsAgo
  ).length >= 8;
  const color = computeAttendanceColor(lastDate ? new Date(lastDate) : null, consistent);

  const VISIT_LABELS: Record<string, string> = {
    SICK: "Sick Visit",
    BEREAVED: "Bereavement",
    BIRTH: "Birth/New Baby",
    NEW_CONVERT: "New Convert",
    FOLLOW_UP: "Follow-up",
    WELFARE_CHECK: "Welfare Check",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/members" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {member.firstName} {member.lastName}
          </h1>
          <p className="text-gray-500 text-sm">Church No: {member.churchNumber}</p>
        </div>
        <AttendanceBadge color={color} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Member Info */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Member Information</h2>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-gray-500">Church Number</dt>
              <dd className="font-medium font-mono">{member.churchNumber}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Full Name</dt>
              <dd className="font-medium">{member.firstName} {member.lastName}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Gender</dt>
              <dd className="font-medium">{member.gender === "M" ? "Male" : "Female"}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Phone</dt>
              <dd className="font-medium">{member.phone ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Address</dt>
              <dd className="font-medium">{member.address ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Employment</dt>
              <dd className="font-medium">{member.employmentStatus ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Zone</dt>
              <dd className="font-medium">{member.zone.name}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Community</dt>
              <dd className="font-medium">{member.community?.name ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Ministry</dt>
              <dd className="font-medium">{member.ministry?.name ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Status</dt>
              <dd>
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                  member.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                }`}>
                  {member.status}
                </span>
              </dd>
            </div>
          </dl>
        </div>

        {/* Attendance History */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">
            Attendance History ({member.attendances.length})
          </h2>
          {member.attendances.length === 0 ? (
            <p className="text-gray-400 text-sm">No attendance records yet.</p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {member.attendances.map((att) => (
                <div key={att.id} className="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{att.serviceType.name}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(att.serviceSession.date).toLocaleDateString("en-GH", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <span className="w-2 h-2 bg-green-500 rounded-full" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Visitation Logs */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">
            Visitation Logs ({member.visitationLogs.length})
          </h2>
          {member.visitationLogs.length === 0 ? (
            <p className="text-gray-400 text-sm">No visitation records yet.</p>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {member.visitationLogs.map((log) => (
                <div key={log.id} className="p-3 bg-gray-50 rounded-lg text-sm">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-blue-700">
                      {VISIT_LABELS[log.visitType] ?? log.visitType}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(log.visitDate).toLocaleDateString("en-GH")}
                    </span>
                  </div>
                  {log.notes && <p className="text-gray-600 text-xs">{log.notes}</p>}
                  {log.outcome && (
                    <p className="text-xs text-gray-500 mt-1">Outcome: {log.outcome}</p>
                  )}
                  {log.visitedBy && (
                    <p className="text-xs text-gray-400 mt-1">By: {log.visitedBy.name}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
