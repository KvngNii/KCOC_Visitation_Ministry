"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, ClipboardCheck } from "lucide-react";
import { RecordAttendanceModal } from "@/components/RecordAttendanceModal";

interface Session {
  id: string;
  date: string;
  notes: string | null;
  serviceType: { name: string };
  _count: { attendances: number };
}

export default function AttendancePage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/attendance/sessions");
    const data = await res.json();
    setSessions(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Attendance</h1>
          <p className="text-gray-500 text-sm mt-1">Record and manage service attendance</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition-colors text-sm font-medium"
        >
          <Plus size={16} />
          Record Attendance
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <p className="text-sm font-semibold text-gray-700">Recent Service Sessions</p>
        </div>
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : sessions.length === 0 ? (
          <div className="p-8 text-center">
            <ClipboardCheck className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400">No service sessions recorded yet.</p>
            <button
              onClick={() => setShowModal(true)}
              className="mt-3 text-blue-600 hover:underline text-sm"
            >
              Record your first attendance
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {sessions.map((session) => (
              <div key={session.id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50">
                <div>
                  <p className="font-semibold text-gray-900">{session.serviceType.name}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(session.date).toLocaleDateString("en-GH", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                  {session.notes && <p className="text-xs text-gray-400 mt-0.5">{session.notes}</p>}
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">
                    <ClipboardCheck size={14} />
                    {session._count.attendances} present
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <RecordAttendanceModal
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            fetchSessions();
          }}
        />
      )}
    </div>
  );
}
