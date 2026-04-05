import { NextResponse } from "next/server";
import { getSheetNames } from "@/lib/google-sheets";

export async function GET() {
  try {
    const sheetNames = await getSheetNames();
    return NextResponse.json({ sheets: sheetNames });
  } catch (error) {
    console.error("Error fetching sheet names:", error);
    return NextResponse.json(
      { error: "Failed to fetch sheet names" },
      { status: 500 }
    );
  }
}
