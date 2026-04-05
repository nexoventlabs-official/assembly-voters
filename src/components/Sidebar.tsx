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
        className="fixed top-4 left-4 z-50 md:hidden bg-zinc-900/80 backdrop-blur-md border border-white/10 text-white p-2.5 rounded-xl shadow-2xl glass-button"
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-72 glass-panel !bg-black/40 !backdrop-blur-2xl !border-r !border-white/5 border-l-0 border-t-0 border-b-0 text-sidebar-text z-40 transform transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 md:static md:z-auto flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.5)]`}
      >
        <div className="p-8 border-b border-white/5 relative overflow-hidden">
          {/* Subtle glow effect behind logo */}
          <div className="absolute top-1/2 left-1/4 w-32 h-32 bg-primary/20 rounded-full blur-3xl -translate-y-1/2"></div>
          
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/30">
              <Hexagon className="text-white fill-white/20" size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight glow-text">
                Assembly
              </h1>
              <span className="text-xs font-semibold uppercase tracking-widest text-primary-light">
                Workspace
              </span>
            </div>
          </div>
        </div>

        <div className="px-6 py-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted/60 mb-2 px-2">
            Main Menu
          </p>
        </div>

        <nav className="flex-1 px-4 space-y-1.5">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-300 relative overflow-hidden group ${
                  isActive
                    ? "text-white bg-primary/10 border-l-2 border-primary"
                    : "text-muted hover:text-white hover:bg-white/5 border-l-2 border-transparent"
                }`}
              >
                {isActive && (
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent"></div>
                )}
                <item.icon 
                  size={18} 
                  className={`relative z-10 transition-colors duration-300 ${
                    isActive ? "text-primary-light drop-shadow-[0_0_8px_rgba(167,139,250,0.5)]" : "group-hover:text-white"
                  }`} 
                />
                <span className="relative z-10">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="px-4 pb-4">
          <Suspense fallback={<div className="h-64 w-full bg-white/5 rounded-2xl animate-pulse mt-6 border border-white/5"></div>}>
            <SidebarMapWrapper />
          </Suspense>
        </div>

        <div className="p-6 border-t border-white/5 relative">
          <div className="flex items-center gap-3 w-full p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors cursor-pointer">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-accent to-primary flex items-center justify-center text-white font-bold text-xs shadow-md">
              AD
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">Administrator</p>
              <p className="text-xs text-muted truncate">admin@assembly</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
