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
  X,
  Clock,
  Download,
} from "lucide-react";

interface CallLog {
  _id: string;
  voterId: {
    _id?: string;
    name: string;
    mobile: string;
    email: string;
    assemblyName: string;
    partyName: string;
  } | null;
  voterObjectId?: string;
  status: string;
  notes: string;
  calledAt: string;
  callCount?: number;
}

interface HistoryEntry {
  _id: string;
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

  // Candidate history panel
  const [historyVoterId, setHistoryVoterId] = useState<string | null>(null);
  const [historyVoter, setHistoryVoter] = useState<CallLog["voterId"] | null>(null);
  const [historyEntries, setHistoryEntries] = useState<HistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const openHistory = async (voterId: string, voter: CallLog["voterId"]) => {
    setHistoryVoterId(voterId);
    setHistoryVoter(voter);
    setHistoryLoading(true);
    try {
      const res = await apiFetch(`/api/telecaller/admin/${username}/candidate/${voterId}`);
      const data = await res.json();
      setHistoryEntries(data.history || []);
    } catch {
      setHistoryEntries([]);
    } finally {
      setHistoryLoading(false);
    }
  };

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

  const handleDownloadReport = async () => {
    // Fetch all call logs (not just current page)
    let allCalls = calls;
    if (totalCalls > PAGE_SIZE) {
      try {
        const res = await apiFetch(`/api/telecaller/admin/${username}/calls?page=1&limit=9999`);
        const data = await res.json();
        allCalls = data.calls || [];
      } catch { /* use current page calls as fallback */ }
    }

    const now = new Date().toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

    const statusRows = statusConfig
      .map((s) => {
        const val = stats ? (stats as unknown as Record<string, number>)[s.key] || 0 : 0;
        return `<td style="text-align:center;padding:6px 10px;font-weight:700;color:#333;">${val}</td>`;
      })
      .join("");
    const statusHeaders = statusConfig.map((s) => `<th style="text-align:center;padding:6px 10px;font-size:10px;color:#666;font-weight:600;">${s.label}</th>`).join("");

    const callRows = allCalls
      .map(
        (c) => {
          const sl = statusLabelMap[c.status] || { label: c.status };
          return `<tr>
            <td style="padding:6px 10px;font-size:11px;">${c.voterId?.name || "—"}</td>
            <td style="padding:6px 10px;font-size:11px;">${c.voterId?.assemblyName || "—"}</td>
            <td style="padding:6px 10px;font-size:11px;">${c.voterId?.partyName || "—"}</td>
            <td style="padding:6px 10px;font-size:11px;font-family:monospace;">${c.voterId?.mobile || "—"}</td>
            <td style="padding:6px 10px;font-size:11px;font-weight:600;">${sl.label}</td>
            <td style="padding:6px 10px;font-size:11px;">${c.notes || "—"}</td>
            <td style="padding:6px 10px;font-size:11px;white-space:nowrap;">${new Date(c.calledAt).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</td>
          </tr>`;
        }
      )
      .join("");

    const html = `<!DOCTYPE html>
<html>
<head>
  <title>${displayName} Report</title>
  <style>
    @page { size: landscape; margin: 15mm; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1e293b; margin: 0; padding: 20px; }
    h1 { font-size: 22px; margin: 0; }
    .subtitle { color: #64748b; font-size: 12px; margin-top: 4px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; border-bottom: 2px solid #e2e8f0; padding-bottom: 15px; }
    .stats-grid { display: flex; gap: 16px; margin-bottom: 20px; flex-wrap: wrap; }
    .stat-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; text-align: center; min-width: 90px; }
    .stat-value { font-size: 22px; font-weight: 800; color: #1e293b; }
    .stat-label { font-size: 10px; color: #64748b; font-weight: 600; margin-top: 2px; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    thead th { background: #f1f5f9; padding: 8px 10px; text-align: left; font-size: 10px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #e2e8f0; }
    tbody tr { border-bottom: 1px solid #f1f5f9; }
    tbody tr:nth-child(even) { background: #fafbfc; }
    .status-table { margin-bottom: 20px; }
    .status-table table { width: auto; }
    .status-table td, .status-table th { border: 1px solid #e2e8f0; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1>${displayName} — Call Report</h1>
      <p class="subtitle">Generated on ${now}</p>
    </div>
    <div style="text-align:right">
      <div class="stat-value">${stats?.totalCalled || 0}</div>
      <div class="stat-label">Total Unique Candidates Called</div>
    </div>
  </div>

  <div class="stats-grid">
    <div class="stat-card"><div class="stat-value">${stats?.totalCalled || 0}</div><div class="stat-label">Total Calls</div></div>
    <div class="stat-card"><div class="stat-value">${stats?.todayCalls || 0}</div><div class="stat-label">Today's Calls</div></div>
    <div class="stat-card"><div class="stat-value">${stats?.interested || 0}</div><div class="stat-label">Interested</div></div>
    <div class="stat-card"><div class="stat-value">${totalCalls}</div><div class="stat-label">Log Entries</div></div>
  </div>

  <div class="status-table">
    <h3 style="font-size:13px;margin-bottom:8px;">Status Breakdown</h3>
    <table><thead><tr>${statusHeaders}</tr></thead><tbody><tr>${statusRows}</tr></tbody></table>
  </div>

  <h3 style="font-size:13px;margin-bottom:8px;">Call Logs (${allCalls.length} candidates)</h3>
  <table>
    <thead>
      <tr>
        <th>Candidate</th><th>Assembly</th><th>Party</th><th>Mobile</th><th>Status</th><th>Notes</th><th>Last Called</th>
      </tr>
    </thead>
    <tbody>${callRows}</tbody>
  </table>

  <script>window.onload = function() { window.print(); }</script>
</body>
</html>`;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
    }
  };

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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-500/20">
              {displayName.split(" ")[1] || "T"}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{displayName}</h1>
              <p className="text-slate-500 mt-0.5">Call logs and performance details</p>
            </div>
          </div>
          <button
            onClick={handleDownloadReport}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-500/20"
          >
            <Download size={16} /> Download Report
          </button>
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
          <p className="text-xs text-slate-400 mt-0.5">{totalCalls} unique candidates called</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="py-3 px-5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Candidate</th>
                <th className="py-3 px-5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Assembly</th>
                <th className="py-3 px-5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Party</th>
                <th className="py-3 px-5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Mobile</th>
                <th className="py-3 px-5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Latest Status</th>
                <th className="py-3 px-5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Notes</th>
                <th className="py-3 px-5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Last Called</th>
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
                  const vid = call.voterObjectId || call.voterId?._id || "";
                  return (
                    <tr key={call._id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-5">
                        <button
                          onClick={() => vid && openHistory(vid, call.voterId)}
                          className="text-left group"
                        >
                          <p className="text-sm font-medium text-indigo-600 group-hover:text-indigo-800 group-hover:underline">
                            {call.voterId?.name || "—"}
                            {(call.callCount || 0) > 1 && (
                              <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-violet-100 text-violet-700 border border-violet-200">
                                {call.callCount} calls
                              </span>
                            )}
                          </p>
                          <p className="text-[11px] text-slate-400">{call.voterId?.email || ""}</p>
                        </button>
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
            Page {page} of {totalPages} ({totalCalls} candidates)
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

      {/* Candidate History Slide-over */}
      {historyVoterId && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setHistoryVoterId(null)} />
          <div className="relative w-full max-w-lg bg-white shadow-2xl overflow-y-auto animate-in slide-in-from-right">
            <div className="sticky top-0 bg-white border-b border-slate-200 p-5 flex items-center justify-between z-10">
              <div>
                <h3 className="text-lg font-bold text-slate-900">{historyVoter?.name || "Candidate"}</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {historyVoter?.assemblyName} • {historyVoter?.partyName} • {historyVoter?.mobile}
                </p>
              </div>
              <button
                onClick={() => setHistoryVoterId(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 transition-colors"
              >
                <X size={18} className="text-slate-500" />
              </button>
            </div>
            <div className="p-5">
              <h4 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                <Clock size={14} /> Call History ({historyEntries.length} entries)
              </h4>
              {historyLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 size={20} className="animate-spin text-indigo-500" />
                </div>
              ) : historyEntries.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">No call history found.</p>
              ) : (
                <div className="space-y-3">
                  {historyEntries.map((entry, idx) => {
                    const es = statusLabelMap[entry.status] || { label: entry.status, color: "text-slate-600", bg: "bg-slate-50" };
                    return (
                      <div
                        key={entry._id}
                        className={`relative rounded-xl border p-4 ${idx === 0 ? "border-indigo-200 bg-indigo-50/30" : "border-slate-100 bg-white"}`}
                      >
                        {idx === 0 && (
                          <span className="absolute top-2 right-3 text-[9px] font-bold text-indigo-500 uppercase">Latest</span>
                        )}
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`text-[10px] font-semibold ${es.color} px-2.5 py-1 rounded-full ${es.bg}`}>
                            {es.label}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {new Date(entry.calledAt).toLocaleString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        {entry.notes && (
                          <p className="text-xs text-slate-600 mt-1 bg-white rounded-lg px-3 py-2 border border-slate-100">
                            {entry.notes}
                          </p>
                        )}
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
