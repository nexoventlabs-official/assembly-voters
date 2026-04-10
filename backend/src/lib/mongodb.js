const mongoose = require("mongoose");

let isConnected = false;

async function connectDB() {
  if (isConnected) return;
  await mongoose.connect(process.env.MONGODB_URI);
  isConnected = true;
  console.log("MongoDB connected");
}

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

voterSchema.index({ sheetName: 1, row: 1 }, { unique: true });

const VoterModel = mongoose.models.Voter || mongoose.model("Voter", voterSchema);

module.exports = { connectDB, VoterModel };
