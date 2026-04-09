import { NextResponse } from "next/server";
import { getAllAcceptedVoters } from "@/lib/google-sheets";
import * as XLSX from "xlsx";

export async function GET() {
  try {
    const voters = await getAllAcceptedVoters();

    // Group by assembly
    const assemblyMap = new Map<string, typeof voters>();
    for (const v of voters) {
      const list = assemblyMap.get(v.assembly) || [];
      list.push(v);
      assemblyMap.set(v.assembly, list);
    }

    // Create workbook
    const wb = XLSX.utils.book_new();

    // Create a combined "All Accepted" sheet first
    const allData = voters.map((v, i) => ({
      "S.No": i + 1,
      "Assembly": v.assembly,
      "Name": v.name,
      "Email": v.email,
      "Mobile": v.mobile,
      "Secondary Mobile": v.optionalMobile,
      "Party": v.partyName,
    }));
    const allSheet = XLSX.utils.json_to_sheet(allData);

    // Set column widths
    allSheet["!cols"] = [
      { wch: 6 },   // S.No
      { wch: 25 },  // Assembly
      { wch: 25 },  // Name
      { wch: 28 },  // Email
      { wch: 16 },  // Mobile
      { wch: 16 },  // Secondary Mobile
      { wch: 20 },  // Party
    ];
    XLSX.utils.book_append_sheet(wb, allSheet, "All Accepted");

    // Create per-assembly sheets
    const sortedAssemblies = [...assemblyMap.keys()].sort();
    for (const assembly of sortedAssemblies) {
      const list = assemblyMap.get(assembly)!;
      const data = list.map((v, i) => ({
        "S.No": i + 1,
        "Name": v.name,
        "Email": v.email,
        "Mobile": v.mobile,
        "Secondary Mobile": v.optionalMobile,
        "Party": v.partyName,
      }));
      const ws = XLSX.utils.json_to_sheet(data);
      ws["!cols"] = [
        { wch: 6 },
        { wch: 25 },
        { wch: 28 },
        { wch: 16 },
        { wch: 16 },
        { wch: 20 },
      ];
      // Sheet name max 31 chars in Excel
      const safeName = assembly.length > 31 ? assembly.substring(0, 31) : assembly;
      XLSX.utils.book_append_sheet(wb, ws, safeName);
    }

    // Write to buffer
    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    const today = new Date().toISOString().split("T")[0];
    const filename = `Accepted_Candidates_${today}.xlsx`;

    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Error exporting voters:", error);
    return NextResponse.json(
      { error: "Failed to export accepted candidates" },
      { status: 500 }
    );
  }
}
