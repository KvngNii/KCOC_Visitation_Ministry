"use client";

import { useState, useEffect, useRef } from "react";
import { X, UserCheck, Trash2 } from "lucide-react";

interface ServiceType {
  id: string;
  name: string;
}

interface Member {
  id: string;
  churchNumber: string;
  firstName: string;
  lastName: string;
  zone: { name: string };
}

interface RecordAttendanceModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function RecordAttendanceModal({ onClose, onSuccess }: RecordAttendanceModalProps) {
  const [step, setStep] = useState<"setup" | "record">("setup");
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [serviceTypeId, setServiceTypeId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");

  const [churchNumber, setChurchNumber] = useState("");
  const [feedback, setFeedback] = useState<{ type: "ok" | "err"; message: string } | null>(null);
  const [present, setPresent] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/service-types")
      .then((r) => r.json())
      .then((data) => {
        setServiceTypes(data);
        if (data.length > 0) setServiceTypeId(data[0].id);
      });
  }, []);

  useEffect(() => {
    if (step === "record") {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [step]);

  async function handleNumberSubmit(e: React.FormEvent) {
    e.preventDefault();
    const num = churchNumber.trim();
    if (!num) return;

    if (present.some((m) => m.churchNumber === num)) {
      setFeedback({ type: "err", message: `#${num} already marked present` });
      setChurchNumber("");
      return;
    }

    const res = await fetch(`/api/members?churchNumber=${encodeURIComponent(num)}`);
    const data = await res.json();

    if (!data || data.length === 0) {
      setFeedback({ type: "err", message: `No member found with number ${num}` });
    } else {
      const member = data[0] as Member;
      setPresent((prev) => [...prev, member]);
      setFeedback({ type: "ok", message: `${member.firstName} ${member.lastName} marked present` });
    }

    setChurchNumber("");
    setTimeout(() => setFeedback(null), 2500);
    inputRef.current?.focus();
  }

  function removeFromPresent(id: string) {
    setPresent((prev) => prev.filter((m) => m.id !== id));
  }

  async function handleSave() {
    if (present.length === 0) return;
    setLoading(true);

    const res = await fetch("/api/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        memberIds: present.map((m) => m.id),
        serviceTypeId,
        date,
        notes,
      }),
    });

    setLoading(false);
    if (res.ok) onSuccess();
  }

  const serviceTypeName = serviceTypes.find((s) => s.id === serviceTypeId)?.name ?? "";

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">Record Attendance</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        {step === "setup" ? (
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Service Type <span className="text-red-500">*</span>
              </label>
              <select
                value={serviceTypeId}
                onChange={(e) => setServiceTypeId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {serviceTypes.map((st) => (
                  <option key={st.id} value={st.id}>{st.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Communion Sunday, Special Service..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => setStep("record")}
                disabled={!serviceTypeId || !date}
                className="flex-1 px-4 py-2 bg-blue-700 text-white rounded-lg text-sm font-medium hover:bg-blue-800 disabled:opacity-60"
              >
                Start Recording →
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="px-6 py-3 bg-blue-50 border-b border-blue-100">
              <p className="text-sm font-medium text-blue-800">
                {serviceTypeName} —{" "}
                {new Date(date).toLocaleDateString("en-GH", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              </p>
            </div>

            <div className="p-6 space-y-4">
              <form onSubmit={handleNumberSubmit} className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Enter church number
                </label>
                <div className="flex gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={churchNumber}
                    onChange={(e) => setChurchNumber(e.target.value)}
                    placeholder="e.g. 1042"
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-lg font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoComplete="off"
                  />
                  <button
                    type="submit"
                    disabled={!churchNumber.trim()}
                    className="px-5 py-3 bg-blue-700 text-white rounded-lg font-medium hover:bg-blue-800 disabled:opacity-50"
                  >
                    Mark
                  </button>
                </div>

                {feedback && (
                  <p className={`text-sm font-medium px-3 py-2 rounded-lg ${
                    feedback.type === "ok"
                      ? "bg-green-50 text-green-700"
                      : "bg-red-50 text-red-700"
                  }`}>
                    {feedback.type === "ok" ? "✓ " : "✗ "}{feedback.message}
                  </p>
                )}
              </form>

              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-700">Present</p>
                  <span className="text-sm font-bold text-blue-700">{present.length}</span>
                </div>

                {present.length === 0 ? (
                  <div className="px-4 py-6 text-center text-gray-400 text-sm">
                    No members recorded yet. Enter a church number above.
                  </div>
                ) : (
                  <ul className="divide-y divide-gray-100 max-h-60 overflow-y-auto">
                    {[...present].reverse().map((member) => (
                      <li key={member.id} className="flex items-center justify-between px-4 py-2">
                        <div className="flex items-center gap-3">
                          <UserCheck size={15} className="text-green-600 flex-shrink-0" />
                          <div>
                            <span className="text-sm font-medium text-gray-900">
                              {member.firstName} {member.lastName}
                            </span>
                            <span className="ml-2 text-xs font-mono text-gray-500">#{member.churchNumber}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => removeFromPresent(member.id)}
                          className="text-gray-300 hover:text-red-500 transition-colors"
                          title="Remove"
                        >
                          <Trash2 size={14} />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => setStep("setup")}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                ← Back
              </button>
              <button
                onClick={handleSave}
                disabled={present.length === 0 || loading}
                className="flex-1 px-4 py-2 bg-blue-700 text-white rounded-lg text-sm font-medium hover:bg-blue-800 disabled:opacity-60"
              >
                {loading ? "Saving..." : `Save — ${present.length} member${present.length !== 1 ? "s" : ""} present`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
