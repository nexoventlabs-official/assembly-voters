"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

const MapComponent = dynamic(() => import("./SidebarMapLeaflet"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center bg-white/5 rounded-2xl border border-white/5">
      <Loader2 className="animate-spin text-primary opacity-50" size={24} />
    </div>
  ),
});

export default function SidebarMap({ highlightedDistrict }: { highlightedDistrict?: string }) {
  return (
    <div className="w-full h-64 rounded-2xl overflow-hidden mt-6 relative border border-white/10 shadow-inner group bg-zinc-900/40">
      
      {/* Title overlay */}
      <div className="absolute top-2 left-3 z-10 pointer-events-none">
        <h4 className="text-[10px] font-bold uppercase tracking-wider text-white/50 group-hover:text-white/80 transition-colors">
          TN District Map
        </h4>
        {highlightedDistrict && (
          <p className="text-xs font-semibold text-emerald-400 mt-0.5 max-w-[150px] truncate drop-shadow-md">
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
