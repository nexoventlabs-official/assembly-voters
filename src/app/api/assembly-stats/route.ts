import { NextRequest, NextResponse } from "next/server";
import { getAssemblyStats } from "@/lib/google-sheets";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const assembly = searchParams.get("assembly");

    if (!assembly) {
      return NextResponse.json(
        { error: "Assembly name is required" },
        { status: 400 }
      );
    }

    const stats = await getAssemblyStats(assembly);
    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching assembly stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch assembly stats" },
      { status: 500 }
    );
  }
}
