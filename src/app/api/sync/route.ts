import { NextResponse } from "next/server";
import { getAllVoters } from "@/lib/google-sheets";
import { connectDB, VoterModel } from "@/lib/mongodb";

export async function POST() {
  try {
    await connectDB();

    // Fetch all voters from Google Sheets
    const voters = await getAllVoters();

    // Clear existing data and bulk insert
    await VoterModel.deleteMany({});

    if (voters.length > 0) {
      // Insert in batches of 500
      const BATCH_SIZE = 500;
      for (let i = 0; i < voters.length; i += BATCH_SIZE) {
        const batch = voters.slice(i, i + BATCH_SIZE).map((v) => ({
          sheetName: v.sheetName,
          row: v.row,
          name: v.name,
          email: v.email,
          mobile: v.mobile,
          optionalMobile: v.optionalMobile,
          partyName: v.partyName,
          assemblyName: v.assemblyName || v.sheetName,
          status: v.status,
          isDuplicate: v.isDuplicate,
        }));
        await VoterModel.insertMany(batch, { ordered: false });
      }
    }

    return NextResponse.json({
      success: true,
      count: voters.length,
      message: `Synced ${voters.length} voters to MongoDB`,
    });
  } catch (error) {
    console.error("Sync error:", error);
    return NextResponse.json(
      { error: "Failed to sync data" },
      { status: 500 }
    );
  }
}
