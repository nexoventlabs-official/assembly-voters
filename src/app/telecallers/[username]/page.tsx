"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import {
  Loader2,
  ArrowLeft,
  Phone,
  PhoneForwarded,
  Activity,
  BarChart3,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

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

interface TelecallerStats {
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
  withdrawn: number;
  todayCalls: number;
}

const statusConfig: { key: string; label: string; color: string; bg: string; border: string }[] = [
  { key: "interested", label: "Interested", color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-100" },
  { key: "not_interested", label: "Not Interested", color: "text-rose-700", bg: "bg-rose-50", border: "border-rose-100" },
  { key: "no_response", label: "No Response", color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-100" },
  { key: "switch_off", label: "Switch Off", color: "text-slate-700", bg: "bg-slate-100", border: "border-slate-200" },
  { key: "wrong_number", label: "Wrong Number", color: "text-red-700", bg: "bg-red-50", border: "border-red-100" },
  { key: "callback", label: "Callback", color: "text-blue-700", bg: "bg-blue-50", border: "border-blue-100" },
  { key: "first_call_completed", label: "1st Call Done", color: "text-cyan-700", bg: "bg-cyan-50", border: "border-cyan-100" },
  { key: "second_call_completed", label: "2nd Call Done", color: "text-indigo-700", bg: "bg-indigo-50", border: "border-indigo-100" },
  { key: "third_call_completed", label: "3rd Call Done", color: "text-purple-700", bg: "bg-purple-50", border: "border-purple-100" },
  { key: "withdrawn", label: "Withdrawn", color: "text-orange-700", bg: "bg-orange-50", border: "border-orange-100" },
];

const statusLabelMap: Record<string, { label: string; color: string; bg: string }> = {};
statusConfig.forEach((s) => {
  statusLabelMap[s.key] = { label: s.label, color: s.color, bg: s.bg };
});

export default function TelecallerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const username = params.username as string;
  const displayName = username.replace("Telecaller", "Telecaller ");

  const [stats, setStats] = useState<TelecallerStats | null>(null);
  const [calls, setCalls] = useState<CallLog[]>([]);
  const [totalCalls, setTotalCalls] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 50;

  useEffect(() => {
    Promise.all([
      apiFetch("/api/telecaller/admin/overview").then((r) => r.json()),
      apiFetch(`/api/telecaller/admin/${username}/calls?page=${page}&limit=${PAGE_SIZE}`).then((r) => r.json()),
    ])
      .then(([overviewData, callsData]) => {
        const tcStats = (overviewData.telecallerStats || []).find(
          (t: { username: string }) => t.username === username
        );
        if (tcStats) {
          setStats({
            totalCalled: tcStats.totalCalled,
            interested: tcStats.interested,
            not_interested: tcStats.not_interested,
            no_response: tcStats.no_response,
            switch_off: tcStats.switch_off,
            wrong_number: tcStats.wrong_number,
            callback: tcStats.callback,
            first_call_completed: tcStats.first_call_completed || 0,
            second_call_completed: tcStats.second_call_completed || 0,
            third_call_completed: tcStats.third_call_completed || 0,
            withdrawn: tcStats.withdrawn || 0,
            todayCalls: tcStats.todayCalls,
          });
        }
        setCalls(callsData.calls || []);
        setTotalCalls(callsData.total || 0);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [username, page]);

  const totalPages = Math.max(1, Math.ceil(totalCalls / PAGE_SIZE));

  if (loading && !stats) {
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

  return (
    <div className="p-6 md:p-8 xl:p-10 max-w-[1440px] mx-auto">
      {/* Back + Header */}
      <div className="mb-8">
        <button
          onClick={() => router.push("/telecallers")}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-600 mb-4 transition-colors"
        >
          <ArrowLeft size={16} /> Back to Telecallers
        </button>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-500/20">
            {displayName.split(" ")[1] || "T"}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{displayName}</h1>
            <p className="text-slate-500 mt-0.5">Call logs and performance details</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center mb-3">
              <Phone size={18} className="text-indigo-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900">{stats.totalCalled}</p>
            <p className="text-xs text-slate-400 font-medium mt-1">Total Calls</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center mb-3">
              <Activity size={18} className="text-violet-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900">{stats.todayCalls}</p>
            <p className="text-xs text-slate-400 font-medium mt-1">Today&apos;s Calls</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center mb-3">
              <PhoneForwarded size={18} className="text-emerald-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900">{stats.interested}</p>
            <p className="text-xs text-slate-400 font-medium mt-1">Interested</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center mb-3">
              <BarChart3 size={18} className="text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900">{totalCalls}</p>
            <p className="text-xs text-slate-400 font-medium mt-1">Total Log Entries</p>
          </div>
        </div>
      )}

      {/* Status Breakdown */}
      {stats && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-8">
          <h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <BarChart3 size={16} className="text-indigo-500" /> Status Breakdown
          </h3>
          <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-3">
            {statusConfig.map((s) => (
              <div key={s.key} className={`${s.bg} rounded-xl p-3 text-center border ${s.border}`}>
                <p className={`text-lg font-bold ${s.color}`}>
                  {(stats as unknown as Record<string, number>)[s.key] || 0}
                </p>
                <p className={`text-[10px] font-medium ${s.color} opacity-80 mt-1`}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Call Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-4">
        <div className="p-5 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-800">Call Logs</h3>
          <p className="text-xs text-slate-400 mt-0.5">{totalCalls} total entries</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="py-3 px-5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Candidate</th>
                <th className="py-3 px-5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Assembly</th>
                <th className="py-3 px-5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Party</th>
                <th className="py-3 px-5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Mobile</th>
                <th className="py-3 px-5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Status</th>
                <th className="py-3 px-5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Notes</th>
                <th className="py-3 px-5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <Loader2 size={20} className="animate-spin text-indigo-500 mx-auto" />
                  </td>
                </tr>
              ) : calls.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 text-sm">No calls recorded yet.</td>
                </tr>
              ) : (
                calls.map((call) => {
                  const s = statusLabelMap[call.status] || { label: call.status, color: "text-slate-600", bg: "bg-slate-50" };
                  return (
                    <tr key={call._id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-5">
                        <p className="text-sm font-medium text-slate-800">{call.voterId?.name || "—"}</p>
                        <p className="text-[11px] text-slate-400">{call.voterId?.email || ""}</p>
                      </td>
                      <td className="py-3 px-5 text-xs text-slate-600">{call.voterId?.assemblyName || "—"}</td>
                      <td className="py-3 px-5 text-xs text-slate-600">{call.voterId?.partyName || "—"}</td>
                      <td className="py-3 px-5 text-xs text-slate-600 font-mono">{call.voterId?.mobile || "—"}</td>
                      <td className="py-3 px-5">
                        <span className={`text-[10px] font-semibold ${s.color} px-2.5 py-1 rounded-full ${s.bg}`}>
                          {s.label}
                        </span>
                      </td>
                      <td className="py-3 px-5 text-xs text-slate-500 max-w-[200px] truncate">{call.notes || "—"}</td>
                      <td className="py-3 px-5 text-xs text-slate-400 whitespace-nowrap">
                        {new Date(call.calledAt).toLocaleString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalCalls > PAGE_SIZE && (
        <div className="flex items-center justify-between px-1">
          <span className="text-xs text-slate-400 font-medium">
            Page {page} of {totalPages} ({totalCalls} entries)
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors border ${
                page === 1 ? "bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed" : "bg-white text-slate-600 border-slate-200 hover:bg-indigo-50 hover:text-indigo-600"
              }`}
            >
              <ChevronLeft size={15} />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors border ${
                page === totalPages ? "bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed" : "bg-white text-slate-600 border-slate-200 hover:bg-indigo-50 hover:text-indigo-600"
              }`}
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
