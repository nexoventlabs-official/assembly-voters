"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import {
  Headphones,
  Loader2,
  Phone,
  PhoneForwarded,
  PhoneOff,
  ThumbsUp,
  ThumbsDown,
  AlertTriangle,
  Activity,
  BarChart3,
  ChevronRight,
  X,
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
  todayCalls: number;
}

interface CallLog {
  _id: string;
  voterId: {
    name: string;
    mobile: string;
    email: string;
    assemblyName: string;
    partyName: string;
  } | null;
  status: string;
  notes: string;
  calledAt: string;
}

const statusLabels: Record<string, { label: string; color: string; bg: string }> = {
  interested: { label: "Interested", color: "text-emerald-700", bg: "bg-emerald-50" },
  not_interested: { label: "Not Interested", color: "text-rose-700", bg: "bg-rose-50" },
  no_response: { label: "No Response", color: "text-amber-700", bg: "bg-amber-50" },
  switch_off: { label: "Switch Off", color: "text-slate-700", bg: "bg-slate-100" },
  wrong_number: { label: "Wrong Number", color: "text-red-700", bg: "bg-red-50" },
  callback: { label: "Callback", color: "text-blue-700", bg: "bg-blue-50" },
};

export default function TelecallersPage() {
  const [telecallers, setTelecallers] = useState<TelecallerStat[]>([]);
  const [totalAccepted, setTotalAccepted] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedTC, setSelectedTC] = useState<string | null>(null);
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

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

  const loadCallLogs = (username: string) => {
    setSelectedTC(username);
    setLogsLoading(true);
    apiFetch(`/api/telecaller/admin/${username}/calls?limit=100`)
      .then((res) => res.json())
      .then((data) => {
        setCallLogs(data.calls || []);
        setLogsLoading(false);
      })
      .catch(() => setLogsLoading(false));
  };

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
            onClick={() => loadCallLogs(tc.username)}
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
              <div className="bg-emerald-50 rounded-lg p-2 text-center">
                <p className="text-xs font-bold text-emerald-700">{tc.interested}</p>
                <p className="text-[9px] text-emerald-600 font-medium">Interested</p>
              </div>
              <div className="bg-rose-50 rounded-lg p-2 text-center">
                <p className="text-xs font-bold text-rose-700">{tc.not_interested}</p>
                <p className="text-[9px] text-rose-600 font-medium">Not Int.</p>
              </div>
              <div className="bg-amber-50 rounded-lg p-2 text-center">
                <p className="text-xs font-bold text-amber-700">{tc.no_response}</p>
                <p className="text-[9px] text-amber-600 font-medium">No Resp.</p>
              </div>
              <div className="bg-slate-100 rounded-lg p-2 text-center">
                <p className="text-xs font-bold text-slate-700">{tc.switch_off}</p>
                <p className="text-[9px] text-slate-600 font-medium">Switch Off</p>
              </div>
              <div className="bg-red-50 rounded-lg p-2 text-center">
                <p className="text-xs font-bold text-red-700">{tc.wrong_number}</p>
                <p className="text-[9px] text-red-600 font-medium">Wrong No.</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-2 text-center">
                <p className="text-xs font-bold text-blue-700">{tc.callback}</p>
                <p className="text-[9px] text-blue-600 font-medium">Callback</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Call Logs Modal */}
      {selectedTC && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setSelectedTC(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 shrink-0">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <BarChart3 size={18} className="text-indigo-500" />
                  {selectedTC.replace("Telecaller", "Telecaller ")} — Call Logs
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">{callLogs.length} recent calls</p>
              </div>
              <button onClick={() => setSelectedTC(null)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400">
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {logsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 size={24} className="animate-spin text-indigo-500" />
                </div>
              ) : callLogs.length === 0 ? (
                <p className="text-center text-slate-400 py-12">No calls recorded yet.</p>
              ) : (
                <div className="space-y-2">
                  {callLogs.map((call) => {
                    const s = statusLabels[call.status] || { label: call.status, color: "text-slate-600", bg: "bg-slate-50" };
                    return (
                      <div key={call._id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors border border-slate-100">
                        <div className={`w-9 h-9 rounded-lg ${s.bg} flex items-center justify-center shrink-0`}>
                          {call.status === "interested" && <ThumbsUp size={14} className={s.color} />}
                          {call.status === "not_interested" && <ThumbsDown size={14} className={s.color} />}
                          {call.status === "no_response" && <PhoneOff size={14} className={s.color} />}
                          {call.status === "switch_off" && <PhoneOff size={14} className={s.color} />}
                          {call.status === "wrong_number" && <AlertTriangle size={14} className={s.color} />}
                          {call.status === "callback" && <PhoneForwarded size={14} className={s.color} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-800 truncate">{call.voterId?.name || "Unknown"}</p>
                          <p className="text-[11px] text-slate-400">
                            {call.voterId?.assemblyName} • {call.voterId?.partyName} • {call.voterId?.mobile}
                          </p>
                          {call.notes && <p className="text-[11px] text-slate-500 mt-0.5 italic">{call.notes}</p>}
                        </div>
                        <div className="text-right shrink-0">
                          <span className={`text-[10px] font-semibold ${s.color} px-2 py-0.5 rounded-full ${s.bg}`}>{s.label}</span>
                          <p className="text-[10px] text-slate-400 mt-1">
                            {new Date(call.calledAt).toLocaleString("en-IN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "short" })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
