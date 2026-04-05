"use client";

import { MapContainer, GeoJSON, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import tnDistricts from "@/lib/tn_districts.json";
import { useEffect, useRef } from "react";
import L from "leaflet";
import type { FeatureCollection, Geometry } from "geojson";

// Helper component to center and bounds
function MapController({ featureSelected }: { featureSelected: unknown }) {
  const map = useMap();
  
  useEffect(() => {
    // If we want to bound to the highlighted feature, we could do it here
    // But keeping it static might be better visually for a sidebar map
  }, [featureSelected, map]);

  return null;
}

interface SidebarMapLeafletProps {
  highlightedDistrict?: string;
}

export default function SidebarMapLeaflet({ highlightedDistrict }: SidebarMapLeafletProps) {
  // Center of TN roughly
  const center: [number, number] = [10.8505, 78.6569];

  // Map modern districts (post-2011) back to their parent districts in the GeoJSON
  // and handle major spelling variations
  const districtAliases: Record<string, string> = {
    "TIRUPATHUR": "VELLORE",
    "RANIPET": "VELLORE",
    "CHENGALPATTU": "KANCHEEPURAM",
    "KALLAKURICHI": "VILLUPURAM",
    "KALLAKURUCHI": "VILLUPURAM",
    "VILUPURAM": "VILLUPURAM",
    "TENKASI": "TIRUNELVELI KATTABO",
    "TIRUNELVELI": "TIRUNELVELI KATTABO",
    "KRISHNAGIRI": "DHARMAPURI",
    "MAYILADUTHURAI": "NAGAPATTINAM",
    "TIRUPPUR": "COIMBATORE", // or ERODE
    "TIRUVANNAMALAI": "TIRUVANNAMALAI",
    "TIRUCHIRAPALLI": "TIRUCHCHIRAPPALLI",
    "TIRUCHIRAPPALLI": "TIRUCHCHIRAPPALLI",
    "PUDUKOTTAI": "PUDUKKOTTAI"
  };

  // Helper to normalize strings for comparison
  const normalizeString = (str?: string) => {
    return (str || "").trim().toUpperCase().replace(/[^A-Z]/g, '');
  };

  const getTargetName = (dist?: string) => {
    if (!dist) return "";
    const original = dist.trim().toUpperCase();
    return districtAliases[original] || original;
  };

  const targetDist = getTargetName(highlightedDistrict);
  const highNorm = normalizeString(targetDist);

  const styleFeature = (feature: any) => {
    const rawName = feature.properties.NAME_2;
    const featureName = normalizeString(rawName);
    
    // Exact or inclusion match
    const isMatched = highNorm && (featureName.includes(highNorm) || highNorm.includes(featureName));
    
    return {
      fillColor: isMatched ? "#10b981" : "#18181b", // Emerald for highlight, Zinc-900 otherwise
      weight: 1,
      opacity: 1,
      color: "#3f3f46", // Zinc-700 for borders
      fillOpacity: isMatched ? 0.9 : 0.4,
    };
  };

  const onEachFeature = (feature: any, layer: L.Layer) => {
    // Show correct name in tooltip
    const name = feature.properties.NAME_2;
    layer.bindTooltip(name, {
      className: "glass-popup !bg-[#09090b]/80 !text-white !border-white/10 !text-xs !shadow-xl",
      sticky: true
    });
  };

  return (
    <MapContainer 
      bounds={[[8.08, 76.24], [13.52, 80.35]]}
      className="w-full h-full bg-transparent z-0"
      zoomControl={false}
      dragging={false}
      scrollWheelZoom={false}
      doubleClickZoom={false}
      touchZoom={false}
      attributionControl={false}
    >
      <GeoJSON 
        data={tnDistricts as FeatureCollection<Geometry, any>} 
        style={styleFeature}
        onEachFeature={onEachFeature}
      />
      <MapController featureSelected={highlightedDistrict} />
    </MapContainer>
  );
}
