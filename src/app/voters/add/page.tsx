"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  UserPlus,
  Loader2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";

export default function AddVoterPage() {
  const router = useRouter();
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
    <div className="p-6 md:p-8 xl:p-12 max-w-4xl mx-auto min-h-[calc(100vh-4rem)] flex flex-col justify-center">
      {/* Header */}
      <div className="mb-10 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 border border-white/10 mb-6 shadow-inner relative group">
          <div className="absolute inset-0 bg-primary/40 rounded-full blur-xl group-hover:bg-primary/60 transition-all opacity-50"></div>
          <UserPlus size={28} className="text-primary-light relative z-10" />
        </div>
        
        <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-4 drop-shadow-sm glow-text">
          Registration Portal
        </h1>
        <p className="text-muted text-lg font-light tracking-wide max-w-lg mx-auto">
          Securely input new constituent records into the primary assembly database
        </p>
      </div>

      {/* Success Message */}
      {success && (
        <div className="mb-8 flex items-center justify-center gap-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.1)] animate-in fade-in slide-in-from-top-4 duration-500">
          <CheckCircle size={24} strokeWidth={2.5} />
          <p className="text-sm font-bold tracking-wide">Record successfully verified and stored!</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-8 flex items-center justify-center gap-3 bg-rose-500/10 border border-rose-500/30 rounded-2xl p-4 text-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.1)] animate-in fade-in slide-in-from-top-4 duration-500">
          <AlertCircle size={24} strokeWidth={2.5} />
          <p className="text-sm font-bold tracking-wide">{error}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="glass-panel rounded-3xl border border-white/10 shadow-2xl p-8 md:p-10 space-y-8 relative overflow-hidden">
          
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
          
          {/* Form Header */}
          <div className="flex items-center justify-between border-b border-white/5 pb-4 relative z-10">
            <h2 className="text-lg font-bold text-white tracking-wide">Record Details</h2>
            <Link
              href="/voters"
              className="inline-flex items-center gap-2 text-sm text-muted hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl"
            >
              <ArrowLeft size={16} />
              Return to DB
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 relative z-10">
            {/* Assembly Selection */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-widest text-muted mb-2">
                Governing Assembly <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={form.sheetName}
                  onChange={(e) => handleAssemblyChange(e.target.value)}
                  className="w-full glass-input appearance-none rounded-xl px-5 py-3.5 text-sm cursor-pointer"
                >
                  <option value="" className="bg-zinc-900">Select an assembly jurisdiction...</option>
                  {sheets.map((sheet) => (
                    <option key={sheet} value={sheet} className="bg-zinc-900 text-white">
                      {sheet}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                  <div className="w-2 h-2 border-b-2 border-r-2 border-muted transform rotate-45"></div>
                </div>
              </div>
            </div>

            {/* Voter Name */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-muted mb-2">
                Full Legal Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="e.g. John Doe"
                className="w-full glass-input rounded-xl px-5 py-3.5 text-sm"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-muted mb-2">Electronic Mail</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, email: e.target.value }))
                }
                placeholder="constituent@example.com"
                className="w-full glass-input rounded-xl px-5 py-3.5 text-sm"
              />
            </div>

            {/* Mobile Numbers */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-muted mb-2">
                Primary Mobile <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                value={form.mobile}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, mobile: e.target.value }))
                }
                placeholder="+91 9876543210"
                className="w-full glass-input rounded-xl px-5 py-3.5 text-sm font-mono"
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-muted mb-2">
                Secondary Contact
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
                className="w-full glass-input rounded-xl px-5 py-3.5 text-sm font-mono"
              />
            </div>

            {/* Party Name */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-muted mb-2">
                Political Affiliation
              </label>
              <input
                type="text"
                value={form.partyName}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, partyName: e.target.value }))
                }
                placeholder="e.g. Independent"
                className="w-full glass-input rounded-xl px-5 py-3.5 text-sm"
              />
            </div>

            {/* Assembly Name (auto-filled) */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-muted mb-2">
                Jurisdiction Identifier
              </label>
              <input
                type="text"
                value={form.assemblyName}
                readOnly
                className="w-full bg-white/5 border border-white/5 rounded-xl px-5 py-3.5 text-sm text-muted cursor-not-allowed"
              />
              <p className="text-[10px] uppercase tracking-wider text-muted/60 mt-2 font-semibold">
                SYSTEM-GENERATED FIELD
              </p>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-3 glass-button text-white px-8 py-4 rounded-xl font-bold tracking-wide transition-all"
          >
            {loading ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Processing Registration...
              </>
            ) : (
              <>
                <UserPlus size={20} />
                Register Constituent
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
