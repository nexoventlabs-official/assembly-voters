"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Building2 } from "lucide-react";

// Fix leaflet default icon issue in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// A custom glowing icon for our dark theme
const createCustomIcon = (accepted: number, total: number) => {
  const percentage = total === 0 ? 0 : accepted / total;
  let color = "bg-amber-500";
  let border = "border-amber-400";
  let shadow = "shadow-[0_0_10px_rgba(245,158,11,0.5)]";
  
  if (percentage > 0.7) {
    color = "bg-emerald-500";
    border = "border-emerald-400";
    shadow = "shadow-[0_0_10px_rgba(16,185,129,0.5)]";
  } else if (percentage < 0.3) {
    color = "bg-rose-500";
    border = "border-rose-400";
    shadow = "shadow-[0_0_10px_rgba(244,63,94,0.5)]";
  }

  const html = `
    <div class="w-4 h-4 rounded-full ${color} border-2 ${border} ${shadow} relative">
       <div class="absolute inset-0 bg-white/20 rounded-full animate-ping opacity-50"></div>
    </div>
  `;
  
  return L.divIcon({
    html,
    className: 'custom-leaflet-icon',
    iconSize: [16, 16],
    iconAnchor: [8, 8]
  });
};

interface AssemblyStat {
  name: string;
  total: number;
  accepted: number;
  rejected: number;
  pending: number;
}

// Generate deterministic coordinates within TN based on string hash
const getCoordsForAssembly = (name: string): [number, number] => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // TN Bounding Box roughly: Lat 8.1 to 13.5, Lng 76.5 to 80.2
  const seed1 = Math.abs(Math.sin(hash)) * 10000;
  const seed2 = Math.abs(Math.cos(hash)) * 10000;
  
  const lat = 8.1 + ((seed1 % 1000) / 1000) * (13.5 - 8.1);
  const lng = 76.5 + ((seed2 % 1000) / 1000) * (80.2 - 76.5);
  
  // slightly shape it to look like Tamil nadu (very roughly cut out the ocean)
  // this is a very rough mock approximation
  const adjustedLat = Math.min(lat, 13.5 - (lng - 79) * 1.5);
  return [adjustedLat > 8.1 ? adjustedLat : 8.1 + Math.random(), lng];
}

export default function MapLeaflet({ stats }: { stats: AssemblyStat[] }) {
  // TN Center
  const center: [number, number] = [10.8505, 78.6569];

  return (
    <MapContainer 
      center={center} 
      zoom={7} 
      className="w-full h-full rounded-3xl z-0"
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />
      {stats.map((stat, i) => {
        const coords = getCoordsForAssembly(stat.name);
        return (
          <Marker 
            key={i} 
            position={coords}
            icon={createCustomIcon(stat.accepted, stat.total)}
          >
            <Popup className="glass-popup">
              <div className="bg-zinc-950/90 backdrop-blur-xl border border-white/10 p-4 rounded-xl shadow-2xl min-w-[220px] text-white font-sans m-[-14px]">
                <div className="flex items-center gap-3 mb-3 pb-3 border-b border-white/10">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/30 to-accent/30 border border-white/10 flex items-center justify-center text-primary-light">
                    <Building2 size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-base tracking-tight m-0 leading-none text-white">{stat.name}</h4>
                    <span className="text-[10px] text-muted uppercase tracking-wider font-semibold">Assembly Constituency</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 mt-3">
                  <div className="bg-white/5 rounded-lg p-2.5 border border-white/5">
                    <p className="text-[10px] text-muted mb-1 font-semibold uppercase">Total Voters</p>
                    <p className="text-sm font-bold text-blue-400">{stat.total}</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-2.5 border border-white/5">
                    <p className="text-[10px] text-emerald-500/80 mb-1 font-semibold uppercase">Accepted</p>
                    <p className="text-sm font-bold text-emerald-400">{stat.accepted}</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-2.5 border border-white/5">
                    <p className="text-[10px] text-rose-500/80 mb-1 font-semibold uppercase">Rejected</p>
                    <p className="text-sm font-bold text-rose-400">{stat.rejected}</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-2.5 border border-white/5">
                    <p className="text-[10px] text-amber-500/80 mb-1 font-semibold uppercase">Pending</p>
                    <p className="text-sm font-bold text-amber-400">{stat.pending}</p>
                  </div>
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
