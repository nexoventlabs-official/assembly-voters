import { NextRequest, NextResponse } from "next/server";
import { deleteVoterRow } from "@/lib/google-sheets";

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

    await deleteVoterRow(sheetName, row);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting voter:", error);
    return NextResponse.json(
      { error: "Failed to delete voter" },
      { status: 500 }
    );
  }
}
