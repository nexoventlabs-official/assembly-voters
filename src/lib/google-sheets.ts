import { google } from "googleapis";

const credentials = {
  type: "service_account",
  project_id: "assembly-voters",
  private_key_id: "5f959a64cf069f137b6ced3e5bdf37acaa48465f",
  private_key:
    "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDdjo/sT19WsNkx\n+pn9JA6dsdqpprC1EZN/4VDup6XOno54iFL/uw+iOKxUvNl/Pqs+YVf/Kcnk0e2z\nRwitS1Dx9rv2Jwo/cqNvXKrD+vCuVkqW6FAuXmJ0dDVJ8b59K40MjQwqEAOAc5Os\nAUja3+hHQhgsqgTVjX1A4vBoxs7JMjW5myCDJxurSoxU17TQV1m7rYDlEgYt2S5W\ndJOID6aERYgVeDGX+9kjsiCIWT8d00SwMPqOCeSG8OG6rRpUHL+9pVx77ixAtqID\npqI7Wk8Q/nuMxdQ0AVpqwuc1c8qtHEWQUrunvHzZyGpcI3iWfdbKTp1IVcarbTXr\nGCOohDl9AgMBAAECggEAU5TKB8Bju40Iytl6ySwWlXf4gSLAq/Y++jGyee3l154q\nKh9njFDx02Vk4azCskWejXBkpX6KyxdFAGpuRA3TMgy+GNzeeVQSgtrnEvryXBpy\nlh56zRtPMhZ62fPoREkvM0psiduzrnwre+qaJPPuKR+uhf73xuZTF6zlO+mwLebe\njjQlard3bA/+I4y7Gw1eKZpXvFYkZmKNmYHSvhoV3x5JY5jRzmJfV5WMszGw7bOq\n/0+F/TbYUeT+xLIl6juunEuH+tH4S3sorXCJH7Ps6b44PmaQglLhC7qPxjluXjPR\n9Rq5AaM3G3rUxmKCGkL4KuGx/7b+j5xRcCltFonqswKBgQD/NE1rKjnwsAIG9QiQ\nfcbWP+eyc63uaBqYS7piZW/F/5IQX2DfrI84XodYn/f3xcGSqzIZp7RRcYAvPLHk\n9Hkzy+3GrdGf2F5VDeDfo9cn5HFOera9IOEPMZvFY0qptOqDrAycOO5dgr5tT5ZL\nlo02qU6cT7DvtcHCbQNpN5PDPwKBgQDeP2c8eFkzSnB2IxtsCkj41OI15fVRV+Is\nvF128OdlXrQYEAc+4CQnhOnLAE93t12vZmkmJ0uKaMvIxeeXOEkWBE1RrdjsAZeh\n5ayXwgW08PMQjuEnOpqaUK1eOz8e7vdvE7dqZqi21G1/ej6Mgc+PH4aib3efskye\nZt9qWr/gQwKBgGcEXugOgJsHAZp7WTyyeQxNeaMQjTp6rZmioBdOKSN8+iI/ziQc\nTSgNCIee84MCQhSJpMy0ZNangX4P+yOYCED/ZflYexEST2n4EzlTsut4jMCISrHn\nztHKTb4NSbtdu3jxf5mkZZw7xdDsWpgiqthQ2dnBVYQ+E3v/c2wKskwTAoGBAJ8S\nypWhnlbz5OLp5erCwdA4r2Dco2YBfUV/3XYQn88SpdzDPCxoyffvTleadUa+3DN7\nHa/NWGhM8e9Wl5jJFKbJlX3s7OKfkSSz+4DzwpnsDE3Btq4ZaCcjr7NOvLMrX7cF\nabainAegrG8d1D9FeoZ6jicdmYWYXPbTsv2wzr15AoGBAPzF5Z2DgAn9Kx/ZBsuD\nPHkUII67NlAG2CUegXmNE6UNhVg70E5DmbUENdSxGRsdSW/+c7zO1bMt2mnrzmUr\nafOU/569TksOa1Y3UlZW1yqDnc2+dphAp2kI1Ra2jjzaZxJmTIENHUixqu5Pw1TM\nI1rPbSr//ULNmkhzg3V3iZmV\n-----END PRIVATE KEY-----\n",
  client_email: "assembly-voters@assembly-voters.iam.gserviceaccount.com",
  client_id: "104907420144537530318",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url:
    "https://www.googleapis.com/robot/v1/metadata/x509/assembly-voters%40assembly-voters.iam.gserviceaccount.com",
  universe_domain: "googleapis.com",
};

const SPREADSHEET_ID = "1y0txLKHFLRpvIWsTgJTJq3lRw_DAo5GM7HwwiDJykYc";

const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = google.sheets({ version: "v4", auth });

