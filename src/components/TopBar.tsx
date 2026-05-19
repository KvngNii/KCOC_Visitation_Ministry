"use client";

import { signOut } from "next-auth/react";
import { LogOut, User } from "lucide-react";

interface TopBarProps {
  user?: {
    name?: string | null;
    email?: string | null;
    role?: string;
  };
}

export function TopBar({ user }: TopBarProps) {
  const role = (user as { role?: string })?.role ?? "User";
  const roleLabel = role
    .replace("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
      <div />
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
            <User size={16} className="text-blue-700" />
          </div>
          <div className="hidden sm:block">
            <p className="font-medium text-gray-900">{user?.name}</p>
            <p className="text-xs text-gray-500">{roleLabel}</p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-red-600 transition-colors"
        >
          <LogOut size={16} />
          <span className="hidden sm:inline">Sign Out</span>
        </button>
      </div>
    </header>
  );
}
