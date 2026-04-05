"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

const MapComponent = dynamic(() => import("./SidebarMapLeaflet"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 rounded-2xl border border-slate-100">
      <Loader2 className="animate-spin text-indigo-500 opacity-60" size={24} />
    </div>
  ),
});

export default function SidebarMap({ highlightedDistrict }: { highlightedDistrict?: string }) {
  return (
    <div className="w-full h-72 rounded-2xl overflow-hidden mt-4 relative border border-slate-200 group bg-white">
      
      {/* Title overlay */}
      <div className="absolute top-2.5 left-3 z-10 pointer-events-none">
        <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-slate-600 transition-colors">
          TN District Map
        </h4>
        {highlightedDistrict && (
          <p className="text-xs font-semibold text-indigo-600 mt-0.5 max-w-[150px] truncate">
            {highlightedDistrict}
          </p>
        )}
      </div>

      <div className="w-full h-full relative z-0">
        <MapComponent highlightedDistrict={highlightedDistrict} />
      </div>
    </div>
  );
}