export interface Voter {
  row: number;
  name: string;
  email: string;
  mobile: string;
  optionalMobile: string;
  partyName: string;
  assemblyName: string;
  status: string;
  sheetName: string;
}

export async function getSheetNames(): Promise<string[]> {
  const res = await sheets.spreadsheets.get({
    spreadsheetId: SPREADSHEET_ID,
  });
  const sheetNames =
    res.data.sheets
      ?.map((s) => s.properties?.title || "")
      .filter((name) => name && !name.startsWith("_")) || [];
  return sheetNames;
}

export async function getVotersFromSheet(
  sheetName: string
): Promise<Voter[]> {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `'${sheetName}'!A:H`,
  });

  const rows = res.data.values || [];
  if (rows.length <= 2) return [];

  // Sheet structure: Row 1 = header, Row 2 = sub-header, data starts from row 3 (index 2)
  // NEW format: A=S.No, B=Name, C=Email, D=Phone.No ("main / optional"), E=Party Name, F=Assembly Name, G=Status
  // OLD format: A=S.No, B=Name, C=Email, D=Phone.No, E=Party Name, F=Assembly Name, G=Optional Mobile, H=Status
  return rows
    .slice(2)
    .filter((row) => row[1] && row[1].toString().trim() !== "")
    .map((row, index) => {
      const phoneRaw = (row[3] || "").toString().trim();
      const colG = (row[6] || "").toString().trim();
      const colH = (row[7] || "").toString().trim();

      let mobile = phoneRaw;
      let optionalMobile = "";
      let status = "pending";

      // Check if phone column D already contains "/" (new format)
      if (phoneRaw.includes("/")) {
        const parts = phoneRaw.split("/").map((p: string) => p.trim());
        mobile = parts[0];
        optionalMobile = parts[1] || "";
        // New format: status is in G
        status = colG || "pending";
      } else if (colG && /^\d+$/.test(colG)) {
        // Old format: G is a phone number (optional mobile), H is status
        optionalMobile = colG;
        status = colH || "pending";
      } else {
        // New format or no optional mobile: G is status
        status = colG || "pending";
      }

      return {
        row: index + 3, // 1-indexed, skip 2 header rows
        name: row[1] || "",
        email: row[2] || "",
        mobile,
        partyName: row[4] || "",
        assemblyName: row[5] || sheetName,
        optionalMobile,
        status,
        sheetName,
      };
    });
}

// Simple in-memory cache to reduce API calls
let cachedSheetNames: string[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 30000; // 30 seconds

async function getCachedSheetNames(): Promise<string[]> {
  const now = Date.now();
  if (cachedSheetNames && now - cacheTimestamp < CACHE_TTL) {
    return cachedSheetNames;
  }
  cachedSheetNames = await getSheetNames();
  cacheTimestamp = now;
  return cachedSheetNames;
}

export async function getAllVoters(): Promise<Voter[]> {
  const sheetNames = await getCachedSheetNames();
  const allVoters: Voter[] = [];

  // Process sheets sequentially with a small delay to avoid rate limits
  for (const name of sheetNames) {
    try {
      const voters = await getVotersFromSheet(name);
      allVoters.push(...voters);
    } catch (error: unknown) {
      const err = error as { code?: number };
      if (err.code === 429) {
        // Rate limited - wait 2 seconds and retry once
        await new Promise((resolve) => setTimeout(resolve, 2000));
        try {
          const voters = await getVotersFromSheet(name);
          allVoters.push(...voters);
        } catch {
          console.error(`Failed to fetch voters from sheet "${name}" after retry`);
        }
      } else {
        console.error(`Failed to fetch voters from sheet "${name}":`, error);
      }
    }
  }

  return allVoters;
}

export async function addVoter(
  sheetName: string,
  voter: Omit<Voter, "row" | "sheetName">
): Promise<void> {
  // Get current row count to determine S.No
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `'${sheetName}'!A:A`,
  });
  const nextSNo = (res.data.values?.length || 2) - 1;

  // Combine mobile + optional mobile into one phone column as "main / optional"
  const phoneValue = voter.optionalMobile
    ? `${voter.mobile} / ${voter.optionalMobile}`
    : voter.mobile;

  // Status: don't write "pending" to sheet, leave blank
  const statusValue = voter.status && voter.status.toLowerCase() !== "pending" ? voter.status : "";

  // Columns: A=S.No, B=Name, C=Email, D=Phone.No, E=Party Name, F=Assembly Name, G=Status
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `'${sheetName}'!A:G`,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [
        [
          nextSNo,
          voter.name,
          voter.email,
          phoneValue,
          voter.partyName,
          voter.assemblyName,
          statusValue,
        ],
      ],
    },
  });
}

