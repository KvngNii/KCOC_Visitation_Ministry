"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Search, Check } from "lucide-react";

interface Zone {
  id: string;
  name: string;
  communities: { id: string; name: string }[];
}

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
  const [zones, setZones] = useState<Zone[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [serviceTypeId, setServiceTypeId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [filterZone, setFilterZone] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/service-types").then((r) => r.json()),
      fetch("/api/zones").then((r) => r.json()),
    ]).then(([st, z]) => {
      setServiceTypes(st);
      setZones(z);
      if (st.length > 0) setServiceTypeId(st[0].id);
    });
  }, []);

  const fetchMembers = useCallback(async () => {
    const params = new URLSearchParams();
    if (filterZone) params.set("zoneId", filterZone);
    if (search) params.set("search", search);
    const res = await fetch(`/api/members?${params}`);
    const data = await res.json();
    setMembers(data);
  }, [filterZone, search]);

  useEffect(() => {
    if (step === "record") fetchMembers();
  }, [step, fetchMembers]);

  useEffect(() => {
    if (step === "record") {
      const timer = setTimeout(fetchMembers, 300);
      return () => clearTimeout(timer);
    }
  }, [search, filterZone, step, fetchMembers]);

  function toggleMember(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll() {
    setSelected(new Set(members.map((m) => m.id)));
  }

  function clearAll() {
    setSelected(new Set());
  }

  async function handleSubmit() {
    if (selected.size === 0) return;
    setLoading(true);

    const res = await fetch("/api/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        memberIds: Array.from(selected),
        serviceTypeId,
        date,
        notes,
      }),
    });

    setLoading(false);
    if (res.ok) onSuccess();
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
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
                Select Members →
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="p-4 border-b border-gray-200 space-y-3">
              <div className="flex gap-2 flex-wrap">
                <div className="relative flex-1 min-w-48">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search members..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <select
                  value={filterZone}
                  onChange={(e) => setFilterZone(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Zones</option>
                  {zones.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}
                </select>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">
                  <span className="font-semibold text-blue-700">{selected.size}</span> selected
                  {" "}of {members.length} members
                </span>
                <div className="flex gap-3">
                  <button onClick={selectAll} className="text-blue-600 hover:underline text-xs">Select All</button>
                  <button onClick={clearAll} className="text-gray-500 hover:underline text-xs">Clear</button>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {members.map((member) => {
                  const isSelected = selected.has(member.id);
                  return (
                    <button
                      key={member.id}
                      onClick={() => toggleMember(member.id)}
                      className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-colors ${
                        isSelected
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 ${
                        isSelected ? "bg-blue-600" : "border-2 border-gray-300"
                      }`}>
                        {isSelected && <Check size={12} className="text-white" />}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm text-gray-900 truncate">
                          {member.firstName} {member.lastName}
                        </p>
                        <p className="text-xs text-gray-500 font-mono">{member.churchNumber}</p>
                      </div>
                    </button>
                  );
                })}
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
                onClick={handleSubmit}
                disabled={selected.size === 0 || loading}
                className="flex-1 px-4 py-2 bg-blue-700 text-white rounded-lg text-sm font-medium hover:bg-blue-800 disabled:opacity-60"
              >
                {loading ? "Saving..." : `Save Attendance (${selected.size} members)`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
