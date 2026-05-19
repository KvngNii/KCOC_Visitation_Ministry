"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Pencil, Trash2, User } from "lucide-react";
import { computeAttendanceColor } from "@/lib/attendance-color";
import { AttendanceBadge } from "@/components/AttendanceBadge";
import { AddMemberModal } from "@/components/AddMemberModal";

interface Member {
  id: string;
  churchNumber: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  address: string | null;
  gender: string;
  employmentStatus: string | null;
  status: string;
  photoUrl: string | null;
  zoneId: string;
  communityId: string | null;
  ministryId: string | null;
  zone: { id: string; name: string };
  community: { id: string; name: string } | null;
  ministry: { id: string; name: string } | null;
  attendances: {
    id: string;
    serviceSession: { date: string };
    serviceType: { name: string };
  }[];
  visitationLogs: {
    id: string;
    visitType: string;
    visitDate: string;
    notes: string | null;
    outcome: string | null;
    visitedBy: { name: string | null } | null;
  }[];
}

interface Zone {
  id: string;
  name: string;
  communities: { id: string; name: string }[];
}

const VISIT_LABELS: Record<string, string> = {
  SICK: "Sick Visit",
  BEREAVED: "Bereavement",
  BIRTH: "Birth/New Baby",
  NEW_CONVERT: "New Convert",
  FOLLOW_UP: "Follow-up",
  WELFARE_CHECK: "Welfare Check",
};

export default function MemberDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [member, setMember] = useState<Member | null>(null);
  const [zones, setZones] = useState<Zone[]>([]);
  const [showEdit, setShowEdit] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchMember = useCallback(async () => {
    const res = await fetch(`/api/members/${id}`);
    if (res.ok) setMember(await res.json());
  }, [id]);

  useEffect(() => {
    fetchMember();
    fetch("/api/zones").then((r) => r.json()).then(setZones);
  }, [fetchMember]);

  async function handleDelete() {
    setDeleting(true);
    await fetch(`/api/members/${id}`, { method: "DELETE" });
    router.push("/members");
  }

  async function handleDeleteAttendance(attId: string) {
    await fetch(`/api/attendance/${attId}`, { method: "DELETE" });
    fetchMember();
  }

  if (!member) {
    return <div className="p-8 text-center text-gray-400">Loading...</div>;
  }

  const now = new Date();
  const threeMonthsAgo = new Date(now);
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  const lastAtt = member.attendances[0];
  const lastDate = lastAtt?.serviceSession?.date ?? null;
  const consistent = member.attendances.filter(
    (a) => new Date(a.serviceSession.date) >= threeMonthsAgo
  ).length >= 8;
  const color = computeAttendanceColor(lastDate ? new Date(lastDate) : null, consistent);

  const memberForEdit = {
    ...member,
    zoneId: member.zone.id,
    communityId: member.community?.id ?? null,
    ministryId: member.ministry?.id ?? null,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/members" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1 flex items-center gap-3">
          <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 border border-gray-200 flex-shrink-0 relative">
            {member.photoUrl ? (
              <Image src={member.photoUrl} alt="Profile" fill className="object-cover" unoptimized />
            ) : (
              <User className="w-6 h-6 text-gray-300 absolute inset-0 m-auto" />
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {member.firstName} {member.lastName}
            </h1>
            <p className="text-gray-500 text-sm">Church No: {member.churchNumber}</p>
          </div>
          <AttendanceBadge color={color} />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowEdit(true)}
            className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
          >
            <Pencil size={14} />
            Edit
          </button>
          <button
            onClick={() => setConfirmDelete(true)}
            className="flex items-center gap-2 px-3 py-2 border border-red-200 rounded-lg text-sm text-red-600 hover:bg-red-50"
          >
            <Trash2 size={14} />
            Delete
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Member Info */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Member Information</h2>
          <dl className="space-y-3 text-sm">
            {[
              ["Church Number", <span className="font-mono">{member.churchNumber}</span>],
              ["Full Name", `${member.firstName} ${member.lastName}`],
              ["Gender", member.gender === "M" ? "Male" : "Female"],
              ["Phone", member.phone ?? "—"],
              ["Address", member.address ?? "—"],
              ["Employment", member.employmentStatus ?? "—"],
              ["Zone", member.zone.name],
              ["Community", member.community?.name ?? "—"],
              ["Ministry", member.ministry?.name ?? "—"],
            ].map(([label, value]) => (
              <div key={String(label)}>
                <dt className="text-gray-500">{label}</dt>
                <dd className="font-medium">{value}</dd>
              </div>
            ))}
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
            <div className="space-y-1 max-h-80 overflow-y-auto">
              {member.attendances.map((att) => (
                <div key={att.id} className="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-0 group">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{att.serviceType.name}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(att.serviceSession.date).toLocaleDateString("en-GH", {
                        weekday: "short", month: "short", day: "numeric", year: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full" />
                    <button
                      onClick={() => handleDeleteAttendance(att.id)}
                      className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all"
                      title="Remove attendance record"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
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
                  {log.outcome && <p className="text-xs text-gray-500 mt-1">Outcome: {log.outcome}</p>}
                  {log.visitedBy && <p className="text-xs text-gray-400 mt-1">By: {log.visitedBy.name}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete confirm */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <h3 className="font-bold text-gray-900 text-lg">Delete Member?</h3>
            <p className="text-sm text-gray-600">
              This will permanently delete <strong>{member.firstName} {member.lastName}</strong> and all
              their attendance and visitation records. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-60"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showEdit && (
        <AddMemberModal
          zones={zones}
          member={memberForEdit}
          onClose={() => setShowEdit(false)}
          onSuccess={() => {
            setShowEdit(false);
            fetchMember();
          }}
        />
      )}
    </div>
  );
}
