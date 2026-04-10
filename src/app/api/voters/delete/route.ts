import { NextRequest, NextResponse } from "next/server";
import { deleteVoterRow } from "@/lib/google-sheets";
import { connectDB, VoterModel } from "@/lib/mongodb";

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { sheetName, row } = body;

    if (!sheetName || !row) {
      return NextResponse.json(
        { error: "Sheet name and row are required" },
        { status: 400 }
      );
    }

    // Delete from Google Sheets (also re-numbers S.No)
    await deleteVoterRow(sheetName, row);

    // Delete from MongoDB + update row numbers for remaining rows
    await connectDB();
    await VoterModel.deleteOne({ sheetName, row });
    // Shift rows down for all rows after the deleted one
    await VoterModel.updateMany(
      { sheetName, row: { $gt: row } },
      { $inc: { row: -1 } }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting voter:", error);
    return NextResponse.json(
      { error: "Failed to delete voter" },
      { status: 500 }
    );
  }
}