export async function updateVoterStatus(
  sheetName: string,
  row: number,
  status: string
): Promise<void> {
  // Status is in column G — don't write "pending", leave blank instead
  const statusValue = status.toLowerCase() === "pending" ? "" : status;
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `'${sheetName}'!G${row}`,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [[statusValue]],
    },
  });
}

export async function updateVoter(
  sheetName: string,
  row: number,
  voter: Omit<Voter, "row" | "sheetName">
): Promise<void> {
  // Combine mobile + optional mobile into one phone column
  const phoneValue = voter.optionalMobile
    ? `${voter.mobile} / ${voter.optionalMobile}`
    : voter.mobile;

  // Status: don't write "pending" to sheet
  const statusValue = voter.status && voter.status.toLowerCase() !== "pending" ? voter.status : "";

  // Columns: B=Name, C=Email, D=Phone.No, E=Party Name, F=Assembly Name, G=Status
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `'${sheetName}'!B${row}:G${row}`,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [
        [
          voter.name,
          voter.email,
          phoneValue,
          voter.partyName,
          voter.assemblyName,
          statusValue,
        ],
      ],
    },
  });
}

// Helper to parse rows from a single sheet's raw values into stats
function parseSheetStats(sheetName: string, rows: string[][]) {
  // Skip 2 header rows, filter empty rows
  const dataRows = rows.slice(2).filter((row) => row[1] && row[1].toString().trim() !== "");
  const total = dataRows.length;

  let accepted = 0;
  let rejected = 0;

  for (const row of dataRows) {
    const phoneRaw = (row[3] || "").toString().trim();
    const colG = (row[6] || "").toString().trim();
    const colH = (row[7] || "").toString().trim();

    let status = "";
    if (phoneRaw.includes("/")) {
      status = colG;
    } else if (colG && /^\d+$/.test(colG)) {
      status = colH;
    } else {
      status = colG;
    }

    const s = status.toLowerCase();
    if (s === "accepted") accepted++;
    else if (s === "rejected") rejected++;
  }

  return { name: sheetName, total, accepted, rejected, pending: total - accepted - rejected };
}

export async function getDashboardStats() {
  const sheetNames = await getCachedSheetNames();

  // Use batchGet to fetch all sheets in batches of 50 ranges per call
  const BATCH_SIZE = 50;
  const assemblyStats: { name: string; total: number; accepted: number; rejected: number; pending: number }[] = [];

  for (let i = 0; i < sheetNames.length; i += BATCH_SIZE) {
    const batch = sheetNames.slice(i, i + BATCH_SIZE);
    const ranges = batch.map((name) => `'${name}'!A:H`);

    try {
      const res = await sheets.spreadsheets.values.batchGet({
        spreadsheetId: SPREADSHEET_ID,
        ranges,
      });

      const valueRanges = res.data.valueRanges || [];
      for (let j = 0; j < batch.length; j++) {
        const rows = valueRanges[j]?.values || [];
        assemblyStats.push(parseSheetStats(batch[j], rows));
      }
    } catch (error: unknown) {
      const err = error as { code?: number };
      if (err.code === 429) {
        // Rate limited — wait and retry once
        await new Promise((resolve) => setTimeout(resolve, 3000));
        try {
          const res = await sheets.spreadsheets.values.batchGet({
            spreadsheetId: SPREADSHEET_ID,
            ranges,
          });
          const valueRanges = res.data.valueRanges || [];
          for (let j = 0; j < batch.length; j++) {
            const rows = valueRanges[j]?.values || [];
            assemblyStats.push(parseSheetStats(batch[j], rows));
          }
        } catch {
          // If retry fails, add zeroed stats for this batch
          for (const name of batch) {
            assemblyStats.push({ name, total: 0, accepted: 0, rejected: 0, pending: 0 });
          }
        }
      } else {
        for (const name of batch) {
          assemblyStats.push({ name, total: 0, accepted: 0, rejected: 0, pending: 0 });
        }
      }
    }
  }

  const totalVoters = assemblyStats.reduce((sum, a) => sum + a.total, 0);
  const totalAccepted = assemblyStats.reduce((sum, a) => sum + a.accepted, 0);
  const totalRejected = assemblyStats.reduce((sum, a) => sum + a.rejected, 0);
  const totalPending = totalVoters - totalAccepted - totalRejected;

  return {
    totalAssemblies: sheetNames.length,
    totalVoters,
    totalAccepted,
    totalRejected,
    totalPending,
    assemblyStats,
  };
}

export async function getAssemblyStats(sheetName: string) {
  const voters = await getVotersFromSheet(sheetName);
  const total = voters.length;
  const accepted = voters.filter(
    (v) => v.status.toLowerCase() === "accepted"
  ).length;
  const rejected = voters.filter(
    (v) => v.status.toLowerCase() === "rejected"
  ).length;
  const pending = total - accepted - rejected;

  return { name: sheetName, total, accepted, rejected, pending };
}
