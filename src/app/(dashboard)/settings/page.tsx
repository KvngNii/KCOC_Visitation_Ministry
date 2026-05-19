"use client";

import { useEffect, useState } from "react";
import { Settings, Save, Plus, Trash2 } from "lucide-react";

interface Threshold {
  id: string;
  level: string;
  months: number;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  zone: { name: string } | null;
}

export default function SettingsPage() {
  const [thresholds, setThresholds] = useState<Threshold[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({ name: "", email: "", password: "", role: "USHER" });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/settings/thresholds").then((r) => r.json()).then(setThresholds);
    fetch("/api/users").then((r) => r.json()).then(setUsers);
  }, []);

  async function saveThresholds() {
    setSaving(true);
    const res = await fetch("/api/settings/thresholds", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(thresholds),
    });
    setSaving(false);
    setMessage(res.ok ? "Thresholds saved!" : "Failed to save");
    setTimeout(() => setMessage(""), 3000);
  }

  async function addUser(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newUser),
    });
    if (res.ok) {
      setShowAddUser(false);
      setNewUser({ name: "", email: "", password: "", role: "USHER" });
      fetch("/api/users").then((r) => r.json()).then(setUsers);
    }
  }

  const ROLES = [
    { value: "ADMIN", label: "Admin" },
    { value: "MINISTRY_LEADER", label: "Ministry Leader" },
    { value: "ZONAL_LEADER", label: "Zonal Leader" },
    { value: "COMMUNITY_LEADER", label: "Community Leader" },
    { value: "USHER", label: "Usher" },
  ];

  const LEVEL_LABELS: Record<string, string> = {
    YELLOW: "Yellow Alert (1 month)",
    ORANGE: "Orange Alert (2 months)",
    RED: "Red Alert (3 months)",
  };

  const LEVEL_COLORS: Record<string, string> = {
    YELLOW: "text-yellow-700 bg-yellow-50 border-yellow-200",
    ORANGE: "text-orange-700 bg-orange-50 border-orange-200",
    RED: "text-red-700 bg-red-50 border-red-200",
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 text-sm mt-1">Configure system-wide settings</p>
      </div>

      {/* Absence Thresholds */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Settings size={18} className="text-gray-600" />
          <h2 className="font-semibold text-gray-900">Absence Alert Thresholds</h2>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Configure how many months of absence trigger each color indicator.
        </p>

        {message && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded-lg text-sm mb-4">
            {message}
          </div>
        )}

        <div className="space-y-3">
          {thresholds.map((t, i) => (
            <div key={t.id} className={`flex items-center justify-between p-4 rounded-lg border ${LEVEL_COLORS[t.level] ?? "bg-gray-50 border-gray-200"}`}>
              <span className="font-medium text-sm">{LEVEL_LABELS[t.level] ?? t.level}</span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={12}
                  value={t.months}
                  onChange={(e) => {
                    const newT = [...thresholds];
                    newT[i] = { ...newT[i], months: Number(e.target.value) };
                    setThresholds(newT);
                  }}
                  className="w-16 px-2 py-1 border border-gray-300 rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
                <span className="text-sm text-gray-500">months</span>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={saveThresholds}
          disabled={saving}
          className="mt-4 flex items-center gap-2 bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-800 disabled:opacity-60"
        >
          <Save size={14} />
          {saving ? "Saving..." : "Save Thresholds"}
        </button>
      </div>

      {/* User Management */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">System Users</h2>
          <button
            onClick={() => setShowAddUser(!showAddUser)}
            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
          >
            <Plus size={16} />
            Add User
          </button>
        </div>

        {showAddUser && (
          <form onSubmit={addUser} className="mb-4 p-4 bg-gray-50 rounded-lg space-y-3">
            <h3 className="font-medium text-sm text-gray-800">New User</h3>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Full Name"
                value={newUser.name}
                onChange={(e) => setNewUser((u) => ({ ...u, name: e.target.value }))}
                required
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="email"
                placeholder="Email"
                value={newUser.email}
                onChange={(e) => setNewUser((u) => ({ ...u, email: e.target.value }))}
                required
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="password"
                placeholder="Password"
                value={newUser.password}
                onChange={(e) => setNewUser((u) => ({ ...u, password: e.target.value }))}
                required
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <select
                value={newUser.role}
                onChange={(e) => setNewUser((u) => ({ ...u, role: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowAddUser(false)} className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Cancel</button>
              <button type="submit" className="px-3 py-1.5 text-sm bg-blue-700 text-white rounded-lg hover:bg-blue-800">Add User</button>
            </div>
          </form>
        )}

        <div className="space-y-2">
          {users.map((user) => (
            <div key={user.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg">
              <div>
                <p className="font-medium text-sm text-gray-900">{user.name}</p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
              <span className="text-xs font-medium bg-blue-50 text-blue-700 px-2 py-1 rounded-full">
                {ROLES.find((r) => r.value === user.role)?.label ?? user.role}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Color Guide */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Attendance Color Guide</h2>
        <div className="space-y-3 text-sm">
          {[
            { color: "bg-green-500", label: "GREEN", desc: "Member has been consistently attending for 3+ months" },
            { color: "bg-yellow-400", label: "YELLOW", desc: "Member has been absent for 1 month" },
            { color: "bg-orange-500", label: "ORANGE", desc: "Member has been absent for 2 months" },
            { color: "bg-red-600", label: "RED", desc: "Member has been absent for 3+ months — requires urgent follow-up" },
            { color: "bg-gray-400", label: "GREY", desc: "No attendance data recorded yet" },
          ].map(({ color, label, desc }) => (
            <div key={label} className="flex items-center gap-3">
              <div className={`w-5 h-5 rounded-full ${color} flex-shrink-0`} />
              <div>
                <span className="font-semibold">{label}</span>
                <span className="text-gray-500 ml-2">{desc}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
