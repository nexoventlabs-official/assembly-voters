"use client";

import { useEffect, useState, useMemo } from "react";
import { apiFetch } from "@/lib/api";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import {
  Search,
  Phone,
  Mail,
  Filter,
  ChevronDown,
  Loader2,
  ThumbsUp,
  ThumbsDown,
  PhoneOff,
  PhoneForwarded,
  AlertTriangle,
  X,
  Clock,
  MessageSquare,
  Users,
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
}

const callStatusOptions = [
  { value: "interested", label: "Interested", icon: ThumbsUp, color: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100" },
  { value: "not_interested", label: "Not Interested", icon: ThumbsDown, color: "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100" },
  { value: "no_response", label: "No Response", icon: PhoneOff, color: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100" },
  { value: "switch_off", label: "Switch Off", icon: PhoneOff, color: "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200" },
  { value: "wrong_number", label: "Wrong Number", icon: AlertTriangle, color: "bg-red-50 text-red-700 border-red-200 hover:bg-red-100" },
  { value: "callback", label: "Callback", icon: PhoneForwarded, color: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100" },
];

// Alliance to party mapping
const ALLIANCES: { value: string; label: string; parties: string[] }[] = [
  {
    value: "spa",
    label: "Secular Progressive Alliance (SPA)",
    parties: ["DMK", "Congress", "INC", "DMDK", "VCK", "CPI", "CPI(M)", "MDMK", "KMDK", "MMK", "SDPI"],
  },
  {
    value: "nda",
    label: "National Democratic Alliance (NDA)",
    parties: ["AIADMK", "BJP", "PMK", "AMMK", "TMC", "IJK", "Puratchi Bharatham"],
  },
  {
    value: "tvk",
    label: "Tamil Vettri Kazhagam (TVK)",
    parties: ["TVK", "Tamil Vettri Kazhagam"],
  },
  {
    value: "ntk",
    label: "Naam Tamilar Katchi (NTK)",
    parties: ["NTK", "Naam Tamilar Katchi"],
  },
];

const statusFilterOptions = [
  { value: "", label: "All" },
  { value: "not_called", label: "Not Called" },
  { value: "interested", label: "Interested" },
  { value: "not_interested", label: "Not Interested" },
  { value: "no_response", label: "No Response" },
  { value: "switch_off", label: "Switch Off" },
  { value: "wrong_number", label: "Wrong Number" },
  { value: "callback", label: "Callback" },
];

export default function TelecallerCandidatesPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [assemblies, setAssemblies] = useState<string[]>([]);
  const [parties, setParties] = useState<string[]>([]);
  const [selectedAssembly, setSelectedAssembly] = useState("");
  const [selectedAlliance, setSelectedAlliance] = useState("");
  const [selectedParty, setSelectedParty] = useState("");
  const [selectedCallStatus, setSelectedCallStatus] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [showStatusPanel, setShowStatusPanel] = useState(false);
  const [statusNotes, setStatusNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [phonePicker, setPhonePicker] = useState<{ numbers: string[]; action: "whatsapp" | "call"; x: number; y: number } | null>(null);

  // Fetch assemblies
  useEffect(() => {
    apiFetch("/api/sheets")
      .then((res) => res.json())
      .then((data) => setAssemblies(data.sheets || []))
      .catch(() => {});
  }, []);

  // Fetch candidates
  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (selectedAssembly) params.set("assembly", selectedAssembly);
    if (selectedParty) params.set("party", selectedParty);
    if (selectedCallStatus) params.set("callStatus", selectedCallStatus);
    params.set("limit", "500");

    apiFetch(`/api/telecaller/candidates?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        setCandidates(data.candidates || []);
        // Extract unique parties
        const uniqueParties = [...new Set((data.candidates || []).map((c: Candidate) => c.partyName).filter(Boolean))].sort();
        setParties(uniqueParties as string[]);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [selectedAssembly, selectedParty, selectedCallStatus]);

  // Get parties for selected alliance
  const allianceParties = useMemo(() => {
    if (!selectedAlliance) return null;
    const alliance = ALLIANCES.find((a) => a.value === selectedAlliance);
    return alliance ? alliance.parties.map((p) => p.toLowerCase()) : null;
  }, [selectedAlliance]);

  // Filter by alliance + search
  const filtered = useMemo(() => {
    let result = candidates;

    // Filter by alliance
    if (allianceParties) {
      result = result.filter((c) =>
        allianceParties.some((ap) => c.partyName.toLowerCase().includes(ap))
      );
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
  }, [candidates, searchQuery, allianceParties]);

  // Parties filtered by alliance for dropdown
  const filteredParties = useMemo(() => {
    if (!allianceParties) return parties;
    return parties.filter((p) =>
      allianceParties.some((ap) => p.toLowerCase().includes(ap))
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

  const handleSetCallStatus = async (status: string) => {
    if (!selectedCandidate) return;
    setSaving(true);
    try {
      const res = await apiFetch("/api/telecaller/call-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          voterId: selectedCandidate._id,
          status,
          notes: statusNotes,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setCandidates((prev) =>
          prev.map((c) =>
            c._id === selectedCandidate._id
              ? { ...c, callStatus: data.callStatus }
              : c
          )
        );
        setSelectedCandidate((prev) =>
          prev ? { ...prev, callStatus: data.callStatus } : prev
        );
        setShowStatusPanel(false);
        setStatusNotes("");
      }
    } catch {
      console.error("Failed to save call status");
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = (callStatus: Candidate["callStatus"]) => {
    if (!callStatus) {
      return <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-400 font-medium">Not Called</span>;
    }
    const opt = callStatusOptions.find((o) => o.value === callStatus.status);
    if (!opt) return null;
    return (
      <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${opt.color}`}>
        {opt.label}
      </span>
    );
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
        {/* Alliance filter */}
        <div className="relative">
          <Users size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <select
            value={selectedAlliance}
            onChange={(e) => { setSelectedAlliance(e.target.value); setSelectedParty(""); }}
            className="appearance-none input-field pl-10 pr-9 py-2.5 text-sm font-medium min-w-[280px]"
          >
            <option value="">All Alliances</option>
            {ALLIANCES.map((a) => (
              <option key={a.value} value={a.value}>{a.label}</option>
            ))}
          </select>
          <ChevronDown size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>

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
        <span className="text-xs font-medium text-slate-400">{filtered.length} candidates</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="py-3.5 px-6 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Name</th>
                <th className="py-3.5 px-6 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Assembly</th>
                <th className="py-3.5 px-6 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Party</th>
                <th className="py-3.5 px-6 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Mobile</th>
                <th className="py-3.5 px-6 text-[11px] font-semibold uppercase tracking-wider text-slate-400 text-center">Call Status</th>
                <th className="py-3.5 px-6 text-[11px] font-semibold uppercase tracking-wider text-slate-400 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr
                  key={c._id}
                  className="border-b border-slate-50 hover:bg-slate-50/50 cursor-pointer transition-colors"
                  onClick={() => { setSelectedCandidate(c); setShowStatusPanel(false); setStatusNotes(""); }}
                >
                  <td className="py-3.5 px-6">
                    <p className="text-sm font-medium text-slate-800">{c.name}</p>
                    <p className="text-[11px] text-slate-400">{c.email || "—"}</p>
                  </td>
                  <td className="py-3.5 px-6 text-sm text-slate-600">{c.assemblyName}</td>
                  <td className="py-3.5 px-6 text-sm text-slate-600">{c.partyName}</td>
                  <td className="py-3.5 px-6 text-sm text-slate-600 font-mono">{c.mobile}</td>
                  <td className="py-3.5 px-6 text-center">{getStatusBadge(c.callStatus)}</td>
                  <td className="py-3.5 px-6">
                    <div className="flex items-center justify-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => handlePhoneAction(c, "whatsapp", e)}
                        disabled={!hasMobile(c.mobile)}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${hasMobile(c.mobile) ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100" : "bg-slate-100 text-slate-300 cursor-not-allowed"}`}
                        title="WhatsApp"
                      >
                        <WhatsAppIcon size={15} />
                      </button>
                      <button
                        onClick={(e) => handlePhoneAction(c, "call", e)}
                        disabled={!hasMobile(c.mobile)}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${hasMobile(c.mobile) ? "bg-blue-50 text-blue-600 hover:bg-blue-100" : "bg-slate-100 text-slate-300 cursor-not-allowed"}`}
                        title="Call"
                      >
                        <Phone size={14} />
                      </button>
                      <button
                        onClick={() => hasEmail(c.email) && openMail(c.email)}
                        disabled={!hasEmail(c.email)}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${hasEmail(c.email) ? "bg-violet-50 text-violet-600 hover:bg-violet-100" : "bg-slate-100 text-slate-300 cursor-not-allowed"}`}
                        title="Email"
                      >
                        <Mail size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-slate-400 text-sm">No candidates found.</div>
        )}
      </div>

      {/* Candidate Detail Modal */}
      {selectedCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setSelectedCandidate(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-bold text-slate-900">{selectedCandidate.name}</h2>
                <p className="text-xs text-slate-400 mt-0.5">{selectedCandidate.assemblyName} • {selectedCandidate.partyName}</p>
              </div>
              <button onClick={() => setSelectedCandidate(null)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Contact Info */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <p className="text-xs text-slate-400 font-medium mb-1 flex items-center gap-1.5"><Phone size={12} /> Mobile</p>
                  <p className="text-sm font-medium text-slate-800 font-mono">{selectedCandidate.mobile || "—"}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <p className="text-xs text-slate-400 font-medium mb-1 flex items-center gap-1.5"><Mail size={12} /> Email</p>
                  <p className="text-sm font-medium text-slate-800 break-words">{selectedCandidate.email || "—"}</p>
                </div>
                {hasMobile(selectedCandidate.optionalMobile) && (
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 col-span-2">
                    <p className="text-xs text-slate-400 font-medium mb-1 flex items-center gap-1.5"><Phone size={12} /> Secondary Mobile</p>
                    <p className="text-sm font-medium text-slate-800 font-mono">{selectedCandidate.optionalMobile}</p>
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={(e) => handlePhoneAction(selectedCandidate, "whatsapp", e)}
                  disabled={!hasMobile(selectedCandidate.mobile)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors border ${hasMobile(selectedCandidate.mobile) ? "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-100" : "bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed"}`}
                >
                  <WhatsAppIcon size={15} /> WhatsApp
                </button>
                <button
                  onClick={(e) => handlePhoneAction(selectedCandidate, "call", e)}
                  disabled={!hasMobile(selectedCandidate.mobile)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors border ${hasMobile(selectedCandidate.mobile) ? "bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-100" : "bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed"}`}
                >
                  <Phone size={15} /> Call
                </button>
                <button
                  onClick={() => hasEmail(selectedCandidate.email) && openMail(selectedCandidate.email)}
                  disabled={!hasEmail(selectedCandidate.email)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors border ${hasEmail(selectedCandidate.email) ? "bg-violet-50 hover:bg-violet-100 text-violet-700 border-violet-100" : "bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed"}`}
                >
                  <Mail size={15} /> Email
                </button>
              </div>

              {/* Current Status */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Call Status</p>
                  {getStatusBadge(selectedCandidate.callStatus)}
                </div>
                {selectedCandidate.callStatus && (
                  <div className="text-xs text-slate-500">
                    <p>Last called: {new Date(selectedCandidate.callStatus.calledAt).toLocaleString("en-IN")}</p>
                    {selectedCandidate.callStatus.notes && <p className="mt-1">Notes: {selectedCandidate.callStatus.notes}</p>}
                  </div>
                )}
              </div>

              {/* Update Status */}
              {!showStatusPanel ? (
                <button
                  onClick={() => setShowStatusPanel(true)}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
                >
                  <Clock size={15} /> Update Call Status
                </button>
              ) : (
                <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100 space-y-3">
                  <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wider">Select Status</p>
                  <div className="grid grid-cols-2 gap-2">
                    {callStatusOptions.map((opt) => {
                      const Icon = opt.icon;
                      return (
                        <button
                          key={opt.value}
                          disabled={saving}
                          onClick={() => handleSetCallStatus(opt.value)}
                          className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium transition-colors border ${opt.color}`}
                        >
                          <Icon size={14} /> {opt.label}
                        </button>
                      );
                    })}
                  </div>
                  <div className="relative">
                    <MessageSquare size={14} className="absolute left-3 top-3 text-slate-400" />
                    <textarea
                      value={statusNotes}
                      onChange={(e) => setStatusNotes(e.target.value)}
                      placeholder="Add notes (optional)..."
                      rows={2}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 resize-none"
                    />
                  </div>
                  {saving && (
                    <div className="flex items-center justify-center gap-2 text-sm text-indigo-600">
                      <Loader2 size={14} className="animate-spin" /> Saving...
                    </div>
                  )}
                </div>
              )}
            </div>
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
