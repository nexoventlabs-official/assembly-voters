"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useRouter } from "next/navigation";
import {
  Headphones,
  Loader2,
  Phone,
  PhoneForwarded,
  Activity,
  ChevronRight,
} from "lucide-react";

interface TelecallerStat {
  username: string;
  displayName: string;
  totalCalled: number;
  interested: number;
  not_interested: number;
  no_response: number;
  switch_off: number;
  wrong_number: number;
  callback: number;
  first_call_completed: number;
  second_call_completed: number;
  third_call_completed: number;
  todayCalls: number;
}

const statusConfig: { key: string; label: string; shortLabel: string; color: string; bg: string }[] = [
  { key: "interested", label: "Interested", shortLabel: "Interested", color: "text-emerald-700", bg: "bg-emerald-50" },
  { key: "not_interested", label: "Not Interested", shortLabel: "Not Int.", color: "text-rose-700", bg: "bg-rose-50" },
  { key: "no_response", label: "No Response", shortLabel: "No Resp.", color: "text-amber-700", bg: "bg-amber-50" },
  { key: "switch_off", label: "Switch Off", shortLabel: "Switch Off", color: "text-slate-700", bg: "bg-slate-100" },
  { key: "wrong_number", label: "Wrong Number", shortLabel: "Wrong No.", color: "text-red-700", bg: "bg-red-50" },
  { key: "callback", label: "Callback", shortLabel: "Callback", color: "text-blue-700", bg: "bg-blue-50" },
  { key: "first_call_completed", label: "1st Call Done", shortLabel: "1st Call", color: "text-cyan-700", bg: "bg-cyan-50" },
  { key: "second_call_completed", label: "2nd Call Done", shortLabel: "2nd Call", color: "text-indigo-700", bg: "bg-indigo-50" },
  { key: "third_call_completed", label: "3rd Call Done", shortLabel: "3rd Call", color: "text-purple-700", bg: "bg-purple-50" },
];

export default function TelecallersPage() {
  const router = useRouter();
  const [telecallers, setTelecallers] = useState<TelecallerStat[]>([]);
  const [totalAccepted, setTotalAccepted] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/api/telecaller/admin/overview")
      .then((res) => res.json())
      .then((data) => {
        setTelecallers(data.telecallerStats || []);
        setTotalAccepted(data.totalAccepted || 0);
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
          <p className="text-slate-400 text-sm font-medium">Loading telecaller data...</p>
        </div>
      </div>
    );
  }

  const totalCalled = telecallers.reduce((sum, t) => sum + t.totalCalled, 0);
  const totalToday = telecallers.reduce((sum, t) => sum + t.todayCalls, 0);

  return (
    <div className="p-6 md:p-8 xl:p-10 max-w-[1440px] mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-violet-600 text-xs font-semibold mb-1">
          <Headphones size={14} />
          TELECALLER MANAGEMENT
        </div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Telecallers</h1>
        <p className="text-slate-500 mt-1">Monitor all telecaller performance and call reports.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center mb-3">
            <Headphones size={18} className="text-indigo-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">6</p>
          <p className="text-xs text-slate-400 font-medium mt-1">Telecallers</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center mb-3">
            <Phone size={18} className="text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{totalAccepted.toLocaleString()}</p>
          <p className="text-xs text-slate-400 font-medium mt-1">Total Candidates</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center mb-3">
            <PhoneForwarded size={18} className="text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{totalCalled.toLocaleString()}</p>
          <p className="text-xs text-slate-400 font-medium mt-1">Total Calls Made</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center mb-3">
            <Activity size={18} className="text-violet-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{totalToday}</p>
          <p className="text-xs text-slate-400 font-medium mt-1">Today&apos;s Calls</p>
        </div>
      </div>

      {/* Telecaller Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
        {telecallers.map((tc) => (
          <div
            key={tc.username}
            className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => router.push(`/telecallers/${tc.username}`)}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white font-bold text-sm">
                  {tc.displayName.split(" ")[1] || "T"}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">{tc.displayName}</p>
                  <p className="text-[11px] text-slate-400">{tc.totalCalled} calls made</p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-slate-400">
                <span className="text-xs font-medium">Today: {tc.todayCalls}</span>
                <ChevronRight size={14} />
              </div>
            </div>

            {/* Progress */}
            <div className="w-full bg-slate-100 rounded-full h-2 mb-3">
              <div
                className="bg-gradient-to-r from-indigo-500 to-violet-500 h-2 rounded-full transition-all"
                style={{ width: `${totalAccepted > 0 ? (tc.totalCalled / totalAccepted) * 100 : 0}%` }}
              ></div>
            </div>

            {/* Status breakdown */}
            <div className="grid grid-cols-3 gap-2">
              {statusConfig.map((s) => (
                <div key={s.key} className={`${s.bg} rounded-lg p-2 text-center`}>
                  <p className={`text-xs font-bold ${s.color}`}>{(tc as unknown as Record<string, number>)[s.key] || 0}</p>
                  <p className={`text-[9px] font-medium ${s.color} opacity-80`}>{s.shortLabel}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
