"use client";

import { MapContainer, GeoJSON, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import tnDistricts from "@/lib/tn_districts.json";
import { useEffect } from "react";
import L from "leaflet";
import type { FeatureCollection, Geometry } from "geojson";

// Fit the map so TN is centered and properly sized
function FitBounds() {
  const map = useMap();
  
  useEffect(() => {
    // Wait for container to be properly sized
    setTimeout(() => {
      map.invalidateSize();
      // Set a fixed view: center of TN at zoom 7 — consistent across all screen sizes
      map.setView([10.9, 78.4], 6, { animate: false });
    }, 150);
  }, [map]);

  return null;
}

interface SidebarMapLeafletProps {
  highlightedDistrict?: string;
}

export default function SidebarMapLeaflet({ highlightedDistrict }: SidebarMapLeafletProps) {

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
      fillColor: isMatched ? "#6366f1" : "#94a3b8",
      weight: 1,
      opacity: 1,
      color: "#e2e8f0",
      fillOpacity: isMatched ? 0.85 : 0.45,
    };
  };

  const onEachFeature = (feature: any, layer: L.Layer) => {
    // Show correct name in tooltip
    const name = feature.properties.NAME_2;
    layer.bindTooltip(name, {
      className: "!bg-white !text-slate-800 !border-slate-200 !text-xs !shadow-lg !rounded-lg !px-2 !py-1 !font-semibold",
      sticky: true
    });
  };

  return (
    <MapContainer 
      center={[10.9, 78.4]}
      zoom={6}
      minZoom={6}
      maxZoom={6}
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
      <FitBounds />
    </MapContainer>
  );
}
