"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, PhoneCall, Hexagon, LogOut, Menu, X } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/lib/auth";

const navItems = [
  { href: "/telecaller", label: "Dashboard", icon: LayoutDashboard },
  { href: "/telecaller/candidates", label: "Candidates", icon: PhoneCall },
];

export default function TelecallerNavbar() {
  const pathname = usePathname();
  const { logout, username } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-[1440px] mx-auto flex items-center justify-between h-16 px-4 md:px-8">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-md shadow-indigo-500/20">
            <Hexagon className="text-white fill-white/20" size={18} />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-base font-bold text-slate-900 tracking-tight leading-tight">Assembly</h1>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-indigo-500">Telecaller</span>
          </div>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/telecaller" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                }`}
              >
                <item.icon size={16} strokeWidth={isActive ? 2.2 : 1.8} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right side: user + logout */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center text-xs font-bold text-indigo-600">
              {(username || "T").charAt(0).toUpperCase()}
            </div>
            <span className="text-xs font-medium text-slate-600">{username || "Telecaller"}</span>
          </div>
          <button
            onClick={logout}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            title="Logout"
          >
            <LogOut size={16} />
          </button>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors"
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile Nav Dropdown */}
      {mobileOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white px-4 py-3 space-y-1">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/telecaller" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                }`}
              >
                <item.icon size={16} />
                {item.label}
              </Link>
            );
          })}
          <div className="sm:hidden flex items-center gap-2 px-4 py-2 text-xs text-slate-500">
            <div className="w-6 h-6 rounded-md bg-indigo-50 flex items-center justify-center text-[10px] font-bold text-indigo-600">
              {(username || "T").charAt(0).toUpperCase()}
            </div>
            {username || "Telecaller"}
          </div>
        </div>
      )}
    </header>
  );
}
