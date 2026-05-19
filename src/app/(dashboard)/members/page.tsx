"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Search, Plus, Filter, Pencil, Trash2 } from "lucide-react";
import { AttendanceBadge } from "@/components/AttendanceBadge";
import { computeAttendanceColor } from "@/lib/attendance-color";
import { AddMemberModal } from "@/components/AddMemberModal";

interface Zone {
  id: string;
  name: string;
  communities: { id: string; name: string }[];
}

interface Member {
  id: string;
  churchNumber: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  gender: string;
  status: string;
  zone: { id: string; name: string };
  community: { id: string; name: string } | null;
  ministry: { id: string; name: string } | null;
  attendances: { serviceSession: { date: string } }[];
}

interface MemberFull {
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
}

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [search, setSearch] = useState("");
  const [filterZone, setFilterZone] = useState("");
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editMember, setEditMember] = useState<MemberFull | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Member | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function openEdit(id: string) {
    const res = await fetch(`/api/members/${id}`);
    if (res.ok) setEditMember(await res.json());
  }

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (filterZone) params.set("zoneId", filterZone);
    const res = await fetch(`/api/members?${params}`);
    const data = await res.json();
    setMembers(data);
    setLoading(false);
  }, [search, filterZone]);

  useEffect(() => {
    fetch("/api/zones")
      .then((r) => r.json())
      .then(setZones);
  }, []);

  useEffect(() => {
    const timer = setTimeout(fetchMembers, 300);
    return () => clearTimeout(timer);
  }, [fetchMembers]);

  const now = new Date();
  const threeMonthsAgo = new Date(now);
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  function getMemberColor(member: Member) {
    const lastAtt = member.attendances[0];
    const lastDate = lastAtt?.serviceSession?.date ?? null;
    const consistent =
      member.attendances.filter((a) => new Date(a.serviceSession.date) >= threeMonthsAgo).length >= 8;
    return computeAttendanceColor(lastDate ? new Date(lastDate) : null, consistent);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    await fetch(`/api/members/${deleteTarget.id}`, { method: "DELETE" });
    setDeleting(false);
    setDeleteTarget(null);
    fetchMembers();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Members</h1>
          <p className="text-gray-500 text-sm mt-1">{members.length} members found</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition-colors text-sm font-medium"
        >
          <Plus size={16} />
          Add Member
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, number, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="relative">
          <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <select
            value={filterZone}
            onChange={(e) => setFilterZone(e.target.value)}
            className="pl-9 pr-8 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white appearance-none"
          >
            <option value="">All Zones</option>
            {zones.map((z) => (
              <option key={z.id} value={z.id}>
                {z.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Members Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : members.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No members found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Church No.</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Name</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden md:table-cell">Phone</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden lg:table-cell">Zone</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden xl:table-cell">Community</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden xl:table-cell">Ministry</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {members.map((member) => {
                  const color = getMemberColor(member);
                  return (
                    <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <AttendanceBadge color={color} />
                      </td>
                      <td className="px-4 py-3 font-mono font-medium text-gray-900">{member.churchNumber}</td>
                      <td className="px-4 py-3">
                        <span className="font-medium text-gray-900">
                          {member.firstName} {member.lastName}
                        </span>
                        <span className="ml-2 text-xs text-gray-400">{member.gender === "M" ? "♂" : "♀"}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{member.phone ?? "—"}</td>
                      <td className="px-4 py-3 text-gray-600 hidden lg:table-cell">{member.zone.name}</td>
                      <td className="px-4 py-3 text-gray-600 hidden xl:table-cell">{member.community?.name ?? "—"}</td>
                      <td className="px-4 py-3 text-gray-600 hidden xl:table-cell">{member.ministry?.name ?? "—"}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/members/${member.id}`}
                            className="text-blue-600 hover:text-blue-800 font-medium text-xs"
                          >
                            View
                          </Link>
                          <button
                            onClick={() => openEdit(member.id)}
                            className="text-gray-400 hover:text-blue-600 transition-colors"
                            title="Edit"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(member)}
                            className="text-gray-400 hover:text-red-600 transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showAddModal && (
        <AddMemberModal
          zones={zones}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => { setShowAddModal(false); fetchMembers(); }}
        />
      )}

      {editMember && (
        <AddMemberModal
          zones={zones}
          member={editMember}
          onClose={() => setEditMember(null)}
          onSuccess={() => { setEditMember(null); fetchMembers(); }}
        />
      )}

      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <h3 className="font-bold text-gray-900 text-lg">Delete Member?</h3>
            <p className="text-sm text-gray-600">
              This will permanently delete <strong>{deleteTarget.firstName} {deleteTarget.lastName}</strong> and all
              their records. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
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
    </div>
  );
}
