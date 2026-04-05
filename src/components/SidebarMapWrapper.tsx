"use client";

import { useSearchParams } from "next/navigation";
import SidebarMap from "./SidebarMap";
import assemblyData from "@/lib/assemblyToDistrict.json";

export default function SidebarMapWrapper() {
  const searchParams = useSearchParams();
  const assemblyFromUrl = searchParams ? searchParams.get("assembly") : null;
  
  // Helper to strip all non-alphanumeric characters for robust comparison
  const normalize = (str?: string) => (str || "").trim().toLowerCase().replace(/[^a-z0-9]/g, '');

  let highlightedDistrict: string | undefined = undefined;
  if (assemblyFromUrl) {
    const searchVal = normalize(assemblyFromUrl);
    const data = assemblyData as Record<string, string>;
    const matchedKey = Object.keys(data).find(k => normalize(k) === searchVal);
    if (matchedKey) {
      highlightedDistrict = data[matchedKey];
    }
  }

  return <SidebarMap highlightedDistrict={highlightedDistrict} />;
}
