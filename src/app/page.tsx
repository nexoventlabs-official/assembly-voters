"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Building2,
  Search,
  Loader2,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  X,
  TrendingUp,
  BarChart3,
  ArrowRight
} from "lucide-react";

interface AssemblyStat {
  name: string;
  total: number;
  accepted: number;
  rejected: number;
  pending: number;
}

interface DashboardData {
  totalAssemblies: number;
  totalVoters: number;
  totalAccepted: number;
  totalRejected: number;
  totalPending: number;
  assemblyStats: AssemblyStat[];
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetch("/api/dashboard")
      .then((res) => res.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="relative">
          <div className="absolute inset-0 bg-primary/30 blur-2xl rounded-full"></div>
          <div className="glass-panel p-6 rounded-3xl flex flex-col items-center gap-4 relative z-10 border border-white/10">
            <Loader2 className="animate-spin text-primary" size={48} strokeWidth={1.5} />
            <span className="text-muted text-sm font-medium tracking-wide pb-1">Initializing Dashboard...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="glass-panel p-8 rounded-3xl border border-red-500/20 text-center space-y-4">
          <XCircle className="text-red-400 mx-auto" size={48} strokeWidth={1.5} />
          <p className="text-muted tracking-wide">Failed to load dashboard data.</p>
        </div>
      </div>
    );
  }

  const filteredAssemblies = data.assemblyStats.filter((a) =>
    a.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const statCards = [
    {
      label: "Total Voters",
      value: data.totalVoters,
      icon: Users,
      color: "from-blue-500/20 to-indigo-500/5",
      iconColor: "text-blue-400",
      iconBg: "bg-blue-500/10",
      border: "border-blue-500/20",
      trend: "+12%"
    },
    {
      label: "Accepted",
      value: data.totalAccepted,
      icon: CheckCircle,
      color: "from-emerald-500/20 to-teal-500/5",
      iconColor: "text-emerald-400",
      iconBg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
      trend: "+5%"
    },
    {
      label: "Rejected",
      value: data.totalRejected,
      icon: XCircle,
      color: "from-rose-500/20 to-red-500/5",
      iconColor: "text-rose-400",
      iconBg: "bg-rose-500/10",
      border: "border-rose-500/20",
      trend: "-2%"
    },
    {
      label: "Pending",
      value: data.totalPending,
      icon: Clock,
      color: "from-amber-500/20 to-orange-500/5",
      iconColor: "text-amber-400",
      iconBg: "bg-amber-500/10",
      border: "border-amber-500/20",
      trend: "Action Req."
    },
    {
      label: "Assemblies",
      value: data.totalAssemblies,
      icon: Building2,
      color: "from-purple-500/20 to-fuchsia-500/5",
      iconColor: "text-purple-400",
      iconBg: "bg-purple-500/10",
      border: "border-purple-500/20",
      trend: "Active"
    },
  ];

  return (
    <div className="p-6 md:p-8 xl:p-12 max-w-[1600px] mx-auto min-h-screen">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-panel border border-primary/30 mb-4 z-10 relative">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
            <span className="text-xs font-semibold text-primary-light uppercase tracking-wider">Live System Status</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-2 drop-shadow-sm glow-text">
            Dashboard Overview
          </h1>
          <p className="text-muted text-lg font-light tracking-wide max-w-2xl">
            Real-time insights and monitoring across all assembly voter data points.
          </p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-6 mb-10">
        {statCards.map((stat, idx) => (
          <div
            key={stat.label}
            className={`glass-panel rounded-3xl border ${stat.border} p-6 relative overflow-hidden group hover:border-white/20 transition-all duration-300 hover:shadow-2xl hover:shadow-${stat.iconColor.split('-')[1]}-500/10 hover:-translate-y-1`}
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-40 group-hover:opacity-70 transition-opacity`}></div>
            
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div className="flex items-start justify-between mb-4">
                <div className={`${stat.iconBg} ${stat.iconColor} p-3 rounded-2xl ring-1 ring-white/10 shadow-inner backdrop-blur-md`}>
                  <stat.icon size={22} strokeWidth={2} />
                </div>
                <div className="glass-panel px-2.5 py-1 rounded-full border border-white/5 flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity text-xs font-medium text-white/70">
                  {idx < 3 ? <TrendingUp size={12} className={stat.iconColor} /> : null}
                  {stat.trend}
                </div>
              </div>
              
              <div>
                <h3 className="text-4xl font-bold text-white mb-1 tracking-tight drop-shadow-md">
                  {stat.value.toLocaleString()}
                </h3>
                <p className="text-sm text-muted font-medium uppercase tracking-wider">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
