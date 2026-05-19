"use client";

import { useState, useEffect } from "react";
import { X, Search } from "lucide-react";

interface Member {
  id: string;
  churchNumber: string;
  firstName: string;
  lastName: string;
}

interface BrothersKeeperModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function BrothersKeeperModal({ onClose, onSuccess }: BrothersKeeperModalProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [search, setSearch] = useState("");
  const [memberId, setMemberId] = useState("");
  const [checkDate, setCheckDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [outcome, setOutcome] = useState("Visited");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    fetch(`/api/members?${params}`).then((r) => r.json()).then(setMembers);
  }, [search]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!memberId) { setError("Please select a member"); return; }
    setError("");
    setLoading(true);

    const res = await fetch("/api/brothers-keeper", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberId, checkDate, notes, outcome }),
    });

    setLoading(false);
    if (res.ok) onSuccess();
    else setError("Failed to save check-up record");
  }

  const selectedMember = members.find((m) => m.id === memberId);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">Log Brother&apos;s Keeper Check-up</h2>
          <button onClick={onClose}><X size={20} className="text-gray-400" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Member <span className="text-red-500">*</span></label>
            {selectedMember ? (
              <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div>
                  <p className="font-medium text-sm">{selectedMember.firstName} {selectedMember.lastName}</p>
                  <p className="text-xs text-gray-500 font-mono">{selectedMember.churchNumber}</p>
                </div>
                <button type="button" onClick={() => setMemberId("")}><X size={14} className="text-gray-400" /></button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search member..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                {search && (
                  <div className="border border-gray-200 rounded-lg max-h-32 overflow-y-auto">
                    {members.slice(0, 8).map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => { setMemberId(m.id); setSearch(""); }}
                        className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm border-b border-gray-100 last:border-0"
                      >
                        <span className="font-medium">{m.firstName} {m.lastName}</span>
                        <span className="text-gray-400 text-xs ml-2 font-mono">{m.churchNumber}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              value={checkDate}
              onChange={(e) => setCheckDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Outcome</label>
            <select
              value={outcome}
              onChange={(e) => setOutcome(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {["Visited", "Called", "Unreachable", "Planned"].map((o) => <option key={o}>{o}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Notes from the check-up..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={loading || !memberId} className="flex-1 px-4 py-2 bg-blue-700 text-white rounded-lg text-sm font-medium hover:bg-blue-800 disabled:opacity-60">
              {loading ? "Saving..." : "Save Check-up"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
