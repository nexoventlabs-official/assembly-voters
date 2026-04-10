const { google } = require("googleapis");

const SPREADSHEET_ID = process.env.SPREADSHEET_ID;

const credentials = {
  type: "service_account",
  project_id: "assembly-voters",
  private_key_id: "5f959a64cf069f137b6ced3e5bdf37acaa48465f",
  private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  client_id: "104907420144537530318",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url:
    "https://www.googleapis.com/robot/v1/metadata/x509/assembly-voters%40assembly-voters.iam.gserviceaccount.com",
  universe_domain: "googleapis.com",
};

const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = google.sheets({ version: "v4", auth });

// Cache
let cachedSheetNames = null;
let cacheTimestamp = 0;
const CACHE_TTL = 30000;

async function getCachedSheetNames() {
  const now = Date.now();
  if (cachedSheetNames && now - cacheTimestamp < CACHE_TTL) {
    return cachedSheetNames;
  }
  cachedSheetNames = await getSheetNames();
  cacheTimestamp = now;
  return cachedSheetNames;
}

async function getSheetNames() {
  const res = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
  return (
    res.data.sheets
      ?.map((s) => s.properties?.title || "")
      .filter((name) => name && !name.startsWith("_")) || []
  );
}

async function getVotersFromSheet(sheetName) {
  const valuesRes = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `'${sheetName}'!A:H`,
  });

  const rows = valuesRes.data.values || [];
  if (rows.length <= 2) return [];

  return rows
    .slice(2)
    .filter((row) => row[1] && row[1].toString().trim() !== "")
    .map((row, index) => {
      const phoneRaw = (row[3] || "").toString().trim();
      const colG = (row[6] || "").toString().trim();

      let mobile = phoneRaw;
      let optionalMobile = "";

      if (phoneRaw.includes("/")) {
        const parts = phoneRaw.split("/").map((p) => p.trim());
        mobile = parts[0];
        optionalMobile = parts[1] || "";
      } else if (colG && /^\d+$/.test(colG)) {
        optionalMobile = colG;
      }

      const isDuplicate = colG.toLowerCase() === "duplicate";

      const colH = (row[7] || "").toString().trim();
      let status = "pending";
      if (colH) {
        status = colH;
      }

      return {
        row: index + 3,
        name: row[1] || "",
        email: row[2] || "",
        mobile,
        partyName: row[4] || "",
        assemblyName: row[5] || sheetName,
        optionalMobile,
        status,
        isDuplicate,
        sheetName,
      };
    });
}

function parseRowsToVoters(sheetName, rows) {
  if (!rows || rows.length <= 2) return [];
  return rows
    .slice(2)
    .filter((row) => row[1] && row[1].toString().trim() !== "")
    .map((row, index) => {
      const phoneRaw = (row[3] || "").toString().trim();
      const colG = (row[6] || "").toString().trim();

      let mobile = phoneRaw;
      let optionalMobile = "";

      if (phoneRaw.includes("/")) {
        const parts = phoneRaw.split("/").map((p) => p.trim());
        mobile = parts[0];
        optionalMobile = parts[1] || "";
      } else if (colG && /^\d+$/.test(colG)) {
        optionalMobile = colG;
      }

      const isDuplicate = colG.toLowerCase() === "duplicate";
      const colH = (row[7] || "").toString().trim();
      let status = "pending";
      if (colH) status = colH;

      return {
        row: index + 3,
        name: row[1] || "",
        email: row[2] || "",
        mobile,
        partyName: row[4] || "",
        assemblyName: row[5] || sheetName,
        optionalMobile,
        status,
        isDuplicate,
        sheetName,
      };
    });
}

async function getAllVoters() {
  const sheetNames = await getCachedSheetNames();
  const allVoters = [];

  // Use batchGet to fetch 10 sheets at a time with delay between batches
  const BATCH_SIZE = 10;
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
        const voters = parseRowsToVoters(batch[j], rows);
        allVoters.push(...voters);
      }
    } catch (error) {
      if (error.code === 429) {
        console.log(`Rate limited at batch ${i}, waiting 5s...`);
        await new Promise((resolve) => setTimeout(resolve, 5000));
        i -= BATCH_SIZE; // retry this batch
      } else {
        console.error(`Error fetching batch starting at ${i}:`, error.message);
        for (const name of batch) {
          console.error(`Skipped sheet "${name}"`);
        }
      }
    }

    // Delay between batches to avoid rate limits
    if (i + BATCH_SIZE < sheetNames.length) {
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }
  }

  return allVoters;
}

