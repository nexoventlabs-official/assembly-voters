"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Users,
  Search,
  Filter,
  Mail,
  Phone,
  ChevronDown,
  X,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  UserPlus,
  Building2,
  Copy
} from "lucide-react";
import Link from "next/link";
import WhatsAppIcon from "@/components/WhatsAppIcon";

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
      setSheets(data.sheets || []);
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
    if (sheetsLoaded) {
      if (!selectedAssembly && sheets.length > 0) {
        setSelectedAssembly(sheets[0]);
        router.replace(`/voters?assembly=${encodeURIComponent(sheets[0])}`);
      } else if (selectedAssembly) {
        fetchVoters();
      }
    }
  }, [fetchVoters, sheetsLoaded, selectedAssembly, sheets, router]);

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
          <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 rounded-full px-3 py-1 text-xs font-semibold">
            <CheckCircle size={12} strokeWidth={2.5} /> Accepted
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1.5 bg-rose-50 text-rose-700 rounded-full px-3 py-1 text-xs font-semibold">
            <XCircle size={12} strokeWidth={2.5} /> Rejected
          </span>
        );
      case "duplicate":
        return (
          <span className="inline-flex items-center gap-1.5 bg-orange-50 text-orange-700 rounded-full px-3 py-1 text-xs font-semibold">
            <Copy size={12} strokeWidth={2.5} /> Duplicate
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 rounded-full px-3 py-1 text-xs font-semibold">
            <Clock size={12} strokeWidth={2.5} /> Pending
          </span>
        );
    }
  };

  const hasMobile = (val?: string) => !!val && val.trim() !== "" && val.trim().toUpperCase() !== "N/A";
  const hasEmail = (val?: string) => !!val && val.trim() !== "" && val.trim().toUpperCase() !== "N/A";

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

  const statusTabs = [
    { key: "total", label: "All", count: totalCount, color: "indigo" },
    { key: "accepted", label: "Accepted", count: acceptedCount, color: "emerald" },
    { key: "rejected", label: "Rejected", count: rejectedCount, color: "rose" },
    { key: "pending", label: "Pending", count: pendingCount, color: "amber" },
  ];

  return (
    <div className="p-6 md:p-8 xl:p-10 max-w-[1440px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Voter Database
          </h1>
          <p className="text-slate-500 mt-1">
            View, manage, and engage with constituents across assemblies.
          </p>
        </div>
        <Link
          href="/voters/add"
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-colors shadow-sm"
        >
          <UserPlus size={16} />
          Add Candidate
        </Link>
      </div>

      {/* Status Tabs */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
        {statusTabs.map((tab) => {
          const isActive = selectedStatus === tab.key;
          const colorMap: Record<string, string> = {
            indigo: isActive ? "bg-indigo-600 text-white" : "bg-white text-slate-600 hover:bg-slate-50",
            emerald: isActive ? "bg-emerald-600 text-white" : "bg-white text-slate-600 hover:bg-slate-50",
            rose: isActive ? "bg-rose-600 text-white" : "bg-white text-slate-600 hover:bg-slate-50",
            amber: isActive ? "bg-amber-500 text-white" : "bg-white text-slate-600 hover:bg-slate-50",
          };
          return (
            <button
              key={tab.key}
              onClick={() => setSelectedStatus(tab.key)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                isActive
                  ? `${colorMap[tab.color]} border-transparent shadow-sm`
                  : `${colorMap[tab.color]} border-slate-200`
              }`}
            >
              {tab.label}
              <span className={`text-xs font-bold px-1.5 py-0.5 rounded-md ${
                isActive ? "bg-white/20" : "bg-slate-100 text-slate-500"
              }`}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative">
          <Filter size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <select
            value={selectedAssembly}
            onChange={(e) => {
              const val = e.target.value;
              setSelectedAssembly(val);
              router.replace(`/voters?assembly=${encodeURIComponent(val)}`);
            }}
            className="appearance-none input-field pl-10 pr-9 py-2.5 text-sm font-medium min-w-[220px]"
          >
            {sheets.map((sheet) => (
              <option key={sheet} value={sheet}>
                {sheet}
              </option>
            ))}
          </select>
          <ChevronDown size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>

        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, email, mobile, party..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field w-full pl-10 pr-9 py-2.5 text-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Voters Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 className="animate-spin text-indigo-600" size={28} />
            <p className="text-slate-400 text-sm mt-3">Loading voters...</p>
          </div>
        ) : filteredVoters.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
              <Users size={28} className="text-slate-300" />
            </div>
            <p className="text-base font-medium text-slate-500">No constituents found</p>
            <p className="text-sm mt-1">Try adjusting your filters or search query</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100">
                  <th className="py-3 px-6 font-semibold text-slate-500 text-xs uppercase tracking-wider text-left">
                    Name
                  </th>
                  <th className="py-3 px-6 font-semibold text-slate-500 text-xs uppercase tracking-wider text-left hidden md:table-cell">
                    Contact
                  </th>
                  <th className="py-3 px-6 font-semibold text-slate-500 text-xs uppercase tracking-wider text-left hidden lg:table-cell">
                    Party
                  </th>
                  <th className="py-3 px-6 font-semibold text-slate-500 text-xs uppercase tracking-wider text-left hidden lg:table-cell">
                    Assembly
                  </th>
                  <th className="py-3 px-6 font-semibold text-slate-500 text-xs uppercase tracking-wider text-center">
                    Status
                  </th>
                  <th className="py-3 px-6 font-semibold text-slate-500 text-xs uppercase tracking-wider text-center">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredVoters.map((voter) => (
                  <tr
                    key={`${voter.sheetName}-${voter.row}`}
                    className="group hover:bg-slate-50/60 transition-colors cursor-pointer"
                    onClick={() => {
                      setSelectedVoter(voter);
                      setShowDetailModal(true);
                    }}
                  >
                    <td className="py-3.5 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center text-sm font-bold text-indigo-600 group-hover:bg-indigo-100 transition-colors">
                          {voter.name?.charAt(0)?.toUpperCase() || "V"}
                        </div>
                        <div>
                          <p className="font-medium text-slate-800">
                            {voter.name || "—"}
                          </p>
                          <p className="text-xs text-slate-400 md:hidden mt-0.5">
                            {voter.mobile}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-6 hidden md:table-cell text-slate-500 font-mono text-xs">
                      {voter.mobile || "—"}
                    </td>
                    <td className="py-3.5 px-6 hidden lg:table-cell">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-medium">
                        {voter.partyName || "Independent"}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 hidden lg:table-cell text-slate-500 text-xs">
                      {voter.assemblyName || voter.sheetName}
                    </td>
                    <td className="py-3.5 px-6 text-center">
                      {getStatusBadge(voter.status)}
                    </td>
                    <td className="py-3.5 px-6">
                      <div
                        className="flex items-center justify-center gap-1.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => hasMobile(voter.mobile) && openWhatsApp(voter.mobile)}
                          disabled={!hasMobile(voter.mobile)}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${hasMobile(voter.mobile) ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'bg-slate-100 text-slate-300 cursor-not-allowed'}`}
                          title={hasMobile(voter.mobile) ? 'WhatsApp' : 'No mobile number'}
                        >
                          <WhatsAppIcon size={15} />
                        </button>
                        <a
                          href={hasMobile(voter.mobile) ? `tel:${voter.mobile}` : undefined}
                          onClick={(e) => !hasMobile(voter.mobile) && e.preventDefault()}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${hasMobile(voter.mobile) ? 'bg-blue-50 text-blue-600 hover:bg-blue-100' : 'bg-slate-100 text-slate-300 cursor-not-allowed'}`}
                          title={hasMobile(voter.mobile) ? 'Call' : 'No mobile number'}
                        >
                          <Phone size={14} />
                        </a>
                        <button
                          onClick={() => hasEmail(voter.email) && openMail(voter.email)}
                          disabled={!hasEmail(voter.email)}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${hasEmail(voter.email) ? 'bg-violet-50 text-violet-600 hover:bg-violet-100' : 'bg-slate-100 text-slate-300 cursor-not-allowed'}`}
                          title={hasEmail(voter.email) ? 'Email' : 'No email address'}
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
        )}
        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
          <p>
            Showing <span className="text-slate-700 font-medium">{filteredVoters.length}</span> of <span className="text-slate-700 font-medium">{voters.length}</span> records
          </p>
          <p className="text-slate-400">{selectedAssembly}</p>
        </div>
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedVoter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity"
            onClick={() => setShowDetailModal(false)}
          ></div>
          
          <div
            className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 shadow-2xl relative z-10 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex flex-row items-center justify-between sticky top-0 bg-white z-20 rounded-t-2xl">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-xl font-bold text-white shadow-sm">
                  {selectedVoter.name?.charAt(0)?.toUpperCase() || "V"}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">{selectedVoter.name || "Unknown Constituent"}</h2>
                  <p className="text-sm text-slate-500 font-medium flex items-center gap-1.5 mt-0.5">
                    <Building2 size={12} /> {selectedVoter.assemblyName || selectedVoter.sheetName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 flex-1">
              
              {/* Info Cards */}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Contact Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                    <p className="text-xs text-slate-400 font-medium mb-1.5 flex items-center gap-1.5"><Mail size={12}/> Email</p>
                    <p className="text-sm font-medium text-slate-800 break-words">
                      {selectedVoter.email || "—"}
                    </p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                    <p className="text-xs text-slate-400 font-medium mb-1.5 flex items-center gap-1.5"><Phone size={12}/> Primary Mobile</p>
                    <p className="text-sm font-medium text-slate-800 font-mono">
                      {selectedVoter.mobile || "—"}
                    </p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                    <p className="text-xs text-slate-400 font-medium mb-1.5 flex items-center gap-1.5"><Phone size={12}/> Secondary Mobile</p>
                    <p className="text-sm font-medium text-slate-800 font-mono">
                      {selectedVoter.optionalMobile || "—"}
                    </p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                    <p className="text-xs text-slate-400 font-medium mb-1.5 flex items-center gap-1.5"><Users size={12}/> Political Affiliation</p>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-sm font-medium">
                      {selectedVoter.partyName || "Independent"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Quick Actions</h3>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => hasMobile(selectedVoter.mobile) && openWhatsApp(selectedVoter.mobile)}
                    disabled={!hasMobile(selectedVoter.mobile)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors border ${hasMobile(selectedVoter.mobile) ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-100' : 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed'}`}
                  >
                    <WhatsAppIcon size={15} /> WhatsApp
                  </button>
                  <button
                    onClick={() => hasEmail(selectedVoter.email) && openMail(selectedVoter.email)}
                    disabled={!hasEmail(selectedVoter.email)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors border ${hasEmail(selectedVoter.email) ? 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-100' : 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed'}`}
                  >
                    <Mail size={15} /> Email
                  </button>
                  <a
                    href={hasMobile(selectedVoter.mobile) ? `tel:${selectedVoter.mobile}` : undefined}
                    onClick={(e) => !hasMobile(selectedVoter.mobile) && e.preventDefault()}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors border ${hasMobile(selectedVoter.mobile) ? 'bg-violet-50 hover:bg-violet-100 text-violet-700 border-violet-100' : 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed'}`}
                  >
                    <Phone size={15} /> Call
                  </a>
                </div>
              </div>

              {/* Status Update */}
              <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-slate-800">Verification Status</h3>
                  {getStatusBadge(selectedVoter.status)}
                </div>
                
                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <button
                    disabled={updatingStatus}
                    onClick={() => handleStatusUpdate(selectedVoter, "accepted")}
                    className={`flex-1 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all border ${
                      selectedVoter.status?.toLowerCase() === "accepted"
                        ? "bg-emerald-600 border-emerald-600 text-white shadow-sm"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700"
                    }`}
                  >
                    <CheckCircle size={15} /> Accept
                  </button>
                  <button
                    disabled={updatingStatus}
                    onClick={() => handleStatusUpdate(selectedVoter, "rejected")}
                    className={`flex-1 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all border ${
                      selectedVoter.status?.toLowerCase() === "rejected"
                        ? "bg-rose-600 border-rose-600 text-white shadow-sm"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-700"
                    }`}
                  >
                    <XCircle size={15} /> Reject
                  </button>
                  <button
                    disabled={updatingStatus}
                    onClick={() => handleStatusUpdate(selectedVoter, "pending")}
                    className={`flex-1 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all border ${
                      selectedVoter.status?.toLowerCase() === "pending" || !selectedVoter.status
                        ? "bg-amber-500 border-amber-500 text-white shadow-sm"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-amber-50 hover:border-amber-200 hover:text-amber-700"
                    }`}
                  >
                    <Clock size={15} /> Pending
                  </button>
                </div>
                
                {updatingStatus && (
                  <div className="flex items-center justify-center gap-2 mt-3 text-sm font-medium text-indigo-600">
                    <Loader2 size={14} className="animate-spin" /> Updating...
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
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center">
            <Loader2 className="animate-spin text-indigo-600" size={24} />
          </div>
          <p className="text-slate-400 text-sm font-medium">Loading voters...</p>
        </div>
      </div>
    }>
      <VotersContent />
    </Suspense>
  );
}
