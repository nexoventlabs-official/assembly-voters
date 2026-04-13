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
  CheckCircle,
  Download,
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
  first_call_completed: number;
  second_call_completed: number;
  third_call_completed: number;
  withdrawn: number;
  todayCalls: number;
}

const statusLabels: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  interested: { label: "Interested", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-100", icon: ThumbsUp },
  not_interested: { label: "Not Interested", color: "text-rose-700", bg: "bg-rose-50 border-rose-100", icon: ThumbsDown },
  no_response: { label: "No Response", color: "text-amber-700", bg: "bg-amber-50 border-amber-100", icon: PhoneOff },
  switch_off: { label: "Switch Off", color: "text-slate-700", bg: "bg-slate-100 border-slate-200", icon: PhoneOff },
  wrong_number: { label: "Wrong Number", color: "text-red-700", bg: "bg-red-50 border-red-100", icon: AlertTriangle },
  callback: { label: "Callback", color: "text-blue-700", bg: "bg-blue-50 border-blue-100", icon: PhoneForwarded },
  first_call_completed: { label: "1st Call Done", color: "text-cyan-700", bg: "bg-cyan-50 border-cyan-100", icon: CheckCircle },
  second_call_completed: { label: "2nd Call Done", color: "text-indigo-700", bg: "bg-indigo-50 border-indigo-100", icon: CheckCircle },
  third_call_completed: { label: "3rd Call Done", color: "text-purple-700", bg: "bg-purple-50 border-purple-100", icon: CheckCircle },
  withdrawn: { label: "Withdrawn", color: "text-orange-700", bg: "bg-orange-50 border-orange-100", icon: AlertTriangle },
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

  const handleDownloadReport = async () => {
    // Fetch all completed calls
    let allCalls: { voterId: { name: string; mobile: string; email: string; assemblyName: string; partyName: string } | null; status: string; notes: string; calledAt: string; callCount: number }[] = [];
    try {
      const res = await apiFetch("/api/telecaller/my-calls");
      const data = await res.json();
      allCalls = data.calls || [];
    } catch { /* empty */ }

    const now = new Date().toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

    const statusRows = Object.entries(statusLabels)
      .map(([key, val]) => `<td style="text-align:center;padding:6px 10px;font-weight:700;color:#333;">${stats[key as keyof CallStatusStats] || 0}</td>`)
      .join("");
    const statusHeaders = Object.values(statusLabels)
      .map((val) => `<th style="text-align:center;padding:6px 10px;font-size:10px;color:#666;font-weight:600;">${val.label}</th>`)
      .join("");

    const callRows = allCalls
      .map((c) => {
        const sl = statusLabels[c.status] || { label: c.status };
        return `<tr>
          <td style="padding:6px 10px;font-size:11px;">${c.voterId?.name || "—"}</td>
          <td style="padding:6px 10px;font-size:11px;">${c.voterId?.assemblyName || "—"}</td>
          <td style="padding:6px 10px;font-size:11px;">${c.voterId?.partyName || "—"}</td>
          <td style="padding:6px 10px;font-size:11px;font-family:monospace;">${c.voterId?.mobile || "—"}</td>
          <td style="padding:6px 10px;font-size:11px;font-weight:600;">${sl.label}</td>
          <td style="padding:6px 10px;font-size:11px;">${c.notes || "—"}</td>
          <td style="padding:6px 10px;font-size:11px;white-space:nowrap;">${new Date(c.calledAt).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</td>
        </tr>`;
      })
      .join("");

    const html = `<!DOCTYPE html>
<html>
<head>
  <title>${username} Call Report</title>
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
      <h1>${username} — Call Report</h1>
      <p class="subtitle">Generated on ${now}</p>
    </div>
    <div style="text-align:right">
      <div class="stat-value">${stats.totalCalled}</div>
      <div class="stat-label">Candidates Called</div>
    </div>
  </div>

  <div class="stats-grid">
    <div class="stat-card"><div class="stat-value">${stats.totalCandidates}</div><div class="stat-label">Assigned</div></div>
    <div class="stat-card"><div class="stat-value">${stats.totalCalled}</div><div class="stat-label">Called</div></div>
    <div class="stat-card"><div class="stat-value">${stats.notCalled}</div><div class="stat-label">Not Called</div></div>
    <div class="stat-card"><div class="stat-value">${stats.todayCalls}</div><div class="stat-label">Today</div></div>
  </div>

  <div class="status-table">
    <h3 style="font-size:13px;margin-bottom:8px;">Status Breakdown</h3>
    <table><thead><tr>${statusHeaders}</tr></thead><tbody><tr>${statusRows}</tr></tbody></table>
  </div>

  <h3 style="font-size:13px;margin-bottom:8px;">Completed Calls (${allCalls.length} candidates)</h3>
  <table>
    <thead>
      <tr>
        <th>Candidate</th><th>Assembly</th><th>Party</th><th>Mobile</th><th>Status</th><th>Notes</th><th>Last Called</th>
      </tr>
    </thead>
    <tbody>${callRows}</tbody>
  </table>

  <script>window.onload = function() { window.print(); }<\/script>
</body>
</html>`;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
    }
  };

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
      <div className="flex items-start justify-between mb-8">
        <div>
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
        <button
          onClick={handleDownloadReport}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-500/20"
        >
          <Download size={16} /> Download Report
        </button>
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
