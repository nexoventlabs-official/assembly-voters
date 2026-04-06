import { NextRequest, NextResponse } from "next/server";
import {
  getVotersFromSheet,
  addVoter,
  updateVoterStatus,
} from "@/lib/google-sheets";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const assembly = searchParams.get("assembly");
    const status = searchParams.get("status");

    if (!assembly) {
      return NextResponse.json(
        { error: "Assembly parameter is required" },
        { status: 400 }
      );
    }

    let voters = await getVotersFromSheet(assembly);

    if (status && status !== "total") {
      voters = voters.filter((v) => {
        const voterStatus = v.status.toLowerCase() || "pending";
        return voterStatus === status.toLowerCase();
      });
    }

    return NextResponse.json({ voters });
  } catch (error) {
    console.error("Error fetching voters:", error);
    return NextResponse.json(
      { error: "Failed to fetch voters" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sheetName, name, email, mobile, optionalMobile, partyName, assemblyName } =
      body;

    if (!sheetName || !name) {
      return NextResponse.json(
        { error: "Sheet name and candidate name are required" },
        { status: 400 }
      );
    }

    // Check existing candidates for name + party match before adding
    const existingVoters = await getVotersFromSheet(sheetName);
    const normalize = (s: string) => (s || "").trim().toLowerCase();
    const isDuplicate = existingVoters.some(
      (v) => normalize(v.name) === normalize(name) && normalize(v.partyName) === normalize(partyName || "")
    );

    await addVoter(sheetName, {
      name,
      email: email || "N/A",
      mobile: mobile || "N/A",
      optionalMobile: optionalMobile || "",
      partyName: partyName || "",
      assemblyName: assemblyName || sheetName,
      status: "pending",
      isDuplicate: false,
    });

    // If duplicate detected, mark the newly added row
    if (isDuplicate) {
      const updatedVoters = await getVotersFromSheet(sheetName);
      const newRow = updatedVoters[updatedVoters.length - 1]?.row;
      if (newRow) {
        await updateVoterStatus(sheetName, newRow, "duplicate");
      }
    }

    return NextResponse.json({ success: true, isDuplicate });
  } catch (error) {
    console.error("Error adding voter:", error);
    return NextResponse.json(
      { error: "Failed to add voter" },
      { status: 500 }
    );
  }
}
