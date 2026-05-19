"use client";

import { useState, useEffect, useRef } from "react";
import { X, Camera, User } from "lucide-react";
import Image from "next/image";

interface Zone {
  id: string;
  name: string;
  communities: { id: string; name: string }[];
}

interface MemberForEdit {
  id: string;
  churchNumber: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  address: string | null;
  gender: string;
  employmentStatus: string | null;
  zoneId: string;
  communityId: string | null;
  ministryId: string | null;
  photoUrl: string | null;
  status: string;
}

interface AddMemberModalProps {
  zones: Zone[];
  onClose: () => void;
  onSuccess: (member?: MemberForEdit) => void;
  member?: MemberForEdit;
}

export function AddMemberModal({ zones, onClose, onSuccess, member }: AddMemberModalProps) {
  const isEdit = !!member;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    churchNumber: member?.churchNumber ?? "",
    firstName: member?.firstName ?? "",
    lastName: member?.lastName ?? "",
    phone: member?.phone ?? "",
    address: member?.address ?? "",
    gender: member?.gender ?? "M",
    employmentStatus: member?.employmentStatus ?? "",
    zoneId: member?.zoneId ?? "",
    communityId: member?.communityId ?? "",
    ministryId: member?.ministryId ?? "",
    status: member?.status ?? "ACTIVE",
  });

  const [communities, setCommunities] = useState<{ id: string; name: string }[]>([]);
  const [ministries, setMinistries] = useState<{ id: string; name: string }[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(member?.photoUrl ?? null);
  const [photoUploading, setPhotoUploading] = useState(false);

  useEffect(() => {
    fetch("/api/ministries")
      .then((r) => r.json())
      .then(setMinistries)
      .catch(() => {});
  }, []);

  useEffect(() => {
    const zone = zones.find((z) => z.id === form.zoneId);
    setCommunities(zone?.communities ?? []);
    if (!isEdit) setForm((f) => ({ ...f, communityId: "" }));
  }, [form.zoneId, zones, isEdit]);

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !member?.id) return;
    setPhotoUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("memberId", member.id);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    setPhotoUploading(false);
    if (res.ok) setPhotoUrl(data.url + `?t=${Date.now()}`);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const url = isEdit ? `/api/members/${member.id}` : "/api/members";
    const method = isEdit ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Failed to save member");
    } else {
      onSuccess(data);
    }
  }

  const field = (label: string, key: keyof typeof form, type = "text", required = false) => (
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
          <h2 className="text-lg font-bold text-gray-900">
            {isEdit ? "Edit Member" : "Add New Member"}
          </h2>
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

          {/* Photo upload — only in edit mode */}
          {isEdit && (
            <div className="flex items-center gap-4">
              <div className="relative w-20 h-20 rounded-full overflow-hidden bg-gray-100 border-2 border-gray-200 flex-shrink-0">
                {photoUrl ? (
                  <Image src={photoUrl} alt="Profile" fill className="object-cover" unoptimized />
                ) : (
                  <User className="w-10 h-10 text-gray-300 absolute inset-0 m-auto" />
                )}
                {photoUploading && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">Profile Photo</p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Camera size={14} />
                  {photoUrl ? "Change Photo" : "Upload Photo"}
                </button>
                <p className="text-xs text-gray-400 mt-1">JPG, PNG or WebP</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handlePhotoChange}
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Church Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.churchNumber}
                onChange={(e) => setForm((f) => ({ ...f, churchNumber: e.target.value }))}
                required
                disabled={isEdit}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
              />
            </div>
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
                  <option key={z.id} value={z.id}>{z.name}</option>
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
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ministry</label>
              <select
                value={form.ministryId}
                onChange={(e) => setForm((f) => ({ ...f, ministryId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">Select ministry...</option>
                {ministries.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
            {isEdit && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                  <option value="TRANSFERRED">Transferred</option>
                  <option value="DECEASED">Deceased</option>
                </select>
              </div>
            )}
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
              {loading ? "Saving..." : isEdit ? "Save Changes" : "Add Member"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
