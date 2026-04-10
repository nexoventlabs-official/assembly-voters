import { NextRequest, NextResponse } from "next/server";
import { updateVoterStatus, updateVoter } from "@/lib/google-sheets";
import { connectDB, VoterModel } from "@/lib/mongodb";

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { sheetName, row, status, name, email, mobile, optionalMobile, partyName, assemblyName } = body;

    if (!sheetName || !row) {
      return NextResponse.json(
        { error: "Sheet name and row are required" },
        { status: 400 }
      );
    }

    await connectDB();

    // If only status is provided, update just the status
    if (status && !name) {
      await updateVoterStatus(sheetName, row, status);

      // Sync to MongoDB
      const mongoUpdate: Record<string, unknown> = {};
      if (status.toLowerCase() === "duplicate") {
        mongoUpdate.isDuplicate = true;
      } else {
        mongoUpdate.status = status;
      }
      await VoterModel.updateOne({ sheetName, row }, { $set: mongoUpdate });
    } else {
      // Full update - Google Sheets
      await updateVoter(sheetName, row, {
        name,
        email: email || "",
        mobile,
        optionalMobile: optionalMobile || "",
        partyName: partyName || "",
        assemblyName: assemblyName || sheetName,
        status: status || "pending",
        isDuplicate: false,
      });

      // Sync full update to MongoDB
      await VoterModel.updateOne(
        { sheetName, row },
        {
          $set: {
            name,
            email: email || "",
            mobile,
            optionalMobile: optionalMobile || "",
            partyName: partyName || "",
            assemblyName: assemblyName || sheetName,
            status: status || "pending",
            isDuplicate: false,
          },
        }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating voter:", error);
    return NextResponse.json(
      { error: "Failed to update voter" },
      { status: 500 }
    );
  }
}
