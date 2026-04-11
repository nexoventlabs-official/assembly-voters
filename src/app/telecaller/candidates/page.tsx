"use client";

import { useEffect, useState, useMemo } from "react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import {
  Search,
  Phone,
  Mail,
  Filter,
  ChevronDown,
  Loader2,
  Users,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface Candidate {
  _id: string;
  name: string;
  email: string;
  mobile: string;
  optionalMobile: string;
  partyName: string;
  assemblyName: string;
  sheetName: string;
  callStatus: {
    _id: string;
    status: string;
    notes: string;
    calledAt: string;
  } | null;
  calledBy: string[];
}

const callStatusOptions = [
  { value: "interested", label: "Interested", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { value: "not_interested", label: "Not Interested", color: "bg-rose-50 text-rose-700 border-rose-200" },
  { value: "no_response", label: "No Response", color: "bg-amber-50 text-amber-700 border-amber-200" },
  { value: "switch_off", label: "Switch Off", color: "bg-slate-100 text-slate-700 border-slate-200" },
  { value: "wrong_number", label: "Wrong Number", color: "bg-red-50 text-red-700 border-red-200" },
  { value: "callback", label: "Callback", color: "bg-blue-50 text-blue-700 border-blue-200" },
  { value: "first_call_completed", label: "1st Call Done", color: "bg-cyan-50 text-cyan-700 border-cyan-200" },
  { value: "second_call_completed", label: "2nd Call Done", color: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  { value: "third_call_completed", label: "3rd Call Done", color: "bg-purple-50 text-purple-700 border-purple-200" },
  { value: "withdrawn", label: "Withdrawn", color: "bg-orange-50 text-orange-700 border-orange-200" },
];

// Alliance to party mapping
const ALLIANCES: { value: string; label: string; parties: string[] }[] = [
  {
    value: "spa",
    label: "Secular Progressive Alliance (SPA)",
    parties: ["Dravida Munnetra Kazhagam", "Indian National Congress", "Desiya Murpokku Dravida Kazhagam", "Viduthalai Chiruthaigal Katchi", "Communist Party of India (Marxist)", "Communist Party of India", "Marumalarchi Dravida Munnetra Kazhagam"],
  },
  {
    value: "nda",
    label: "National Democratic Alliance (NDA)",
    parties: ["All India Anna Dravida Munnetra Kazhagam", "Bharatiya Janata Party", "Pattali Makkal Katchi", "Amma Makkal Munnettra Kazagam"],
  },
  {
    value: "tvk",
    label: "Tamil Vettri Kazhagam (TVK)",
    parties: ["TVK", "Tamil Vettri Kazhagam", "Tamilaga Vettri Kazhagam"],
  },
  {
    value: "ntk",
    label: "Naam Tamilar Katchi (NTK)",
    parties: ["NTK", "Naam Tamilar Katchi", "Naam Tamilar"],
  },
  {
    value: "others",
    label: "Others / Independent",
    parties: [],
  },
];

// All known alliance party keywords (for "others" filter)
const ALL_ALLIANCE_PARTIES = ALLIANCES
  .filter((a) => a.value !== "others")
  .flatMap((a) => a.parties.map((p) => p.toLowerCase()));

// Locked alliance per telecaller — they cannot change this filter
const TELECALLER_ALLIANCE_LOCK: Record<string, string> = {
  Telecaller1: "spa",
  Telecaller2: "nda",
  Telecaller3: "ntk",
  Telecaller4: "tvk",
};

const statusFilterOptions = [
  { value: "", label: "All" },
  { value: "not_called", label: "Not Called" },
  { value: "interested", label: "Interested" },
  { value: "not_interested", label: "Not Interested" },
  { value: "no_response", label: "No Response" },
  { value: "switch_off", label: "Switch Off" },
  { value: "wrong_number", label: "Wrong Number" },
  { value: "callback", label: "Callback" },
  { value: "first_call_completed", label: "1st Call Done" },
  { value: "second_call_completed", label: "2nd Call Done" },
  { value: "third_call_completed", label: "3rd Call Done" },
  { value: "withdrawn", label: "Withdrawn" },
];

export default function TelecallerCandidatesPage() {
  const { username } = useAuth();
  const lockedAlliance = username ? TELECALLER_ALLIANCE_LOCK[username] || "" : "";

  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [assemblies, setAssemblies] = useState<string[]>([]);
  const [parties, setParties] = useState<string[]>([]);
  const [selectedAssembly, setSelectedAssembly] = useState("");
  const [showAllianceFilter, setShowAllianceFilter] = useState(false);
  const [selectedAlliance, setSelectedAlliance] = useState(lockedAlliance);
  const [selectedParty, setSelectedParty] = useState("");
  const [selectedCallStatus, setSelectedCallStatus] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [inlineNotes, setInlineNotes] = useState<Record<string, string>>({});
  const [phonePicker, setPhonePicker] = useState<{ numbers: string[]; action: "whatsapp" | "call"; x: number; y: number } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 50;

  // Lock alliance filter for assigned telecallers
  useEffect(() => {
    if (lockedAlliance) {
      setSelectedAlliance(lockedAlliance);
      setShowAllianceFilter(true);
    }
  }, [lockedAlliance]);

  // Fetch assemblies
  useEffect(() => {
    apiFetch("/api/sheets")
      .then((res) => res.json())
      .then((data) => setAssemblies(data.sheets || []))
      .catch(() => {});
  }, []);

  // Fetch candidates — fetch all, filter client-side
  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (selectedAssembly) params.set("assembly", selectedAssembly);
    if (selectedCallStatus) params.set("callStatus", selectedCallStatus);
    params.set("limit", "all");

    apiFetch(`/api/telecaller/candidates?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        console.log("[Telecaller] Fetched candidates:", data.candidates?.length, "total:", data.total, "totalAll:", data.totalAll, "filterUsed:", data.filterUsed);
        setCandidates(data.candidates || []);
        // Extract unique parties
        const uniqueParties = [...new Set((data.candidates || []).map((c: Candidate) => c.partyName).filter(Boolean))].sort();
        setParties(uniqueParties as string[]);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [selectedAssembly, selectedCallStatus]);

  // Get parties for selected alliance
  const allianceParties = useMemo(() => {
    if (!selectedAlliance) return null;
    if (selectedAlliance === "others") return "others";
    const alliance = ALLIANCES.find((a) => a.value === selectedAlliance);
    return alliance ? alliance.parties.map((p) => p.toLowerCase()) : null;
  }, [selectedAlliance]);

  // Filter by alliance + party + search
  const filtered = useMemo(() => {
    let result = candidates;

    // Filter by alliance (exact match, case-insensitive)
    if (allianceParties === "others") {
      result = result.filter((c) => {
        const pLower = c.partyName.toLowerCase().trim();
        return !ALL_ALLIANCE_PARTIES.some((ap) => pLower === ap);
      });
    } else if (allianceParties) {
      result = result.filter((c) => {
        const pLower = c.partyName.toLowerCase().trim();
        return allianceParties.some((ap) => pLower === ap);
      });
    }

    // Filter by specific party
    if (selectedParty) {
      result = result.filter((c) => c.partyName === selectedParty);
    }

    // Filter by search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.mobile.includes(q) ||
          c.partyName.toLowerCase().includes(q) ||
          c.assemblyName.toLowerCase().includes(q)
      );
    }

    return result;
  }, [candidates, searchQuery, allianceParties, selectedParty]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedAlliance, selectedAssembly, selectedParty, selectedCallStatus, searchQuery]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginatedCandidates = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // Parties filtered by alliance for dropdown (exact match)
  const filteredParties = useMemo(() => {
    if (!allianceParties) return parties;
    if (allianceParties === "others") {
      return parties.filter((p) =>
        !ALL_ALLIANCE_PARTIES.some((ap) => p.toLowerCase().trim() === ap)
      );
    }
    return parties.filter((p) =>
      allianceParties.some((ap) => p.toLowerCase().trim() === ap)
    );
  }, [parties, allianceParties]);

  const hasMobile = (val?: string) => !!val && val.trim() !== "" && val.trim().toUpperCase() !== "N/A";
  const hasEmail = (val?: string) => !!val && val.trim() !== "" && val.trim().toUpperCase() !== "N/A";

  const doWhatsApp = (mobile: string) => {
    const cleaned = mobile.replace(/[^0-9]/g, "");
    window.open(`https://wa.me/${cleaned}`, "_blank");
  };

  const doCall = (mobile: string) => {
    window.open(`tel:${mobile}`, "_self");
  };

  const handlePhoneAction = (candidate: Candidate, action: "whatsapp" | "call", e: React.MouseEvent) => {
    if (!hasMobile(candidate.mobile)) return;
    const numbers = [candidate.mobile];
    if (hasMobile(candidate.optionalMobile)) numbers.push(candidate.optionalMobile);
    if (numbers.length > 1) {
      setPhonePicker({ numbers, action, x: e.clientX, y: e.clientY });
    } else {
      if (action === "whatsapp") doWhatsApp(candidate.mobile);
      else doCall(candidate.mobile);
    }
  };

  const pickNumber = (number: string) => {
    if (!phonePicker) return;
    if (phonePicker.action === "whatsapp") doWhatsApp(number);
    else doCall(number);
    setPhonePicker(null);
  };

  const openMail = (email: string) => {
    window.open(`https://mail.google.com/mail/?view=cm&to=${encodeURIComponent(email)}`, "_blank");
  };

  const handleSaveNotes = async (candidateId: string) => {
    const candidate = candidates.find((c) => c._id === candidateId);
    if (!candidate?.callStatus) return; // no call status yet, notes will be sent with next status change
    const currentNotes = inlineNotes[candidateId];
    if (currentNotes === undefined) return; // not edited
    if (currentNotes === (candidate.callStatus.notes || "")) return; // no change
    setSavingId(candidateId);
    try {
      const res = await apiFetch("/api/telecaller/call-status/notes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voterId: candidateId, notes: currentNotes }),
      });
      const data = await res.json();
      if (data.success) {
        setCandidates((prev) =>
          prev.map((c) =>
            c._id === candidateId ? { ...c, callStatus: data.callStatus } : c
          )
        );
      }
    } catch {
      console.error("Failed to save notes");
    } finally {
      setSavingId(null);
    }
  };

  const handleInlineStatus = async (candidateId: string, status: string) => {
    setSavingId(candidateId);
    try {
      const res = await apiFetch("/api/telecaller/call-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          voterId: candidateId,
          status,
          notes: inlineNotes[candidateId] || "",
        }),
      });
      const data = await res.json();
      if (data.success) {
        const tcName = data.callStatus?.telecaller || "";
        setCandidates((prev) =>
          prev.map((c) =>
            c._id === candidateId
              ? {
                  ...c,
                  callStatus: data.callStatus,
                  calledBy: c.calledBy?.includes(tcName) ? c.calledBy : [...(c.calledBy || []), tcName],
                }
              : c
          )
        );
      }
    } catch {
      console.error("Failed to save call status");
    } finally {
      setSavingId(null);
    }
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center">
            <Loader2 className="animate-spin text-indigo-600" size={24} />
          </div>
          <p className="text-slate-400 text-sm font-medium">Loading candidates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 xl:p-10 max-w-[1440px] mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Candidates</h1>
        <p className="text-slate-500 mt-1">Call candidates and update their status.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row flex-wrap gap-3 mb-6">
        {/* Alliance filter toggle button */}
        {!lockedAlliance && (
          <button
            onClick={() => {
              const next = !showAllianceFilter;
              setShowAllianceFilter(next);
              if (!next) { setSelectedAlliance(""); setSelectedParty(""); }
            }}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors border ${
              showAllianceFilter
                ? "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            }`}
          >
            <Users size={15} />
            {showAllianceFilter ? "Hide Alliance" : "Filter by Alliance"}
          </button>
        )}

        {/* Alliance filter dropdown (only shown when toggled on) */}
        {showAllianceFilter && (
          <div className="relative">
            <Users size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <select
              value={selectedAlliance}
              onChange={(e) => { if (!lockedAlliance) { setSelectedAlliance(e.target.value); setSelectedParty(""); } }}
              disabled={!!lockedAlliance}
              className={`appearance-none input-field pl-10 pr-9 py-2.5 text-sm font-medium min-w-[280px] ${lockedAlliance ? "opacity-70 cursor-not-allowed bg-slate-50" : ""}`}
            >
              <option value="">Select Alliance</option>
              {ALLIANCES.map((a) => (
                <option key={a.value} value={a.value}>{a.label}</option>
              ))}
            </select>
            <ChevronDown size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        )}

        {/* Assembly filter */}
        <div className="relative">
          <Filter size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <select
            value={selectedAssembly}
            onChange={(e) => setSelectedAssembly(e.target.value)}
            className="appearance-none input-field pl-10 pr-9 py-2.5 text-sm font-medium min-w-[200px]"
          >
            <option value="">All Assemblies</option>
            {assemblies.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
          <ChevronDown size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>

        {/* Party filter (filtered by alliance) */}
        <div className="relative">
          <Filter size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <select
            value={selectedParty}
            onChange={(e) => setSelectedParty(e.target.value)}
            className="appearance-none input-field pl-10 pr-9 py-2.5 text-sm font-medium min-w-[180px]"
          >
            <option value="">{selectedAlliance ? "All Alliance Parties" : "All Parties"}</option>
            {filteredParties.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <ChevronDown size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>

        {/* Call status filter */}
        <div className="relative">
          <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <select
            value={selectedCallStatus}
            onChange={(e) => setSelectedCallStatus(e.target.value)}
            className="appearance-none input-field pl-10 pr-9 py-2.5 text-sm font-medium min-w-[160px]"
          >
            {statusFilterOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <ChevronDown size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>

        {/* Search */}
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, mobile, party..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field w-full pl-10 pr-4 py-2.5 text-sm"
          />
        </div>
      </div>

      {/* Count */}
      <div className="mb-4">
        <span className="text-xs font-medium text-slate-400">{filtered.length} candidates <span className="text-slate-300">({candidates.length} loaded)</span></span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="py-3.5 px-4 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Name</th>
                <th className="py-3.5 px-4 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Assembly</th>
                <th className="py-3.5 px-4 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Party</th>
                <th className="py-3.5 px-4 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Mobile</th>
                <th className="py-3.5 px-4 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Call Status</th>
                <th className="py-3.5 px-4 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Comment</th>
                <th className="py-3.5 px-4 text-[11px] font-semibold uppercase tracking-wider text-slate-400 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedCandidates.map((c) => (
                <tr
                  key={c._id}
                  className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors"
                >
                  <td className="py-3 px-4">
                    <p className="text-sm font-medium text-slate-800">
                      {c.name}
                      {c.calledBy && c.calledBy.length > 0 && c.calledBy.map((tc) => {
                        const num = tc.replace(/\D/g, "");
                        return (
                          <span
                            key={tc}
                            className="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-100 text-indigo-700 border border-indigo-200"
                            title={`Called by ${tc}`}
                          >
                            T{num}
                          </span>
                        );
                      })}
                    </p>
                    <p className="text-[11px] text-slate-400">{c.email || "—"}</p>
                  </td>
                  <td className="py-3 px-4 text-xs text-slate-600">{c.assemblyName}</td>
                  <td className="py-3 px-4 text-xs text-slate-600">{c.partyName}</td>
                  <td className="py-3 px-4 text-xs text-slate-600 font-mono">{c.mobile}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5">
                      <select
                        value={c.callStatus?.status || ""}
                        disabled={savingId === c._id}
                        onChange={(e) => {
                          if (e.target.value) handleInlineStatus(c._id, e.target.value);
                        }}
                        className={`text-xs rounded-lg border px-2 py-1.5 font-medium min-w-[120px] appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
                          c.callStatus
                            ? callStatusOptions.find((o) => o.value === c.callStatus?.status)?.color || "bg-slate-50 text-slate-600 border-slate-200"
                            : "bg-slate-50 text-slate-400 border-slate-200"
                        }`}
                      >
                        <option value="">Not Called</option>
                        {callStatusOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                      {savingId === c._id && <Loader2 size={12} className="animate-spin text-indigo-500" />}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <input
                      type="text"
                      placeholder="Add note..."
                      value={inlineNotes[c._id] ?? c.callStatus?.notes ?? ""}
                      onChange={(e) => setInlineNotes((prev) => ({ ...prev, [c._id]: e.target.value }))}
                      onBlur={() => handleSaveNotes(c._id)}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.currentTarget.blur(); } }}
                      className="text-xs w-full min-w-[120px] max-w-[200px] rounded-lg border border-slate-200 px-2.5 py-1.5 text-slate-600 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300"
                    />
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={(e) => handlePhoneAction(c, "whatsapp", e)}
                        disabled={!hasMobile(c.mobile)}
                        className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${hasMobile(c.mobile) ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100" : "bg-slate-100 text-slate-300 cursor-not-allowed"}`}
                        title="WhatsApp"
                      >
                        <WhatsAppIcon size={14} />
                      </button>
                      <button
                        onClick={(e) => handlePhoneAction(c, "call", e)}
                        disabled={!hasMobile(c.mobile)}
                        className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${hasMobile(c.mobile) ? "bg-blue-50 text-blue-600 hover:bg-blue-100" : "bg-slate-100 text-slate-300 cursor-not-allowed"}`}
                        title="Call"
                      >
                        <Phone size={13} />
                      </button>
                      <button
                        onClick={() => hasEmail(c.email) && openMail(c.email)}
                        disabled={!hasEmail(c.email)}
                        className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${hasEmail(c.email) ? "bg-violet-50 text-violet-600 hover:bg-violet-100" : "bg-slate-100 text-slate-300 cursor-not-allowed"}`}
                        title="Email"
                      >
                        <Mail size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {paginatedCandidates.length === 0 && (
          <div className="text-center py-12 text-slate-400 text-sm">No candidates found.</div>
        )}
      </div>

      {/* Pagination */}
      {filtered.length > PAGE_SIZE && (
        <div className="flex items-center justify-between mt-4 px-1">
          <span className="text-xs text-slate-400 font-medium">
            Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filtered.length)} of {filtered.length}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors border ${
                currentPage === 1 ? "bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed" : "bg-white text-slate-600 border-slate-200 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200"
              }`}
            >
              <ChevronLeft size={15} />
            </button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 7) {
                pageNum = i + 1;
              } else if (currentPage <= 4) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 3) {
                pageNum = totalPages - 6 + i;
              } else {
                pageNum = currentPage - 3 + i;
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-medium transition-colors border ${
                    currentPage === pageNum
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors border ${
                currentPage === totalPages ? "bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed" : "bg-white text-slate-600 border-slate-200 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200"
              }`}
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}

      {/* Phone Number Picker Popup */}
      {phonePicker && (
        <>
          <div className="fixed inset-0 z-[70]" onClick={() => setPhonePicker(null)} />
          <div
            className="fixed z-[80] bg-white rounded-xl shadow-2xl border border-slate-200 p-3 min-w-[220px]"
            style={{
              left: Math.min(phonePicker.x, typeof window !== "undefined" ? window.innerWidth - 240 : 400),
              top: Math.min(phonePicker.y + 8, typeof window !== "undefined" ? window.innerHeight - 160 : 400),
            }}
          >
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-2 mb-2">
              {phonePicker.action === "whatsapp" ? "WhatsApp" : "Call"} which number?
            </p>
            {phonePicker.numbers.map((num, i) => (
              <button
                key={num}
                onClick={() => pickNumber(num)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
              >
                <Phone size={14} />
                <span>{num}</span>
                <span className="ml-auto text-[10px] font-medium text-slate-400 uppercase">
                  {i === 0 ? "Primary" : "Secondary"}
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
