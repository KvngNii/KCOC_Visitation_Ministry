"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";

interface Zone {
  id: string;
  name: string;
  communities: { id: string; name: string }[];
}

interface AddMemberModalProps {
  zones: Zone[];
  onClose: () => void;
  onSuccess: () => void;
}

const MINISTRIES = [
  "Visitation Ministry",
  "Worship Ministry",
  "Youth Ministry",
  "Women's Ministry",
  "Men's Ministry",
  "Children's Ministry",
  "Evangelism Ministry",
  "Media Ministry",
];

export function AddMemberModal({ zones, onClose, onSuccess }: AddMemberModalProps) {
  const [form, setForm] = useState({
    churchNumber: "",
    firstName: "",
    lastName: "",
    phone: "",
    address: "",
    gender: "M",
    employmentStatus: "",
    zoneId: "",
    communityId: "",
    ministryId: "",
  });
  const [communities, setCommunities] = useState<{ id: string; name: string }[]>([]);
  const [ministries, setMinistries] = useState<{ id: string; name: string }[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/ministries")
      .then((r) => r.json())
      .then(setMinistries)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (form.zoneId) {
      const zone = zones.find((z) => z.id === form.zoneId);
      setCommunities(zone?.communities ?? []);
      setForm((f) => ({ ...f, communityId: "" }));
    }
  }, [form.zoneId, zones]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Failed to add member");
    } else {
      onSuccess();
    }
  }

  const field = (
    label: string,
    key: keyof typeof form,
    type = "text",
    required = false
  ) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        value={form[key]}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
        required={required}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">Add New Member</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {field("Church Number", "churchNumber", "text", true)}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Gender <span className="text-red-500">*</span>
              </label>
              <select
                value={form.gender}
                onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="M">Male</option>
                <option value="F">Female</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {field("First Name", "firstName", "text", true)}
            {field("Last Name", "lastName", "text", true)}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {field("Phone Number", "phone", "tel")}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Employment Status</label>
              <select
                value={form.employmentStatus}
                onChange={(e) => setForm((f) => ({ ...f, employmentStatus: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">Select...</option>
                <option>Employed</option>
                <option>Self Employed</option>
                <option>Student</option>
                <option>Unemployed</option>
                <option>Retired</option>
              </select>
            </div>
          </div>

          {field("Address", "address")}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Zone <span className="text-red-500">*</span>
              </label>
              <select
                value={form.zoneId}
                onChange={(e) => setForm((f) => ({ ...f, zoneId: e.target.value }))}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">Select zone...</option>
                {zones.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Community</label>
              <select
                value={form.communityId}
                onChange={(e) => setForm((f) => ({ ...f, communityId: e.target.value }))}
                disabled={!form.zoneId}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:bg-gray-100"
              >
                <option value="">Select community...</option>
                {communities.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ministry</label>
            <select
              value={form.ministryId}
              onChange={(e) => setForm((f) => ({ ...f, ministryId: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">Select ministry...</option>
              {ministries.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-700 text-white rounded-lg text-sm font-medium hover:bg-blue-800 transition-colors disabled:opacity-60"
            >
              {loading ? "Adding..." : "Add Member"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
