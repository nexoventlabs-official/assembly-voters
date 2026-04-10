"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Users,
  Search,
  ChevronDown,
  X,
  Check,
  Loader2,
  Download,
  Building2,
  Flag,
} from "lucide-react";
import * as XLSX from "xlsx";

interface Voter {
  row: number;
  name: string;
  email: string;
  mobile: string;
  optionalMobile: string;
  partyName: string;
  assemblyName: string;
  status: string;
  isDuplicate: boolean;
  sheetName: string;
}

export default function CandidatesPage() {
  const [voters, setVoters] = useState<Voter[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedParty, setSelectedParty] = useState("all");
  const [selectedAssembly, setSelectedAssembly] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    fetch("/api/voters/all")
      .then((res) => res.json())
      .then((data) => {
        setVoters(data.voters || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Extract unique parties and assemblies
  const parties = useMemo(() => {
    const set = new Set<string>();
    voters.forEach((v) => {
      const p = (v.partyName || "").trim();
      if (p && p.toUpperCase() !== "N/A") set.add(p);
    });
    return [...set].sort();
  }, [voters]);

  const assemblies = useMemo(() => {
    const set = new Set<string>();
    voters.forEach((v) => {
      const a = (v.assemblyName || v.sheetName || "").trim();
      if (a) set.add(a);
    });
    return [...set].sort();
  }, [voters]);

  // Filtered voters
  const filteredVoters = useMemo(() => {
    return voters.filter((v) => {
      // Party filter
      if (selectedParty !== "all") {
        const vParty = (v.partyName || "").trim().toLowerCase();
        if (vParty !== selectedParty.toLowerCase()) return false;
      }
      // Assembly filter
      if (selectedAssembly !== "all") {
        const vAssembly = (v.assemblyName || v.sheetName || "").trim().toLowerCase();
        if (vAssembly !== selectedAssembly.toLowerCase()) return false;
      }
      // Search
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          v.name.toLowerCase().includes(q) ||
          v.email.toLowerCase().includes(q) ||
          v.mobile.includes(q) ||
          v.partyName.toLowerCase().includes(q) ||
          (v.assemblyName || v.sheetName || "").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [voters, selectedParty, selectedAssembly, searchQuery]);

  // Stats for current filter
  const totalFiltered = filteredVoters.length;
  const acceptedFiltered = filteredVoters.filter((v) => v.status?.toLowerCase() === "accepted").length;

  // Download filtered as Excel
  const handleDownload = () => {
    if (filteredVoters.length === 0) return;
    setDownloading(true);

    try {
      const wb = XLSX.utils.book_new();

      // Group by assembly
      const assemblyMap = new Map<string, Voter[]>();
      for (const v of filteredVoters) {
        const key = v.assemblyName || v.sheetName || "Unknown";
        const list = assemblyMap.get(key) || [];
        list.push(v);
        assemblyMap.set(key, list);
      }

      // All filtered sheet
      const allData = filteredVoters.map((v, i) => ({
        "S.No": i + 1,
        "Assembly": v.assemblyName || v.sheetName,
        "Name": v.name,
        "Email": v.email,
        "Mobile": v.mobile,
        "Secondary Mobile": v.optionalMobile || "",
        "Party": v.partyName || "",
        "Status": v.status || "pending",
      }));
      const allSheet = XLSX.utils.json_to_sheet(allData);
      allSheet["!cols"] = [
        { wch: 6 }, { wch: 25 }, { wch: 25 }, { wch: 28 },
        { wch: 16 }, { wch: 16 }, { wch: 20 }, { wch: 12 },
      ];
      XLSX.utils.book_append_sheet(wb, allSheet, "All Filtered");

      // Per-assembly sheets
      const sortedKeys = [...assemblyMap.keys()].sort();
      for (const key of sortedKeys) {
        const list = assemblyMap.get(key)!;
        const data = list.map((v, i) => ({
          "S.No": i + 1,
          "Name": v.name,
          "Email": v.email,
          "Mobile": v.mobile,
          "Secondary Mobile": v.optionalMobile || "",
          "Party": v.partyName || "",
          "Status": v.status || "pending",
        }));
        const ws = XLSX.utils.json_to_sheet(data);
        ws["!cols"] = [
          { wch: 6 }, { wch: 25 }, { wch: 28 },
          { wch: 16 }, { wch: 16 }, { wch: 20 }, { wch: 12 },
        ];
        const safeName = key.length > 31 ? key.substring(0, 31) : key;
        XLSX.utils.book_append_sheet(wb, ws, safeName);
      }

      const buf = XLSX.write(wb, { type: "array", bookType: "xlsx" });
      const blob = new Blob([buf], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;

      const partyLabel = selectedParty === "all" ? "All_Parties" : selectedParty.replace(/\s+/g, "_");
      const assemblyLabel = selectedAssembly === "all" ? "All_Assemblies" : selectedAssembly.replace(/\s+/g, "_");
      const today = new Date().toISOString().split("T")[0];
      a.download = `Candidates_${partyLabel}_${assemblyLabel}_${today}.xlsx`;

      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      alert("Failed to generate download file.");
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center">
            <Loader2 className="animate-spin text-indigo-600" size={24} />
          </div>
          <p className="text-slate-400 text-sm font-medium">Loading all candidates...</p>
          <p className="text-slate-300 text-xs">This may take a few seconds</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 xl:p-10 max-w-[1440px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Party-wise Candidates
          </h1>
          <p className="text-slate-500 mt-1">
            Filter and view candidates by party and assembly.
          </p>
        </div>
        <button
          onClick={handleDownload}
          disabled={downloading || filteredVoters.length === 0}
          className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-colors shadow-sm"
        >
          {downloading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Download size={16} />
              Download Filtered ({filteredVoters.length})
            </>
          )}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Loaded</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{voters.length.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Filtered</p>
          <p className="text-2xl font-bold text-indigo-600 mt-1">{totalFiltered.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Accepted</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{acceptedFiltered.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Parties</p>
          <p className="text-2xl font-bold text-violet-600 mt-1">{parties.length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        {/* Party Filter */}
        <div className="relative">
          <Flag size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <select
            value={selectedParty}
            onChange={(e) => setSelectedParty(e.target.value)}
            className="input-field appearance-none pl-10 pr-10 py-2.5 text-sm cursor-pointer min-w-[220px]"
          >
            <option value="all">All Parties ({parties.length})</option>
            {parties.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <ChevronDown size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>

        {/* Assembly Filter */}
        <div className="relative">
          <Building2 size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <select
            value={selectedAssembly}
            onChange={(e) => setSelectedAssembly(e.target.value)}
            className="input-field appearance-none pl-10 pr-10 py-2.5 text-sm cursor-pointer min-w-[220px]"
          >
            <option value="all">All Assemblies ({assemblies.length})</option>
            {assemblies.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
          <ChevronDown size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>

        {/* Search */}
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
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
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Clear filters */}
        {(selectedParty !== "all" || selectedAssembly !== "all" || searchQuery) && (
          <button
            onClick={() => {
              setSelectedParty("all");
              setSelectedAssembly("all");
              setSearchQuery("");
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
          >
            <X size={14} /> Clear
          </button>
        )}
      </div>

      {/* Active Filters Chips */}
      {(selectedParty !== "all" || selectedAssembly !== "all") && (
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-xs text-slate-400 font-medium">Active filters:</span>
          {selectedParty !== "all" && (
            <span className="inline-flex items-center gap-1.5 bg-violet-50 text-violet-700 border border-violet-200 rounded-full px-3 py-1 text-xs font-medium">
              <Flag size={11} /> {selectedParty}
              <button onClick={() => setSelectedParty("all")} className="ml-0.5 hover:text-violet-900">
                <X size={12} />
              </button>
            </span>
          )}
          {selectedAssembly !== "all" && (
            <span className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full px-3 py-1 text-xs font-medium">
              <Building2 size={11} /> {selectedAssembly}
              <button onClick={() => setSelectedAssembly("all")} className="ml-0.5 hover:text-indigo-900">
                <X size={12} />
              </button>
            </span>
          )}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50/80">
                <th className="py-3 px-6 font-semibold text-slate-500 text-xs uppercase tracking-wider text-left">#</th>
                <th className="py-3 px-6 font-semibold text-slate-500 text-xs uppercase tracking-wider text-left">Name</th>
                <th className="py-3 px-6 font-semibold text-slate-500 text-xs uppercase tracking-wider text-left hidden md:table-cell">Contact</th>
                <th className="py-3 px-6 font-semibold text-slate-500 text-xs uppercase tracking-wider text-left">Party</th>
                <th className="py-3 px-6 font-semibold text-slate-500 text-xs uppercase tracking-wider text-left hidden lg:table-cell">Assembly</th>
                <th className="py-3 px-6 font-semibold text-slate-500 text-xs uppercase tracking-wider text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredVoters.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center">
                    <div className="flex flex-col items-center text-slate-400">
                      <Users size={40} className="mb-3 text-slate-300" />
                      <p className="text-base font-medium text-slate-500">No candidates found</p>
                      <p className="text-sm mt-1">Try adjusting your filters</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredVoters.map((voter, idx) => (
                  <tr
                    key={`${voter.sheetName}-${voter.row}`}
                    className="hover:bg-slate-50/60 transition-colors"
                  >
                    <td className="py-3.5 px-6 text-slate-400 text-xs font-mono">{idx + 1}</td>
                    <td className="py-3.5 px-6">
                      <div>
                        <p className="font-medium text-slate-800">{voter.name}</p>
                        <p className="text-xs text-slate-400 md:hidden mt-0.5">{voter.mobile || "—"}</p>
                      </div>
                    </td>
                    <td className="py-3.5 px-6 hidden md:table-cell">
                      <div>
                        <p className="text-slate-600 font-mono text-xs">{voter.mobile || "—"}</p>
                        {voter.email && voter.email.toUpperCase() !== "N/A" && (
                          <p className="text-slate-400 text-xs mt-0.5">{voter.email}</p>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-6">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-violet-50 text-violet-700 text-xs font-medium border border-violet-100">
                        {voter.partyName || "Independent"}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 hidden lg:table-cell text-slate-500 text-xs">
                      {voter.assemblyName || voter.sheetName}
                    </td>
                    <td className="py-3.5 px-6 text-center">
                      {voter.status?.toLowerCase() === "accepted" ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 text-xs font-semibold">
                          <Check size={14} strokeWidth={3} /> Accepted
                        </span>
                      ) : voter.isDuplicate ? (
                        <span className="inline-flex items-center gap-1 text-orange-500 text-xs font-semibold">
                          Duplicate
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-amber-600 text-xs font-semibold">
                          Pending
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
          <p>
            Showing <span className="text-slate-700 font-medium">{filteredVoters.length.toLocaleString()}</span> of <span className="text-slate-700 font-medium">{voters.length.toLocaleString()}</span> candidates
          </p>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Loaded
          </div>
        </div>
      </div>
    </div>
  );
}
