import { NextResponse } from "next/server";
import { getAllVoters } from "@/lib/google-sheets";

export async function GET() {
  try {
    const voters = await getAllVoters();
    return NextResponse.json({ voters });
  } catch (error) {
    console.error("Error fetching all voters:", error);
    return NextResponse.json(
      { error: "Failed to fetch voters" },
      { status: 500 }
    );
  }
}
