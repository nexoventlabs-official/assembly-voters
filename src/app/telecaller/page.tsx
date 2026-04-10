"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import {
  PhoneOff,
  PhoneForwarded,
  ThumbsUp,
  ThumbsDown,
  Clock,
  AlertTriangle,
  Loader2,
  BarChart3,
  Activity,
  Phone,
} from "lucide-react";

interface CallStatusStats {
  totalCandidates: number;
  totalCalled: number;
  notCalled: number;
  interested: number;
  not_interested: number;
  no_response: number;
  switch_off: number;
  wrong_number: number;
  callback: number;
  todayCalls: number;
}

const statusLabels: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  interested: { label: "Interested", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-100", icon: ThumbsUp },
  not_interested: { label: "Not Interested", color: "text-rose-700", bg: "bg-rose-50 border-rose-100", icon: ThumbsDown },
  no_response: { label: "No Response", color: "text-amber-700", bg: "bg-amber-50 border-amber-100", icon: PhoneOff },
  switch_off: { label: "Switch Off", color: "text-slate-700", bg: "bg-slate-100 border-slate-200", icon: PhoneOff },
  wrong_number: { label: "Wrong Number", color: "text-red-700", bg: "bg-red-50 border-red-100", icon: AlertTriangle },
  callback: { label: "Callback", color: "text-blue-700", bg: "bg-blue-50 border-blue-100", icon: PhoneForwarded },
};

export default function TelecallerDashboard() {
  const { username } = useAuth();
  const [stats, setStats] = useState<CallStatusStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/api/telecaller/stats")
      .then((res) => res.json())
      .then((data) => {
        setStats(data.stats);
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

  if (!stats) return null;

  const statCards = [
    { label: "Total Candidates", value: stats.totalCandidates, icon: Phone, color: "text-indigo-600", bg: "bg-indigo-50" },
    { label: "Called", value: stats.totalCalled, icon: PhoneForwarded, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Not Called", value: stats.notCalled, icon: PhoneOff, color: "text-slate-600", bg: "bg-slate-100" },
    { label: "Today's Calls", value: stats.todayCalls, icon: Activity, color: "text-violet-600", bg: "bg-violet-50" },
    { label: "Interested", value: stats.interested, icon: ThumbsUp, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Not Interested", value: stats.not_interested, icon: ThumbsDown, color: "text-rose-600", bg: "bg-rose-50" },
    { label: "No Response", value: stats.no_response, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Callback", value: stats.callback, icon: PhoneForwarded, color: "text-blue-600", bg: "bg-blue-50" },
  ];

  return (
    <div className="p-6 md:p-8 xl:p-10 max-w-[1440px] mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-emerald-600 text-xs font-semibold mb-1">
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
          TELECALLER DASHBOARD
        </div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
          Welcome, {username}
        </h1>
        <p className="text-slate-500 mt-1">
          Your calling performance and recent activity.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
                <stat.icon size={18} className={stat.color} />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900">{stat.value.toLocaleString()}</p>
            <p className="text-xs text-slate-400 font-medium mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Progress Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-8">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
            <BarChart3 size={16} className="text-indigo-500" /> Call Progress
          </h3>
          <span className="text-xs font-medium text-slate-400">
            {stats.totalCalled} / {stats.totalCandidates} called
          </span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-3">
          <div
            className="bg-gradient-to-r from-indigo-500 to-indigo-600 h-3 rounded-full transition-all duration-500"
            style={{ width: `${stats.totalCandidates > 0 ? (stats.totalCalled / stats.totalCandidates) * 100 : 0}%` }}
          ></div>
        </div>
        <div className="flex items-center gap-4 mt-3">
          {Object.entries(statusLabels).map(([key, val]) => (
            <div key={key} className="flex items-center gap-1.5">
              <div className={`w-2.5 h-2.5 rounded-full ${val.bg} border`}></div>
              <span className="text-[11px] text-slate-500">{val.label}: {stats[key as keyof CallStatusStats] || 0}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
