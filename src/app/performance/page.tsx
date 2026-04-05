"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Building2,
  Search,
  Loader2,
  X,
  BarChart3,
  ArrowRight,
  TrendingUp,
  XCircle
} from "lucide-react";

interface AssemblyStat {
  name: string;
  total: number;
  accepted: number;
  rejected: number;
  pending: number;
}

interface DashboardData {
  assemblyStats: AssemblyStat[];
}

export default function PerformancePage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetch("/api/dashboard")
      .then((res) => res.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="relative">
          <div className="absolute inset-0 bg-primary/30 blur-2xl rounded-full"></div>
          <div className="glass-panel p-6 rounded-3xl flex flex-col items-center gap-4 relative z-10 border border-white/10">
            <Loader2 className="animate-spin text-primary" size={48} strokeWidth={1.5} />
            <span className="text-muted text-sm font-medium tracking-wide pb-1">Loading Performance Data...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="glass-panel p-8 rounded-3xl border border-red-500/20 text-center space-y-4">
          <XCircle className="text-red-400 mx-auto" size={48} strokeWidth={1.5} />
          <p className="text-muted tracking-wide">Failed to load assembly data.</p>
        </div>
      </div>
    );
  }

  const filteredAssemblies = data.assemblyStats.filter((a) =>
    a.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 md:p-8 xl:p-12 max-w-[1600px] mx-auto min-h-screen">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-2 drop-shadow-sm glow-text">
            Assembly Performance
          </h1>
          <p className="text-muted text-lg font-light tracking-wide max-w-2xl">
            Detailed breakdown and analytics for all assembly constituencies.
          </p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="glass-panel rounded-3xl border border-white/10 shadow-2xl overflow-hidden flex flex-col h-[750px] max-h-[75vh]">
        <div className="glass-header px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
              <BarChart3 size={20} className="text-primary-light" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Performance Statistics</h2>
              <p className="text-sm text-muted/80">Search and sort through constituent processing data</p>
            </div>
          </div>
          <div className="relative group w-full sm:w-80">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search size={16} className="text-muted group-focus-within:text-primary-light transition-colors" />
            </div>
            <input
              type="text"
              placeholder="Search by assembly name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="glass-input block w-full pl-11 pr-10 py-3 rounded-xl text-sm transition-all focus:ring-2 focus:ring-primary/40 focus:border-primary/50"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-muted hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-auto overflow-x-auto p-0">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="sticky top-0 z-20">
              <tr className="glass-header">
                <th className="py-5 px-6 font-semibold text-muted text-xs uppercase tracking-wider w-16 text-center border-b border-white/5">#</th>
                <th className="py-5 px-6 font-semibold text-white/80 text-xs uppercase tracking-wider border-b border-white/5">Assembly Prefecture</th>
                <th className="py-5 px-6 font-semibold text-blue-300 text-xs uppercase tracking-wider text-center border-b border-white/5">Total Registered</th>
                <th className="py-5 px-6 font-semibold text-emerald-300 text-xs uppercase tracking-wider text-center border-b border-white/5">Successfully Accepted</th>
                <th className="py-5 px-6 font-semibold text-rose-300 text-xs uppercase tracking-wider text-center border-b border-white/5">Requires Attention / Rejected</th>
                <th className="py-5 px-6 font-semibold text-amber-300 text-xs uppercase tracking-wider text-center border-b border-white/5">Pending Final Review</th>
                <th className="py-5 px-6 font-semibold text-muted text-xs uppercase tracking-wider text-center border-b border-white/5">Action Panel</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredAssemblies.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-32 text-center">
                    <div className="flex flex-col items-center justify-center text-muted">
                      <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mb-5 border border-white/10 shadow-inner">
                        <Building2 size={40} className="opacity-50" />
                      </div>
                      <p className="text-xl font-medium text-white/70">No assemblies found</p>
                      <p className="text-sm mt-2 text-muted/80">Try modifying your search criteria or check system data.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAssemblies.map((assembly, idx) => (
                  <tr
                    key={assembly.name}
                    className="group hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="py-4 px-6 text-muted/70 text-center text-xs font-mono">{idx + 1}</td>
                    <td className="py-4 px-6 font-medium text-white/90">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-xs font-bold text-muted group-hover:text-primary-light group-hover:border-primary/30 group-hover:bg-primary/10 transition-all shadow-sm">
                          {assembly.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-base group-hover:text-white transition-colors">{assembly.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className="inline-flex items-center justify-center bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-lg px-4 py-1.5 font-bold min-w-[3.5rem] shadow-sm text-base">
                        {assembly.total}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className="inline-flex items-center justify-center bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg px-4 py-1.5 font-bold min-w-[3.5rem] shadow-sm text-base">
                        {assembly.accepted}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className="inline-flex items-center justify-center bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg px-4 py-1.5 font-bold min-w-[3.5rem] shadow-sm text-base">
                        {assembly.rejected}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className="inline-flex items-center justify-center bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-lg px-4 py-1.5 font-bold min-w-[3.5rem] shadow-sm text-base">
                        {assembly.pending}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <Link
                        href={`/voters?assembly=${encodeURIComponent(assembly.name)}`}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-white/5 hover:bg-primary hover:text-white text-muted transition-all border border-white/5 hover:border-transparent group-hover:shadow-[0_0_15px_rgba(139,92,246,0.3)] w-32"
                      >
                        Inspect DB <ArrowRight size={14} className="opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        <div className="glass-header px-8 py-5 flex items-center justify-between text-xs text-muted/70">
          <p>
            Showing <span className="text-white/90 font-bold">{filteredAssemblies.length}</span> out of <span className="text-white/90 font-bold">{data.assemblyStats.length}</span> assemblies
          </p>
          <div className="flex items-center gap-2 font-medium">
            <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"></div>
            Secure DB Connection Active
          </div>
        </div>
      </div>
    </div>
  );
}
