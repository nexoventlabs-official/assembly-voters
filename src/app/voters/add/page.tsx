"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeft,
  UserPlus,
  Loader2,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  ChevronDown,
  Users,
  Copy,
} from "lucide-react";
import Link from "next/link";

interface Candidate {
  row: number;
  name: string;
  email: string;
  mobile: string;
  partyName: string;
  status: string;
  isDuplicate: boolean;
}

export default function AddCandidatePage() {
  const [sheets, setSheets] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [duplicateWarning, setDuplicateWarning] = useState(false);
  const [existingCandidates, setExistingCandidates] = useState<Candidate[]>([]);
  const [candidatesLoading, setCandidatesLoading] = useState(false);
  const [markingDuplicate, setMarkingDuplicate] = useState<number | null>(null);

  const [form, setForm] = useState({
    sheetName: "",
    name: "",
    email: "",
    mobile: "",
    optionalMobile: "",
    partyName: "",
    assemblyName: "",
  });

  useEffect(() => {
    fetch("/api/sheets")
      .then((res) => res.json())
      .then((data) => {
        setSheets(data.sheets || []);
        if (data.sheets?.length > 0) {
          setForm((prev) => ({
            ...prev,
            sheetName: data.sheets[0],
            assemblyName: data.sheets[0],
          }));
          fetchCandidates(data.sheets[0]);
        }
      });
  }, []);

  const fetchCandidates = async (assembly: string) => {
    if (!assembly) { setExistingCandidates([]); return; }
    setCandidatesLoading(true);
    try {
      const res = await fetch(`/api/voters?assembly=${encodeURIComponent(assembly)}`);
      const data = await res.json();
      setExistingCandidates(data.voters || []);
    } catch {
      setExistingCandidates([]);
    } finally {
      setCandidatesLoading(false);
    }
  };

  const markAsDuplicate = async (candidate: Candidate) => {
    setMarkingDuplicate(candidate.row);
    try {
      await fetch("/api/voters/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sheetName: form.sheetName,
          row: candidate.row,
          status: "duplicate",
        }),
      });
      fetchCandidates(form.sheetName);
    } catch {
      console.error("Failed to mark as duplicate");
    } finally {
      setMarkingDuplicate(null);
    }
  };

  const handleAssemblyChange = (value: string) => {
    setForm((prev) => ({
      ...prev,
      sheetName: value,
      assemblyName: value,
    }));
    fetchCandidates(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setDuplicateWarning(false);

    if (!form.sheetName || !form.name) {
      setError("Assembly and candidate name are required fields.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/voters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to add candidate record");
      }

      if (data.isDuplicate) {
        setDuplicateWarning(true);
      }

      setSuccess(true);
      setForm((prev) => ({
        ...prev,
        name: "",
        email: "",
        mobile: "",
        optionalMobile: "",
        partyName: "",
      }));

      // Refresh existing candidates list
      fetchCandidates(form.sheetName);

      setTimeout(() => {
        setSuccess(false);
        setDuplicateWarning(false);
      }, 6000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "System error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <div className="p-6 md:p-8 xl:p-10 max-w-3xl mx-auto">
      {/* Back link */}
      <Link
        href="/voters"
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors mb-6"
      >
        <ArrowLeft size={16} />
        Back to Candidate Database
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-2">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center">
            <UserPlus size={22} className="text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Add New Candidate
            </h1>
            <p className="text-slate-500 text-sm mt-0.5">
              Register a new candidate into the assembly database.
            </p>
          </div>
        </div>
      </div>

      {/* Success Message */}
      {success && !duplicateWarning && (
        <div className="mb-6 flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-5 py-4 text-emerald-700">
          <CheckCircle size={20} strokeWidth={2.5} />
          <p className="text-sm font-medium">Candidate registered successfully!</p>
        </div>
      )}

      {/* Duplicate Warning */}
      {duplicateWarning && (
        <div className="mb-6 flex items-center gap-3 bg-orange-50 border border-orange-200 rounded-xl px-5 py-4 text-orange-700">
          <AlertTriangle size={20} strokeWidth={2.5} />
          <div>
            <p className="text-sm font-semibold">This candidate already exists in this assembly!</p>
            <p className="text-xs text-orange-500 mt-0.5">A candidate with the same name and party was found. The entry has been added and automatically marked as duplicate.</p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 flex items-center gap-3 bg-rose-50 border border-rose-200 rounded-xl px-5 py-4 text-rose-700">
          <AlertCircle size={20} strokeWidth={2.5} />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Form Section Header */}
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <h2 className="text-sm font-semibold text-slate-700">Candidate Details</h2>
            <p className="text-xs text-slate-400 mt-0.5">Fields marked with <span className="text-rose-500">*</span> are required</p>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
              {/* Assembly Selection */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Assembly <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={form.sheetName}
                    onChange={(e) => handleAssemblyChange(e.target.value)}
                    className="w-full input-field appearance-none px-4 py-2.5 text-sm cursor-pointer pr-10"
                  >
                    <option value="">Select an assembly...</option>
                    {sheets.map((sheet) => (
                      <option key={sheet} value={sheet}>
                        {sheet}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Voter Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="e.g. John Doe"
                  className="w-full input-field px-4 py-2.5 text-sm"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Email Address</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, email: e.target.value }))
                  }
                  placeholder="name@example.com"
                  className="w-full input-field px-4 py-2.5 text-sm"
                />
              </div>

              {/* Mobile Numbers */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Primary Mobile
                </label>
                <input
                  type="tel"
                  value={form.mobile}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, mobile: e.target.value }))
                  }
                  placeholder="+91 9876543210"
                  className="w-full input-field px-4 py-2.5 text-sm font-mono"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Secondary Mobile
                </label>
                <input
                  type="tel"
                  value={form.optionalMobile}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      optionalMobile: e.target.value,
                    }))
                  }
                  placeholder="+91 9876543210"
                  className="w-full input-field px-4 py-2.5 text-sm font-mono"
                />
              </div>

              {/* Party Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Party / Affiliation
                </label>
                <input
                  type="text"
                  value={form.partyName}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, partyName: e.target.value }))
                  }
                  placeholder="e.g. Independent"
                  className="w-full input-field px-4 py-2.5 text-sm"
                />
              </div>

              {/* Assembly Name (auto-filled) */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Assembly Name
                </label>
                <input
                  type="text"
                  value={form.assemblyName}
                  readOnly
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-400 cursor-not-allowed"
                />
                <p className="text-[11px] text-slate-400 mt-1.5">
                  Auto-filled from assembly selection
                </p>
              </div>
            </div>
          </div>

          {/* Form Footer */}
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center gap-3">
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white px-6 py-2.5 rounded-xl font-medium text-sm transition-colors shadow-sm"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Registering...
                </>
              ) : (
                <>
                  <UserPlus size={16} />
                  Register Candidate
                </>
              )}
            </button>
            <Link
              href="/voters"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-600 px-6 py-2.5 rounded-xl font-medium text-sm transition-colors border border-slate-200"
            >
              Cancel
            </Link>
          </div>
        </div>
      </form>
    </div>

    {/* Existing Candidates in Selected Assembly - Full width */}
    {form.sheetName && (
      <div className="bg-white border-t border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users size={16} className="text-indigo-500" />
              <h2 className="text-sm font-semibold text-slate-700">Existing Candidates in {form.sheetName}</h2>
            </div>
            <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">
              {existingCandidates.length} records
            </span>
          </div>

          {candidatesLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 size={20} className="animate-spin text-indigo-400" />
            </div>
          ) : existingCandidates.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-sm text-slate-400">No candidates found in this assembly yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="py-2.5 px-5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">#</th>
                    <th className="py-2.5 px-5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">Name</th>
                    <th className="py-2.5 px-5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">Mobile</th>
                    <th className="py-2.5 px-5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">Party</th>
                    <th className="py-2.5 px-5 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-400">Status</th>
                    <th className="py-2.5 px-5 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-400">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {existingCandidates.map((c, i) => (
                    <tr key={c.row} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-2.5 px-5 text-slate-400 text-xs">{i + 1}</td>
                      <td className="py-2.5 px-5 font-medium text-slate-800">
                        <div className="flex items-center gap-1.5">
                          {c.name}
                          {c.isDuplicate && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide bg-orange-100 text-orange-600 border border-orange-200">
                              Duplicate
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-5 text-slate-500 font-mono text-xs">{c.mobile || "N/A"}</td>
                      <td className="py-2.5 px-5 text-slate-500">{c.partyName || "—"}</td>
                      <td className="py-2.5 px-5 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          c.status?.toLowerCase() === 'accepted' ? 'bg-emerald-50 text-emerald-700' :
                          c.status?.toLowerCase() === 'rejected' ? 'bg-rose-50 text-rose-700' :
                          'bg-amber-50 text-amber-700'
                        }`}>
                          {c.status?.toLowerCase() === 'accepted' ? 'Accepted' :
                           c.status?.toLowerCase() === 'rejected' ? 'Rejected' : 'Pending'}
                        </span>
                      </td>
                      <td className="py-2.5 px-5 text-center">
                        {c.isDuplicate ? (
                          <span className="text-[10px] text-orange-500 font-medium">Marked</span>
                        ) : (
                          <button
                            onClick={() => markAsDuplicate(c)}
                            disabled={markingDuplicate === c.row}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-orange-50 text-orange-600 hover:bg-orange-100 transition-colors border border-orange-100 disabled:opacity-50"
                            title="Mark as duplicate"
                          >
                            {markingDuplicate === c.row ? (
                              <Loader2 size={11} className="animate-spin" />
                            ) : (
                              <Copy size={11} />
                            )}
                            Duplicate
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </div>
    )}
  </>
  );
}
