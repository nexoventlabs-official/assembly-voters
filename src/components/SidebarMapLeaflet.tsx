"use client";

import { MapContainer, GeoJSON, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import tnDistricts from "@/lib/tn_districts.json";
import { useEffect } from "react";
import L from "leaflet";
import type { FeatureCollection, Geometry } from "geojson";

// Force zoom the map so TN fills the sidebar container
function FitBounds() {
  const map = useMap();
  
  useEffect(() => {
    // Invalidate size first so Leaflet recalculates container dimensions
    map.invalidateSize();

    const tnBounds = L.latLngBounds(
      [8.07, 76.23],
      [13.56, 80.35]
    );
    map.fitBounds(tnBounds, { padding: [0, 0], maxZoom: 10 });

    // After initial fit, force zoom up by 2 levels so TN fills the box
    setTimeout(() => {
      map.invalidateSize();
      map.fitBounds(tnBounds, { padding: [0, 0], maxZoom: 10 });
      const z = map.getZoom();
      map.setZoom(z + 2, { animate: false });
    }, 200);
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
      center={[10.8, 78.7]}
      zoom={7}
      minZoom={6}
      maxZoom={12}
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
