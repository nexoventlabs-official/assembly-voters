"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Menu, X, Hexagon, BarChart3 } from "lucide-react";
import { useState, Suspense } from "react";
import SidebarMapWrapper from "./SidebarMapWrapper";

const navItems = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/performance", label: "Performance", icon: BarChart3 },
  { href: "/voters", label: "Voter Database", icon: Users },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed top-4 left-4 z-50 md:hidden bg-white border border-slate-200 text-slate-700 p-2.5 rounded-xl shadow-lg hover:shadow-xl transition-shadow"
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 md:hidden transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-screen w-[272px] bg-white border-r border-slate-200 text-sidebar-text z-40 transform transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 md:sticky md:z-auto flex flex-col shrink-0 overflow-y-auto`}
      >
        {/* Logo */}
        <div className="px-7 py-7 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-md shadow-indigo-500/20">
              <Hexagon className="text-white fill-white/20" size={20} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                Assembly
              </h1>
              <span className="text-[11px] font-semibold uppercase tracking-widest text-indigo-500">
                Admin Panel
              </span>
            </div>
          </div>
        </div>

        {/* Nav Label */}
        <div className="px-7 pt-6 pb-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Navigation
          </p>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 px-4 space-y-1">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-[13px] font-medium transition-all duration-200 group ${
                  isActive
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                }`}
              >
                <item.icon 
                  size={18} 
                  strokeWidth={isActive ? 2.2 : 1.8}
                  className={`transition-colors duration-200 ${
                    isActive ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600"
                  }`} 
                />
                <span>{item.label}</span>
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Map */}
        <div className="px-4 pb-4">
          <Suspense fallback={<div className="h-52 w-full bg-slate-50 rounded-2xl animate-pulse mt-4 border border-slate-100"></div>}>
            <SidebarMapWrapper />
          </Suspense>
        </div>

      </aside>
    </>
  );
}