async function getAllAcceptedVoters() {
  const sheetNames = await getCachedSheetNames();
  const results = [];

  const BATCH_SIZE = 50;
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
        const assemblyName = batch[j];
        const rows = valueRanges[j]?.values || [];
        if (rows.length <= 2) continue;

        const dataRows = rows.slice(2).filter((row) => row[1] && row[1].toString().trim() !== "");
        for (const row of dataRows) {
          const colH = (row[7] || "").toString().trim().toLowerCase();
          if (colH === "accepted") {
            const phoneRaw = (row[3] || "").toString().trim();
            let mobile = phoneRaw;
            let optionalMobile = "";
            if (phoneRaw.includes("/")) {
              const parts = phoneRaw.split("/").map((p) => p.trim());
              mobile = parts[0];
              optionalMobile = parts[1] || "";
            }
            results.push({
              assembly: assemblyName,
              name: (row[1] || "").toString().trim(),
              email: (row[2] || "").toString().trim(),
              mobile,
              optionalMobile,
              partyName: (row[4] || "").toString().trim(),
            });
          }
        }
      }
    } catch (error) {
      if (error.code === 429) {
        await new Promise((resolve) => setTimeout(resolve, 3000));
        i -= BATCH_SIZE;
      } else {
        console.error("Error fetching batch:", error);
      }
    }
  }

  return results;
}

async function addVoter(sheetName, voter) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `'${sheetName}'!A:A`,
  });
  const nextSNo = (res.data.values?.length || 2) - 1;

  const phoneValue = voter.optionalMobile
    ? `${voter.mobile} / ${voter.optionalMobile}`
    : voter.mobile;

  const statusValue = voter.status && voter.status.toLowerCase() !== "pending" ? voter.status : "";

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `'${sheetName}'!A:H`,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [[nextSNo, voter.name, voter.email, phoneValue, voter.partyName, voter.assemblyName, "", statusValue]],
    },
  });
}

async function updateVoterStatus(sheetName, row, status) {
  if (status.toLowerCase() === "duplicate") {
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `'${sheetName}'!G${row}`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [["Duplicate"]] },
    });
  } else {
    const statusText = status.toLowerCase() === "accepted" ? "accepted" : "";
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `'${sheetName}'!H${row}`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [[statusText]] },
    });
  }
}

async function getSheetId(sheetName) {
  const res = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
  const sheet = res.data.sheets?.find((s) => s.properties?.title === sheetName);
  return sheet?.properties?.sheetId ?? 0;
}

async function deleteVoterRow(sheetName, row) {
  const sheetId = await getSheetId(sheetName);

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      requests: [
        {
          deleteDimension: {
            range: { sheetId, dimension: "ROWS", startIndex: row - 1, endIndex: row },
          },
        },
      ],
    },
  });

  // Re-number S.No
  const valuesRes = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `'${sheetName}'!A:A`,
  });
  const allRows = valuesRes.data.values || [];
  const dataCount = allRows.length - 2;
  if (dataCount > 0) {
    const serialNumbers = Array.from({ length: dataCount }, (_, i) => [i + 1]);
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `'${sheetName}'!A3:A${2 + dataCount}`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: serialNumbers },
    });
  }
}

async function updateVoter(sheetName, row, voter) {
  const phoneValue = voter.optionalMobile
    ? `${voter.mobile} / ${voter.optionalMobile}`
    : voter.mobile;

  const statusText = voter.status?.toLowerCase() === "accepted" ? "accepted" : "";

  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `'${sheetName}'!B${row}:F${row}`,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [[voter.name, voter.email, phoneValue, voter.partyName, voter.assemblyName]],
    },
  });

  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `'${sheetName}'!H${row}`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [[statusText]] },
  });
}

function parseSheetStats(sheetName, rows) {
  const dataRows = rows.slice(2).filter((row) => row[1] && row[1].toString().trim() !== "");
  const total = dataRows.length;
  let accepted = 0;
  let rejected = 0;

  for (const row of dataRows) {
    const colH = (row[7] || "").toString().trim().toLowerCase();
    if (colH === "accepted") accepted++;
    else if (colH === "rejected") rejected++;
  }

  return { name: sheetName, total, accepted, rejected, pending: total - accepted - rejected };
}

async function getDashboardStats() {
  const sheetNames = await getCachedSheetNames();
  const assemblyStats = [];

  const BATCH_SIZE = 50;
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
    } catch (error) {
      if (error.code === 429) {
        await new Promise((resolve) => setTimeout(resolve, 3000));
        try {
          const res = await sheets.spreadsheets.values.batchGet({ spreadsheetId: SPREADSHEET_ID, ranges });
          const valueRanges = res.data.valueRanges || [];
          for (let j = 0; j < batch.length; j++) {
            assemblyStats.push(parseSheetStats(batch[j], valueRanges[j]?.values || []));
          }
        } catch {
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

  return {
    totalAssemblies: sheetNames.length,
    totalVoters,
    totalAccepted,
    totalRejected,
    totalPending: totalVoters - totalAccepted - totalRejected,
    assemblyStats,
  };
}

async function getAssemblyStats(sheetName) {
  const voters = await getVotersFromSheet(sheetName);
  const total = voters.length;
  const accepted = voters.filter((v) => v.status.toLowerCase() === "accepted").length;
  const rejected = voters.filter((v) => v.status.toLowerCase() === "rejected").length;
  return { name: sheetName, total, accepted, rejected, pending: total - accepted - rejected };
}

module.exports = {
  getSheetNames,
  getVotersFromSheet,
  getAllVoters,
  getAllAcceptedVoters,
  addVoter,
  updateVoterStatus,
  updateVoter,
  deleteVoterRow,
  getDashboardStats,
  getAssemblyStats,
};
