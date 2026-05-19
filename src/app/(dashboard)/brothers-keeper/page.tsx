"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, HandHeart } from "lucide-react";
import { BrothersKeeperModal } from "@/components/BrothersKeeperModal";

interface BKLog {
  id: string;
  checkDate: string;
  notes: string | null;
  outcome: string | null;
  member: {
    firstName: string;
    lastName: string;
    churchNumber: string;
    zone: { name: string };
    community: { name: string } | null;
  };
  checkedBy: { name: string } | null;
}

export default function BrothersKeeperPage() {
  const [logs, setLogs] = useState<BKLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/brothers-keeper");
    const data = await res.json();
    setLogs(data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Brother&apos;s Keeper</h1>
          <p className="text-gray-500 text-sm mt-1">Community-based personal check-ups and follow-ups</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition-colors text-sm font-medium"
        >
          <Plus size={16} />
          Log Check-up
        </button>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
        <strong>Brother&apos;s Keeper Program:</strong> Regular personal visits and check-ups on members within
        your community to ensure no one is left behind. (Galatians 6:2)
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center">
            <HandHeart className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400">No check-up records yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Member</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden md:table-cell">Zone / Community</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Date</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden lg:table-cell">Notes</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden lg:table-cell">Outcome</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden lg:table-cell">Checked By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{log.member.firstName} {log.member.lastName}</p>
                      <p className="text-xs text-gray-500 font-mono">{log.member.churchNumber}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600 hidden md:table-cell">
                      <p>{log.member.zone.name}</p>
                      {log.member.community && <p className="text-xs text-gray-400">{log.member.community.name}</p>}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {new Date(log.checkDate).toLocaleDateString("en-GH", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-4 py-3 text-gray-600 hidden lg:table-cell max-w-xs truncate">{log.notes ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-600 hidden lg:table-cell">{log.outcome ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-600 hidden lg:table-cell">{log.checkedBy?.name ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <BrothersKeeperModal
          onClose={() => setShowModal(false)}
          onSuccess={() => { setShowModal(false); fetchLogs(); }}
        />
      )}
    </div>
  );
}
