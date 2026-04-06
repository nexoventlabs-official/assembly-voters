import { NextRequest, NextResponse } from "next/server";
import {
  getVotersFromSheet,
  addVoter,
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

    if (isDuplicate) {
      return NextResponse.json(
        { error: "duplicate", message: "A candidate with the same name and party already exists in this assembly." },
        { status: 409 }
      );
    }

    // Sanitize: strip non-digit chars from phone (including trailing dots), lowercase + trim email
    const cleanPhone = (val: string) => val ? val.replace(/[^0-9]/g, "") : "";
    const cleanEmail = (val: string) => val ? val.trim().toLowerCase().replace(/[.\s]+$/, "") : "";

    const sanitizedMobile = cleanPhone(mobile) || "N/A";
    const sanitizedOptionalMobile = cleanPhone(optionalMobile);
    const sanitizedEmail = cleanEmail(email) || "N/A";

    await addVoter(sheetName, {
      name,
      email: sanitizedEmail,
      mobile: sanitizedMobile,
      optionalMobile: sanitizedOptionalMobile,
      partyName: partyName || "",
      assemblyName: assemblyName || sheetName,
      status: "pending",
      isDuplicate: false,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error adding voter:", error);
    return NextResponse.json(
      { error: "Failed to add voter" },
      { status: 500 }
    );
  }
}
