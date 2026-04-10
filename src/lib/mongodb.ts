import mongoose from "mongoose";

const MONGODB_URI =
  "mongodb+srv://tmisperiviharikrishna_db_user:iqaMAuJD1t7jH79k@cluster0.2nq0rya.mongodb.net/assembly-voters?appName=Cluster0";

if (!MONGODB_URI) {
  throw new Error("MongoDB URI is not defined");
}

interface CachedConnection {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

const cached: CachedConnection = (global as Record<string, unknown>).__mongoose as CachedConnection || { conn: null, promise: null };
(global as Record<string, unknown>).__mongoose = cached;

export async function connectDB() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

// Voter Schema
const voterSchema = new mongoose.Schema(
  {
    sheetName: { type: String, required: true, index: true },
    row: { type: Number, required: true },
    name: { type: String, required: true },
    email: { type: String, default: "" },
    mobile: { type: String, default: "" },
    optionalMobile: { type: String, default: "" },
    partyName: { type: String, default: "", index: true },
    assemblyName: { type: String, default: "", index: true },
    status: { type: String, default: "pending", index: true },
    isDuplicate: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Compound index for fast lookups
voterSchema.index({ sheetName: 1, row: 1 }, { unique: true });

export const VoterModel =
  mongoose.models.Voter || mongoose.model("Voter", voterSchema);
