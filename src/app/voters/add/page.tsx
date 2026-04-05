"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeft,
  UserPlus,
  Loader2,
  CheckCircle,
  AlertCircle,
  ChevronDown,
} from "lucide-react";
import Link from "next/link";

export default function AddVoterPage() {
  const [sheets, setSheets] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

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
        }
      });
  }, []);

  const handleAssemblyChange = (value: string) => {
    setForm((prev) => ({
      ...prev,
      sheetName: value,
      assemblyName: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!form.sheetName || !form.name || !form.mobile) {
      setError("Assembly, constituent name, and primary mobile number are required fields.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/voters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to add constituent record");
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

      setTimeout(() => {
        setSuccess(false);
      }, 4000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "System error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-8 xl:p-10 max-w-3xl mx-auto">
      {/* Back link */}
      <Link
        href="/voters"
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors mb-6"
      >
        <ArrowLeft size={16} />
        Back to Voter Database
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-2">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center">
            <UserPlus size={22} className="text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Add New Voter
            </h1>
            <p className="text-slate-500 text-sm mt-0.5">
              Register a new constituent into the assembly database.
            </p>
          </div>
        </div>
      </div>

      {/* Success Message */}
      {success && (
        <div className="mb-6 flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-5 py-4 text-emerald-700">
          <CheckCircle size={20} strokeWidth={2.5} />
          <p className="text-sm font-medium">Voter registered successfully!</p>
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
            <h2 className="text-sm font-semibold text-slate-700">Voter Details</h2>
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
                  Primary Mobile <span className="text-rose-500">*</span>
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
                  Register Voter
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
  );
}
