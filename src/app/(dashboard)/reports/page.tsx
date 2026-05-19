"use client";

import { useEffect, useState, useCallback } from "react";
import { BarChart3, Download } from "lucide-react";
import { AttendanceBadge, AttendanceColorDot } from "@/components/AttendanceBadge";
import { AttendanceColor } from "@/lib/attendance-color";
import Link from "next/link";

interface Zone {
  id: string;
  name: string;
}

interface MemberReport {
  id: string;
  churchNumber: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  gender: string;
  attendanceColor: AttendanceColor;
  lastAttendanceDate: string | null;
  zone: { name: string };
  community: { name: string } | null;
  ministry: { name: string } | null;
}

interface Summary {
  total: number;
  green: number;
  yellow: number;
  orange: number;
  red: number;
  grey: number;
}

export default function ReportsPage() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [members, setMembers] = useState<MemberReport[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [filterZone, setFilterZone] = useState("");
  const [filterColor, setFilterColor] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/zones").then((r) => r.json()).then(setZones);
  }, []);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterZone) params.set("zoneId", filterZone);
    if (filterColor) params.set("color", filterColor);
    const res = await fetch(`/api/reports/attendance?${params}`);
    const data = await res.json();
    setMembers(data.members);
    setSummary(data.summary);
    setLoading(false);
  }, [filterZone, filterColor]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  function downloadCSV() {
    const headers = ["Church No.", "First Name", "Last Name", "Gender", "Phone", "Zone", "Community", "Ministry", "Attendance Status", "Last Attended"];
    const rows = members.map((m) => [
      m.churchNumber,
      m.firstName,
      m.lastName,
      m.gender === "M" ? "Male" : "Female",
      m.phone ?? "",
      m.zone.name,
      m.community?.name ?? "",
      m.ministry?.name ?? "",
      m.attendanceColor,
      m.lastAttendanceDate ? new Date(m.lastAttendanceDate).toLocaleDateString("en-GH") : "Never",
    ]);
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kcoc-attendance-report-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const COLOR_FILTERS = [
    { value: "", label: "All Statuses" },
    { value: "GREEN", label: "Green (Active)" },
    { value: "YELLOW", label: "Yellow (1 month absent)" },
    { value: "ORANGE", label: "Orange (2 months absent)" },
    { value: "RED", label: "Red (3+ months absent)" },
    { value: "GREY", label: "Grey (No data)" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-500 text-sm mt-1">Attendance status and member overview</p>
        </div>
        <button
          onClick={downloadCSV}
          className="flex items-center gap-2 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
        >
          <Download size={16} />
          Export CSV
        </button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { key: "total", label: "Total", color: "text-gray-800", bg: "bg-gray-50" },
            { key: "green", label: "Active", color: "text-green-700", bg: "bg-green-50" },
            { key: "yellow", label: "1 Month", color: "text-yellow-700", bg: "bg-yellow-50" },
            { key: "orange", label: "2 Months", color: "text-orange-700", bg: "bg-orange-50" },
            { key: "red", label: "3+ Months", color: "text-red-700", bg: "bg-red-50" },
            { key: "grey", label: "No Data", color: "text-gray-500", bg: "bg-gray-100" },
          ].map(({ key, label, color, bg }) => (
            <div key={key} className={`${bg} rounded-xl p-4 text-center`}>
              <p className={`text-2xl font-bold ${color}`}>{summary[key as keyof Summary]}</p>
              <p className="text-xs text-gray-500 mt-1">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <select
          value={filterZone}
          onChange={(e) => setFilterZone(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Zones</option>
          {zones.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}
        </select>
        <select
          value={filterColor}
          onChange={(e) => setFilterColor(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {COLOR_FILTERS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
        </select>
      </div>

      {/* Members Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : members.length === 0 ? (
          <div className="p-8 text-center">
            <BarChart3 className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400">No members found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Church No.</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Name</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden md:table-cell">Zone</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden lg:table-cell">Community</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden lg:table-cell">Last Attended</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {members.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <AttendanceColorDot color={member.attendanceColor} />
                        <AttendanceBadge color={member.attendanceColor} />
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono font-medium text-gray-900">{member.churchNumber}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {member.firstName} {member.lastName}
                    </td>
                    <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{member.zone.name}</td>
                    <td className="px-4 py-3 text-gray-600 hidden lg:table-cell">{member.community?.name ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-500 hidden lg:table-cell">
                      {member.lastAttendanceDate
                        ? new Date(member.lastAttendanceDate).toLocaleDateString("en-GH", { day: "numeric", month: "short", year: "numeric" })
                        : "Never"}
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/members/${member.id}`} className="text-blue-600 hover:underline text-xs font-medium">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
