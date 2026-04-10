import { NextResponse } from "next/server";
import { connectDB, VoterModel } from "@/lib/mongodb";
import { getAllVoters } from "@/lib/google-sheets";

export async function GET() {
  try {
    await connectDB();

    // Check if MongoDB has data, if not auto-sync
    let count = await VoterModel.countDocuments();
    if (count === 0) {
      const voters = await getAllVoters();
      if (voters.length > 0) {
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
      count = voters.length;
    }

    const voters = await VoterModel.find({}).lean();
    return NextResponse.json({ voters, count: voters.length });
  } catch (error) {
    console.error("Error fetching all voters:", error);
    return NextResponse.json(
      { error: "Failed to fetch voters" },
      { status: 500 }
    );
  }
}
