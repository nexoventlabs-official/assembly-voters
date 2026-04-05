"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Users,
  Plus,
  Search,
  Filter,
  MessageCircle,
  Mail,
  Phone,
  ChevronDown,
  X,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  Eye,
  Edit3,
  UserPlus,
  Building2
} from "lucide-react";
import Link from "next/link";

interface Voter {
  row: number;
  name: string;
  email: string;
  mobile: string;
  optionalMobile: string;
  partyName: string;
  assemblyName: string;
  status: string;
  sheetName: string;
}

function VotersContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const assemblyFromUrl = searchParams.get("assembly");

  const [voters, setVoters] = useState<Voter[]>([]);
  const [sheets, setSheets] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [sheetsLoaded, setSheetsLoaded] = useState(false);
  const [selectedAssembly, setSelectedAssembly] = useState(assemblyFromUrl || "");
  const [selectedStatus, setSelectedStatus] = useState("total");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVoter, setSelectedVoter] = useState<Voter | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const fetchVoters = useCallback(async () => {
    if (!selectedAssembly) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("assembly", selectedAssembly);
      if (selectedStatus !== "total") params.set("status", selectedStatus);

      const res = await fetch(`/api/voters?${params.toString()}`);
      const data = await res.json();
      setVoters(data.voters || []);
    } catch {
      console.error("Failed to fetch voters");
    } finally {
      setLoading(false);
    }
  }, [selectedAssembly, selectedStatus]);

  const fetchSheets = useCallback(async () => {
    try {
      const res = await fetch("/api/sheets");
      const data = await res.json();
      const sheetList = data.sheets || [];
      setSheets(sheetList);
      // If no assembly selected yet, default to first sheet
      if (!selectedAssembly && sheetList.length > 0) {
        setSelectedAssembly(sheetList[0]);
      }
      setSheetsLoaded(true);
    } catch {
      console.error("Failed to fetch sheets");
      setSheetsLoaded(true);
    }
  }, []);

  useEffect(() => {
    fetchSheets();
  }, [fetchSheets]);

  useEffect(() => {
    if (sheetsLoaded && selectedAssembly) {
      fetchVoters();
    }
  }, [fetchVoters, sheetsLoaded, selectedAssembly]);

  const filteredVoters = voters.filter((v) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      v.name.toLowerCase().includes(q) ||
      v.email.toLowerCase().includes(q) ||
      v.mobile.includes(q) ||
      v.partyName.toLowerCase().includes(q)
    );
  });

  const handleStatusUpdate = async (voter: Voter, newStatus: string) => {
    setUpdatingStatus(true);
    try {
      await fetch("/api/voters/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sheetName: voter.sheetName,
          row: voter.row,
          status: newStatus,
        }),
      });
      // Refresh
      await fetchVoters();
      if (selectedVoter && selectedVoter.row === voter.row && selectedVoter.sheetName === voter.sheetName) {
        setSelectedVoter({ ...voter, status: newStatus });
      }
    } catch {
      console.error("Failed to update status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const s = status?.toLowerCase() || "pending";
    switch (s) {
      case "accepted":
        return (
          <span className="inline-flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full px-3 py-1 text-xs font-semibold shadow-sm">
            <CheckCircle size={12} strokeWidth={2.5} /> Accepted
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-full px-3 py-1 text-xs font-semibold shadow-sm">
            <XCircle size={12} strokeWidth={2.5} /> Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-full px-3 py-1 text-xs font-semibold shadow-sm">
            <Clock size={12} strokeWidth={2.5} /> Pending
          </span>
        );
    }
  };

  const openWhatsApp = (mobile: string) => {
    const cleaned = mobile.replace(/[^0-9]/g, "");
    window.open(`https://wa.me/${cleaned}`, "_blank");
  };

  const openMail = (email: string) => {
    window.open(`mailto:${email}`, "_blank");
  };

  const totalCount = voters.length;
  const acceptedCount = voters.filter(
    (v) => v.status?.toLowerCase() === "accepted"
  ).length;
  const rejectedCount = voters.filter(
    (v) => v.status?.toLowerCase() === "rejected"
  ).length;
  const pendingCount = totalCount - acceptedCount - rejectedCount;

  return (
    <div className="p-6 md:p-8 xl:p-12 max-w-[1600px] mx-auto min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-10 gap-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-2 drop-shadow-sm glow-text">
            Voter Database
          </h1>
          <p className="text-muted text-lg font-light tracking-wide max-w-2xl">
            View, manage, and engage with constituents across assemblies
          </p>
        </div>
        <Link
          href="/voters/add"
          className="inline-flex items-center gap-2 glass-button border border-white/20 text-white px-6 py-3 rounded-xl font-semibold text-sm transition-all"
        >
          <UserPlus size={18} />
          New Voter
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <button
          onClick={() => setSelectedStatus("total")}
          className={`p-5 rounded-2xl border text-left transition-all ${
            selectedStatus === "total"
              ? "border-blue-500/40 bg-blue-500/10 shadow-[0_0_20px_rgba(59,130,246,0.15)]"
              : "border-white/10 glass-panel hover:border-white/20 hover:bg-white/5"
          }`}
        >
          <p className="text-sm text-muted font-medium uppercase tracking-wider mb-1">Total</p>
          <p className="text-3xl font-bold text-white tracking-tight">{totalCount}</p>
        </button>
        <button
          onClick={() => setSelectedStatus("accepted")}
          className={`p-5 rounded-2xl border text-left transition-all ${
            selectedStatus === "accepted"
              ? "border-emerald-500/40 bg-emerald-500/10 shadow-[0_0_20px_rgba(16,185,129,0.15)]"
              : "border-white/10 glass-panel hover:border-white/20 hover:bg-white/5"
          }`}
        >
          <p className="text-sm text-emerald-500/80 font-medium uppercase tracking-wider mb-1">Accepted</p>
          <p className="text-3xl font-bold text-emerald-400 tracking-tight">{acceptedCount}</p>
        </button>
        <button
          onClick={() => setSelectedStatus("rejected")}
          className={`p-5 rounded-2xl border text-left transition-all ${
            selectedStatus === "rejected"
              ? "border-rose-500/40 bg-rose-500/10 shadow-[0_0_20px_rgba(244,63,94,0.15)]"
              : "border-white/10 glass-panel hover:border-white/20 hover:bg-white/5"
          }`}
        >
          <p className="text-sm text-rose-500/80 font-medium uppercase tracking-wider mb-1">Rejected</p>
          <p className="text-3xl font-bold text-rose-400 tracking-tight">{rejectedCount}</p>
        </button>
        <button
          onClick={() => setSelectedStatus("pending")}
          className={`p-5 rounded-2xl border text-left transition-all ${
            selectedStatus === "pending"
              ? "border-amber-500/40 bg-amber-500/10 shadow-[0_0_20px_rgba(245,158,11,0.15)]"
              : "border-white/10 glass-panel hover:border-white/20 hover:bg-white/5"
          }`}
        >
          <p className="text-sm text-amber-500/80 font-medium uppercase tracking-wider mb-1">Pending</p>
          <p className="text-3xl font-bold text-amber-400 tracking-tight">{pendingCount}</p>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        {/* Assembly Filter */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Filter size={16} className="text-muted" />
          </div>
          <select
            value={selectedAssembly}
            onChange={(e) => {
              const val = e.target.value;
              setSelectedAssembly(val);
              router.replace(`/voters?assembly=${encodeURIComponent(val)}`);
            }}
            className="appearance-none glass-input block w-full pl-11 pr-10 py-3 rounded-xl text-sm font-medium min-w-[220px]"
          >
            {sheets.map((sheet) => (
              <option key={sheet} value={sheet} className="bg-zinc-900 text-white">
                {sheet}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
            <ChevronDown size={16} className="text-muted" />
          </div>
        </div>

        {/* Search */}
        <div className="relative flex-1 group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search size={16} className="text-muted group-focus-within:text-primary-light transition-colors" />
          </div>
          <input
            type="text"
            placeholder="Search by name, email, mobile, party..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="glass-input block w-full pl-11 pr-10 py-3 rounded-xl text-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-muted hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Voters Table */}
      <div className="glass-panel rounded-3xl border border-white/10 shadow-2xl overflow-hidden flex flex-col h-[600px] max-h-[60vh]">
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full"></div>
              <Loader2 className="animate-spin text-primary relative z-10" size={40} strokeWidth={1.5} />
            </div>
          </div>
        ) : filteredVoters.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-muted">
            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-4 border border-white/10">
              <Users size={32} className="opacity-50" />
            </div>
            <p className="text-lg font-medium text-white/70">No constituents found</p>
            <p className="text-sm mt-1">Try adjusting your filters or search query</p>
          </div>
        ) : (
          <div className="flex-1 overflow-auto overflow-x-auto p-0">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="sticky top-0 z-20">
                <tr className="glass-header">
                  <th className="py-4 px-6 font-semibold text-white/80 text-xs uppercase tracking-wider border-b border-white/5">
                    Name
                  </th>
                  <th className="py-4 px-6 font-semibold text-white/80 text-xs uppercase tracking-wider border-b border-white/5 hidden md:table-cell">
                    Contact
                  </th>
                  <th className="py-4 px-6 font-semibold text-white/80 text-xs uppercase tracking-wider border-b border-white/5 hidden lg:table-cell">
                    Affiliation
                  </th>
                  <th className="py-4 px-6 font-semibold text-white/80 text-xs uppercase tracking-wider border-b border-white/5 hidden lg:table-cell">
                    Location
                  </th>
                  <th className="py-4 px-6 font-semibold text-white/80 text-xs uppercase tracking-wider border-b border-white/5 text-center">
                    Status
                  </th>
                  <th className="py-4 px-6 font-semibold text-white/80 text-xs uppercase tracking-wider border-b border-white/5 text-center">
                    Quick Connect
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredVoters.map((voter, idx) => (
                  <tr
                    key={`${voter.sheetName}-${voter.row}`}
                    className="group hover:bg-white/[0.03] transition-colors cursor-pointer"
                    onClick={() => {
                      setSelectedVoter(voter);
                      setShowDetailModal(true);
                    }}
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 border border-white/10 flex items-center justify-center text-sm font-bold text-white shadow-inner group-hover:from-primary/50 group-hover:to-accent/50 transition-all">
                          {voter.name?.charAt(0)?.toUpperCase() || "V"}
                        </div>
                        <div>
                          <p className="font-medium text-white/90 group-hover:text-white transition-colors">
                            {voter.name || "—"}
                          </p>
                          <p className="text-xs text-muted md:hidden mt-0.5">
                            {voter.mobile}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 hidden md:table-cell text-muted/80 font-mono text-xs">
                      {voter.mobile || "—"}
                    </td>
                    <td className="py-4 px-6 hidden lg:table-cell text-muted/80">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-white/5 border border-white/5 text-xs">
                        {voter.partyName || "Independent"}
                      </span>
                    </td>
                    <td className="py-4 px-6 hidden lg:table-cell text-muted/80 text-xs">
                      {voter.assemblyName || voter.sheetName}
                    </td>
                    <td className="py-4 px-6 text-center">
                      {getStatusBadge(voter.status)}
                    </td>
                    <td className="py-4 px-6">
                      <div
                        className="flex items-center justify-center gap-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => {
                            setSelectedVoter(voter);
                            setShowDetailModal(true);
                          }}
                          className="w-8 h-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-muted hover:text-white hover:bg-white/10 hover:border-white/20 transition-all"
                          title="View Details"
                        >
                          <Eye size={14} />
                        </button>
                        {voter.mobile && (
                          <button
                            onClick={() => openWhatsApp(voter.mobile)}
                            className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/20 transition-all shadow-[0_0_10px_rgba(16,185,129,0.1)] hover:shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                            title="WhatsApp"
                          >
                            <MessageCircle size={14} />
                          </button>
                        )}
                        {voter.mobile && (
                          <a
                            href={`tel:${voter.mobile}`}
                            className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 hover:text-blue-300 hover:bg-blue-500/20 transition-all shadow-[0_0_10px_rgba(59,130,246,0.1)] hover:shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                            title="Call"
                          >
                            <Phone size={14} />
                          </a>
                        )}
                        {voter.email && (
                          <button
                            onClick={() => openMail(voter.email)}
                            className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 hover:text-purple-300 hover:bg-purple-500/20 transition-all shadow-[0_0_10px_rgba(168,85,247,0.1)] hover:shadow-[0_0_15px_rgba(168,85,247,0.3)]"
                            title="Email"
                          >
                            <Mail size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="glass-header px-6 py-4 flex items-center justify-between text-xs text-muted/70">
          <p>
            Viewing <span className="text-white/90 font-medium">{filteredVoters.length}</span> of <span className="text-white/90 font-medium">{voters.length}</span> records
          </p>
        </div>
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedVoter && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
        >
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setShowDetailModal(false)}
          ></div>
          
          <div
            className="glass-panel w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] relative z-10 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="glass-header p-6 flex flex-row items-center justify-between sticky top-0 z-20">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/50 to-accent/50 border border-white/20 flex items-center justify-center text-xl font-bold text-white shadow-inner">
                  {selectedVoter.name?.charAt(0)?.toUpperCase() || "V"}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white tracking-tight">{selectedVoter.name || "Unknown Constituent"}</h2>
                  <p className="text-sm text-primary-light font-medium flex items-center gap-1.5 mt-0.5">
                    <Building2 size={12} /> {selectedVoter.assemblyName || selectedVoter.sheetName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-muted hover:text-white hover:bg-white/10 transition-colors"
                title="Close"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-8 flex-1">
              
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-widest text-muted mb-4 border-b border-white/5 pb-2">Constituent Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 hover:border-white/10 transition-colors">
                    <p className="text-xs text-muted font-medium mb-1.5 flex items-center gap-1.5"><Mail size={12}/> Email Address</p>
                    <p className="text-sm font-medium text-white/90 break-words">
                      {selectedVoter.email || "—"}
                    </p>
                  </div>
                  <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 hover:border-white/10 transition-colors">
                    <p className="text-xs text-muted font-medium mb-1.5 flex items-center gap-1.5"><Phone size={12}/> Primary Mobile</p>
                    <p className="text-sm font-medium text-white/90 font-mono">
                      {selectedVoter.mobile || "—"}
                    </p>
                  </div>
                  <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 hover:border-white/10 transition-colors">
                    <p className="text-xs text-muted font-medium mb-1.5 flex items-center gap-1.5"><Phone size={12}/> Secondary Mobile</p>
                    <p className="text-sm font-medium text-white/90 font-mono">
                      {selectedVoter.optionalMobile || "—"}
                    </p>
                  </div>
                  <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 hover:border-white/10 transition-colors">
                    <p className="text-xs text-muted font-medium mb-1.5 flex items-center gap-1.5"><Users size={12}/> Political Affiliation</p>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-primary/10 border border-primary/20 text-primary-light text-sm font-medium">
                      {selectedVoter.partyName || "Independent"}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                 <h3 className="text-xs font-semibold uppercase tracking-widest text-muted mb-4 border-b border-white/5 pb-2">Communication & Action</h3>
                 <div className="flex flex-wrap items-center gap-3">
                  {selectedVoter.mobile && (
                    <button
                      onClick={() => openWhatsApp(selectedVoter.mobile)}
                      className="flex items-center gap-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-400 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                    >
                      <MessageCircle size={16} /> Message on WhatsApp
                    </button>
                  )}
                  {selectedVoter.email && (
                    <button
                      onClick={() => openMail(selectedVoter.email)}
                      className="flex items-center gap-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-400 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                    >
                      <Mail size={16} /> Send Email
                    </button>
                  )}
                  {selectedVoter.mobile && (
                    <a
                      href={`tel:${selectedVoter.mobile}`}
                      className="flex items-center gap-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 text-purple-400 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                    >
                      <Phone size={16} /> Voice Call
                    </a>
                  )}
                </div>
              </div>

              {/* Status Update */}
              <div className="bg-black/20 rounded-2xl p-5 border border-white/5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-white tracking-wide">Review & Verification Status</h3>
                  <div className="scale-90 origin-right">{getStatusBadge(selectedVoter.status)}</div>
                </div>
                
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <button
                    disabled={updatingStatus}
                    onClick={() => handleStatusUpdate(selectedVoter, "accepted")}
                    className={`flex-1 w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all border ${
                      selectedVoter.status?.toLowerCase() === "accepted"
                        ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                        : "bg-white/5 border-white/10 text-muted hover:bg-emerald-500/10 hover:border-emerald-500/30 hover:text-emerald-400"
                    }`}
                  >
                    <CheckCircle size={16} strokeWidth={selectedVoter.status?.toLowerCase() === "accepted" ? 3 : 2} /> Verify
                  </button>
                  <button
                    disabled={updatingStatus}
                    onClick={() => handleStatusUpdate(selectedVoter, "rejected")}
                    className={`flex-1 w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all border ${
                      selectedVoter.status?.toLowerCase() === "rejected"
                        ? "bg-rose-500/20 border-rose-500/40 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.2)]"
                        : "bg-white/5 border-white/10 text-muted hover:bg-rose-500/10 hover:border-rose-500/30 hover:text-rose-400"
                    }`}
                  >
                    <XCircle size={16} strokeWidth={selectedVoter.status?.toLowerCase() === "rejected" ? 3 : 2} /> Reject
                  </button>
                  <button
                    disabled={updatingStatus}
                    onClick={() => handleStatusUpdate(selectedVoter, "pending")}
                    className={`flex-1 w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all border ${
                      selectedVoter.status?.toLowerCase() === "pending" || !selectedVoter.status
                        ? "bg-amber-500/20 border-amber-500/40 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                        : "bg-white/5 border-white/10 text-muted hover:bg-amber-500/10 hover:border-amber-500/30 hover:text-amber-400"
                    }`}
                  >
                    <Clock size={16} strokeWidth={selectedVoter.status?.toLowerCase() === "pending" || !selectedVoter.status ? 3 : 2} /> Pending
                  </button>
                </div>
                
                {updatingStatus && (
                  <div className="flex items-center justify-center gap-2 mt-4 text-sm font-medium text-primary-light">
                    <Loader2 size={14} className="animate-spin" /> Synchronizing data...
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function VotersPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="relative">
          <div className="absolute inset-0 bg-primary/30 blur-2xl rounded-full"></div>
          <div className="glass-panel p-6 rounded-3xl flex flex-col items-center gap-4 relative z-10 border border-white/10">
            <Loader2 className="animate-spin text-primary" size={48} strokeWidth={1.5} />
            <span className="text-muted text-sm font-medium tracking-wide pb-1">Loading System...</span>
          </div>
        </div>
      </div>
    }>
      <VotersContent />
    </Suspense>
  );
}
