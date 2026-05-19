"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Heart } from "lucide-react";
import { LogVisitModal } from "@/components/LogVisitModal";

interface VisitLog {
  id: string;
  visitType: string;
  visitDate: string;
  notes: string | null;
  outcome: string | null;
  member: {
    firstName: string;
    lastName: string;
    churchNumber: string;
    zone: { name: string };
    community: { name: string } | null;
  };
  visitedBy: { name: string } | null;
}

const VISIT_LABELS: Record<string, string> = {
  SICK: "Sick Visit",
  BEREAVED: "Bereavement",
  BIRTH: "New Baby/Birth",
  NEW_CONVERT: "New Convert",
  FOLLOW_UP: "Follow-up",
  WELFARE_CHECK: "Welfare Check",
};

const VISIT_COLORS: Record<string, string> = {
  SICK: "bg-red-100 text-red-700",
  BEREAVED: "bg-gray-100 text-gray-700",
  BIRTH: "bg-pink-100 text-pink-700",
  NEW_CONVERT: "bg-green-100 text-green-700",
  FOLLOW_UP: "bg-yellow-100 text-yellow-700",
  WELFARE_CHECK: "bg-blue-100 text-blue-700",
};

export default function VisitationPage() {
  const [logs, setLogs] = useState<VisitLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/visitation");
    const data = await res.json();
    setLogs(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Visitation Logs</h1>
          <p className="text-gray-500 text-sm mt-1">Track welfare visits — sick, bereaved, births, new converts</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition-colors text-sm font-medium"
        >
          <Plus size={16} />
          Log Visit
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center">
            <Heart className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400">No visitation records yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Visit Type</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Member</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden md:table-cell">Zone / Community</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Date</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden lg:table-cell">Outcome</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden lg:table-cell">Visited By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${VISIT_COLORS[log.visitType] ?? "bg-gray-100 text-gray-700"}`}>
                        {VISIT_LABELS[log.visitType] ?? log.visitType}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{log.member.firstName} {log.member.lastName}</p>
                      <p className="text-xs text-gray-500 font-mono">{log.member.churchNumber}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600 hidden md:table-cell">
                      <p>{log.member.zone.name}</p>
                      {log.member.community && <p className="text-xs text-gray-400">{log.member.community.name}</p>}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {new Date(log.visitDate).toLocaleDateString("en-GH", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-4 py-3 text-gray-600 hidden lg:table-cell">{log.outcome ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-600 hidden lg:table-cell">{log.visitedBy?.name ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <LogVisitModal
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            fetchLogs();
          }}
        />
      )}
    </div>
  );
}
