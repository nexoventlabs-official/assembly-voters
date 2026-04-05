"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

// Dynamically import the Leaflet map so it only loads on the client side
const MapLeaflet = dynamic(() => import("./MapLeaflet"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900/50 rounded-3xl border border-white/5">
      <div className="relative">
        <div className="absolute inset-0 bg-primary/30 blur-2xl rounded-full"></div>
        <div className="glass-panel p-6 rounded-3xl flex flex-col items-center gap-4 relative z-10 border border-white/10">
          <Loader2 className="animate-spin text-primary" size={40} strokeWidth={1.5} />
          <span className="text-muted text-sm font-medium tracking-wide">Loading Geospatial Data...</span>
        </div>
      </div>
    </div>
  ),
});

export default MapLeaflet;
