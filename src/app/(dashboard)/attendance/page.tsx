"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, ClipboardCheck, Pencil, Trash2, Users, X, UserCheck } from "lucide-react";
import { RecordAttendanceModal } from "@/components/RecordAttendanceModal";

interface Session {
  id: string;
  date: string;
  notes: string | null;
  serviceType: { name: string };
  _count: { attendances: number };
}

interface SessionDetail {
  id: string;
  date: string;
  notes: string | null;
  serviceType: { name: string };
  attendances: {
    id: string;
    member: {
      id: string;
      churchNumber: string;
      firstName: string;
      lastName: string;
      zone: { name: string };
    };
  }[];
}

export default function AttendancePage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editSession, setEditSession] = useState<Session | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Session | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [viewSession, setViewSession] = useState<SessionDetail | null>(null);
  const [editForm, setEditForm] = useState({ date: "", notes: "" });
  const [editSaving, setEditSaving] = useState(false);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/attendance/sessions");
    setSessions(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  async function handleViewSession(id: string) {
    const res = await fetch(`/api/attendance/sessions/${id}`);
    if (res.ok) setViewSession(await res.json());
  }

  async function handleDeleteAttendee(attId: string) {
    await fetch(`/api/attendance/${attId}`, { method: "DELETE" });
    if (viewSession) {
      setViewSession((s) => s ? {
        ...s,
        attendances: s.attendances.filter((a) => a.id !== attId),
      } : null);
      fetchSessions();
    }
  }

  async function handleDeleteSession() {
    if (!deleteTarget) return;
    setDeleting(true);
    await fetch(`/api/attendance/sessions/${deleteTarget.id}`, { method: "DELETE" });
    setDeleting(false);
    setDeleteTarget(null);
    fetchSessions();
  }

  function openEdit(session: Session) {
    setEditSession(session);
    setEditForm({
      date: session.date.split("T")[0],
      notes: session.notes ?? "",
    });
  }

  async function handleEditSave() {
    if (!editSession) return;
    setEditSaving(true);
    await fetch(`/api/attendance/sessions/${editSession.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });
    setEditSaving(false);
    setEditSession(null);
    fetchSessions();
  }

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
            <button onClick={() => setShowModal(true)} className="mt-3 text-blue-600 hover:underline text-sm">
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
                      weekday: "long", year: "numeric", month: "long", day: "numeric",
                    })}
                  </p>
                  {session.notes && <p className="text-xs text-gray-400 mt-0.5">{session.notes}</p>}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleViewSession(session.id)}
                    className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold hover:bg-blue-100"
                  >
                    <ClipboardCheck size={14} />
                    {session._count.attendances} present
                  </button>
                  <button
                    onClick={() => openEdit(session)}
                    className="text-gray-400 hover:text-blue-600 transition-colors"
                    title="Edit session"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(session)}
                    className="text-gray-400 hover:text-red-600 transition-colors"
                    title="Delete session"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* View attendees modal */}
      {viewSession && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <div>
                <p className="font-bold text-gray-900">{viewSession.serviceType.name}</p>
                <p className="text-sm text-gray-500">
                  {new Date(viewSession.date).toLocaleDateString("en-GH", {
                    weekday: "long", day: "numeric", month: "long", year: "numeric",
                  })}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-blue-700 flex items-center gap-1">
                  <Users size={15} /> {viewSession.attendances.length}
                </span>
                <button onClick={() => setViewSession(null)} className="text-gray-400 hover:text-gray-600">
                  <X size={20} />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {viewSession.attendances.length === 0 ? (
                <p className="text-center text-gray-400 py-8 text-sm">No attendees recorded.</p>
              ) : (
                <ul className="space-y-1">
                  {viewSession.attendances.map((att) => (
                    <li key={att.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 group">
                      <div className="flex items-center gap-3">
                        <UserCheck size={15} className="text-green-600 flex-shrink-0" />
                        <div>
                          <span className="text-sm font-medium text-gray-900">
                            {att.member.firstName} {att.member.lastName}
                          </span>
                          <span className="ml-2 text-xs font-mono text-gray-500">#{att.member.churchNumber}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteAttendee(att.id)}
                        className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all"
                        title="Remove from session"
                      >
                        <Trash2 size={13} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit session modal */}
      {editSession && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-900">Edit Session</h3>
              <button onClick={() => setEditSession(null)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Service Type</label>
              <p className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600">
                {editSession.serviceType.name}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                value={editForm.date}
                onChange={(e) => setEditForm((f) => ({ ...f, date: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <input
                type="text"
                value={editForm.notes}
                onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Optional notes..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setEditSession(null)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleEditSave}
                disabled={editSaving}
                className="flex-1 px-4 py-2 bg-blue-700 text-white rounded-lg text-sm font-medium hover:bg-blue-800 disabled:opacity-60"
              >
                {editSaving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete session confirm */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <h3 className="font-bold text-gray-900 text-lg">Delete Session?</h3>
            <p className="text-sm text-gray-600">
              This will delete the <strong>{deleteTarget.serviceType.name}</strong> session on{" "}
              <strong>
                {new Date(deleteTarget.date).toLocaleDateString("en-GH", {
                  day: "numeric", month: "long", year: "numeric",
                })}
              </strong>{" "}
              and all {deleteTarget._count.attendances} attendance records. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteSession}
                disabled={deleting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-60"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <RecordAttendanceModal
          onClose={() => setShowModal(false)}
          onSuccess={() => { setShowModal(false); fetchSessions(); }}
        />
      )}
    </div>
  );
}
