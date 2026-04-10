"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import {
  Building2,
  Search,
  Loader2,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  X,
  BarChart3,
  ArrowRight,
  ArrowUpRight,
  Download
} from "lucide-react";

interface AssemblyStat {
  name: string;
  total: number;
  accepted: number;
  rejected: number;
  pending: number;
}

interface DashboardData {
  totalAssemblies: number;
  totalVoters: number;
  totalAccepted: number;
  totalRejected: number;
  totalPending: number;
  assemblyStats: AssemblyStat[];
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    apiFetch("/api/dashboard")
      .then((res) => res.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center">
            <Loader2 className="animate-spin text-indigo-600" size={24} />
          </div>
          <p className="text-slate-400 text-sm font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center shadow-sm max-w-sm">
          <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <XCircle className="text-red-500" size={28} />
          </div>
          <h3 className="text-lg font-semibold text-slate-800 mb-1">Load Failed</h3>
          <p className="text-slate-500 text-sm">Failed to load dashboard data. Please try again.</p>
        </div>
      </div>
    );
  }

  const filteredAssemblies = data.assemblyStats.filter((a) =>
    a.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const statCards = [
    {
      label: "Total Voters",
      value: data.totalVoters,
      icon: Users,
      iconColor: "text-indigo-600",
      iconBg: "bg-indigo-50",
      accent: "indigo",
    },
    {
      label: "Accepted",
      value: data.totalAccepted,
      icon: CheckCircle,
      iconColor: "text-emerald-600",
      iconBg: "bg-emerald-50",
      accent: "emerald",
    },
    {
      label: "Rejected",
      value: data.totalRejected,
      icon: XCircle,
      iconColor: "text-rose-600",
      iconBg: "bg-rose-50",
      accent: "rose",
    },
    {
      label: "Pending",
      value: data.totalPending,
      icon: Clock,
      iconColor: "text-amber-600",
      iconBg: "bg-amber-50",
      accent: "amber",
    },
    {
      label: "Assemblies",
      value: data.totalAssemblies,
      icon: Building2,
      iconColor: "text-violet-600",
      iconBg: "bg-violet-50",
      accent: "violet",
    },
  ];

  return (
    <div className="p-6 md:p-8 xl:p-10 max-w-[1440px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">System Online</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Dashboard Overview
          </h1>
          <p className="text-slate-500 mt-1">
            Real-time insights across all assembly voter data.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={async () => {
              setDownloading(true);
              try {
                const res = await apiFetch("/api/voters/export");
                if (!res.ok) throw new Error("Export failed");
                const blob = await res.blob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                const today = new Date().toISOString().split("T")[0];
                a.download = `Accepted_Candidates_${today}.xlsx`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              } catch {
                alert("Failed to download. Please try again.");
              } finally {
                setDownloading(false);
              }
            }}
            disabled={downloading}
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-colors shadow-sm"
          >
            {downloading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Downloading...
              </>
            ) : (
              <>
                <Download size={16} />
                Download Accepted
              </>
            )}
          </button>
          <Link
            href="/voters"
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-colors shadow-sm"
          >
            View All Voters
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-md hover:border-slate-300 transition-all duration-200 group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`${stat.iconBg} ${stat.iconColor} w-10 h-10 rounded-xl flex items-center justify-center`}>
                <stat.icon size={20} strokeWidth={2} />
              </div>
              <ArrowUpRight size={16} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
            </div>
            <h3 className="text-3xl font-bold text-slate-900 tracking-tight">
              {stat.value.toLocaleString()}
            </h3>
            <p className="text-sm text-slate-500 font-medium mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Assembly Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Table Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
              <BarChart3 size={20} className="text-indigo-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Assembly Overview</h2>
              <p className="text-sm text-slate-400">{data.assemblyStats.length} constituencies tracked</p>
            </div>
          </div>
          <div className="relative w-full sm:w-72">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search assemblies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field w-full pl-10 pr-9 py-2.5 text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50/80">
                <th className="py-3 px-6 font-semibold text-slate-500 text-xs uppercase tracking-wider text-left">#</th>
                <th className="py-3 px-6 font-semibold text-slate-500 text-xs uppercase tracking-wider text-left">Assembly</th>
                <th className="py-3 px-6 font-semibold text-slate-500 text-xs uppercase tracking-wider text-center">Total</th>
                <th className="py-3 px-6 font-semibold text-slate-500 text-xs uppercase tracking-wider text-center">Accepted</th>
                <th className="py-3 px-6 font-semibold text-slate-500 text-xs uppercase tracking-wider text-center">Rejected</th>
                <th className="py-3 px-6 font-semibold text-slate-500 text-xs uppercase tracking-wider text-center">Pending</th>
                <th className="py-3 px-6 font-semibold text-slate-500 text-xs uppercase tracking-wider text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAssemblies.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-20 text-center">
                    <div className="flex flex-col items-center text-slate-400">
                      <Building2 size={40} className="mb-3 text-slate-300" />
                      <p className="text-base font-medium text-slate-500">No assemblies found</p>
                      <p className="text-sm mt-1">Try a different search term</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAssemblies.map((assembly, idx) => {
                  const pct = assembly.total > 0 ? Math.round((assembly.accepted / assembly.total) * 100) : 0;
                  return (
                    <tr key={assembly.name} className="group hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-6 text-slate-400 text-xs font-mono">{idx + 1}</td>
                      <td className="py-3.5 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center text-xs font-bold text-indigo-600 group-hover:bg-indigo-100 transition-colors">
                            {assembly.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-slate-800">{assembly.name}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${pct}%` }}></div>
                              </div>
                              <span className="text-[10px] text-slate-400 font-medium">{pct}%</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-6 text-center">
                        <span className="inline-flex items-center justify-center bg-slate-100 text-slate-700 font-semibold rounded-lg px-3 py-1 text-sm min-w-[3rem]">
                          {assembly.total}
                        </span>
                      </td>
                      <td className="py-3.5 px-6 text-center">
                        <span className="inline-flex items-center justify-center bg-emerald-50 text-emerald-700 font-semibold rounded-lg px-3 py-1 text-sm min-w-[3rem]">
                          {assembly.accepted}
                        </span>
                      </td>
                      <td className="py-3.5 px-6 text-center">
                        <span className="inline-flex items-center justify-center bg-rose-50 text-rose-700 font-semibold rounded-lg px-3 py-1 text-sm min-w-[3rem]">
                          {assembly.rejected}
                        </span>
                      </td>
                      <td className="py-3.5 px-6 text-center">
                        <span className="inline-flex items-center justify-center bg-amber-50 text-amber-700 font-semibold rounded-lg px-3 py-1 text-sm min-w-[3rem]">
                          {assembly.pending}
                        </span>
                      </td>
                      <td className="py-3.5 px-6 text-center">
                        <Link
                          href={`/voters?assembly=${encodeURIComponent(assembly.name)}`}
                          className="inline-flex items-center gap-1.5 text-indigo-600 hover:text-indigo-800 text-xs font-semibold hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          View <ArrowRight size={13} />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
          <p>
            Showing <span className="text-slate-700 font-medium">{filteredAssemblies.length}</span> of <span className="text-slate-700 font-medium">{data.assemblyStats.length}</span> assemblies
          </p>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Connected
          </div>
        </div>
      </div>
    </div>
  );
}
