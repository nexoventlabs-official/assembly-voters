"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import {
  Building2,
  Search,
  Loader2,
  X,
  BarChart3,
  ArrowRight,
  TrendingUp,
  XCircle,
  CheckCircle,
  Clock
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
          <p className="text-slate-400 text-sm font-medium">Loading performance data...</p>
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
          <p className="text-slate-500 text-sm">Failed to load assembly data.</p>
        </div>
      </div>
    );
  }

  const filteredAssemblies = data.assemblyStats.filter((a) =>
    a.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Summary stats
  const totalAll = data.assemblyStats.reduce((s, a) => s + a.total, 0);
  const acceptedAll = data.assemblyStats.reduce((s, a) => s + a.accepted, 0);
  const rejectedAll = data.assemblyStats.reduce((s, a) => s + a.rejected, 0);
  const pendingAll = data.assemblyStats.reduce((s, a) => s + a.pending, 0);

  return (
    <div className="p-6 md:p-8 xl:p-10 max-w-[1440px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Assembly Performance
          </h1>
          <p className="text-slate-500 mt-1">
            Detailed breakdown and analytics for all constituencies.
          </p>
        </div>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 px-5 py-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
            <TrendingUp size={18} className="text-indigo-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{totalAll.toLocaleString()}</p>
            <p className="text-xs text-slate-400 font-medium">Total Registered</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 px-5 py-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
            <CheckCircle size={18} className="text-emerald-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{acceptedAll.toLocaleString()}</p>
            <p className="text-xs text-slate-400 font-medium">Accepted</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 px-5 py-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center">
            <XCircle size={18} className="text-rose-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{rejectedAll.toLocaleString()}</p>
            <p className="text-xs text-slate-400 font-medium">Rejected</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 px-5 py-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
            <Clock size={18} className="text-amber-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{pendingAll.toLocaleString()}</p>
            <p className="text-xs text-slate-400 font-medium">Pending</p>
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Table Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
              <BarChart3 size={20} className="text-indigo-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Performance Statistics</h2>
              <p className="text-sm text-slate-400">{data.assemblyStats.length} assemblies monitored</p>
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
                <th className="py-3 px-6 font-semibold text-slate-500 text-xs uppercase tracking-wider w-14 text-center">#</th>
                <th className="py-3 px-6 font-semibold text-slate-500 text-xs uppercase tracking-wider text-left">Assembly</th>
                <th className="py-3 px-6 font-semibold text-slate-500 text-xs uppercase tracking-wider text-center">Total</th>
                <th className="py-3 px-6 font-semibold text-slate-500 text-xs uppercase tracking-wider text-center">Accepted</th>
                <th className="py-3 px-6 font-semibold text-slate-500 text-xs uppercase tracking-wider text-center">Rejected</th>
                <th className="py-3 px-6 font-semibold text-slate-500 text-xs uppercase tracking-wider text-center">Pending</th>
                <th className="py-3 px-6 font-semibold text-slate-500 text-xs uppercase tracking-wider text-center">Progress</th>
                <th className="py-3 px-6 font-semibold text-slate-500 text-xs uppercase tracking-wider text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAssemblies.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-20 text-center">
                    <div className="flex flex-col items-center text-slate-400">
                      <Building2 size={40} className="mb-3 text-slate-300" />
                      <p className="text-base font-medium text-slate-500">No assemblies found</p>
                      <p className="text-sm mt-1">Try modifying your search criteria</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAssemblies.map((assembly, idx) => {
                  const pct = assembly.total > 0 ? Math.round((assembly.accepted / assembly.total) * 100) : 0;
                  return (
                    <tr key={assembly.name} className="group hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-6 text-slate-400 text-center text-xs font-mono">{idx + 1}</td>
                      <td className="py-3.5 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center text-xs font-bold text-indigo-600 group-hover:bg-indigo-100 transition-colors">
                            {assembly.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-slate-800">{assembly.name}</span>
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
                      <td className="py-3.5 px-6">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-20 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${pct}%` }}></div>
                          </div>
                          <span className="text-xs text-slate-500 font-medium w-8">{pct}%</span>
                        </div>
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

        {/* Footer */}
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
