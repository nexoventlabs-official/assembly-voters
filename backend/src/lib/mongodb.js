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

// Call status tracking for telecallers
const callStatusSchema = new mongoose.Schema(
  {
    voterId: { type: mongoose.Schema.Types.ObjectId, ref: "Voter", required: true, index: true },
    telecaller: { type: String, required: true, index: true },
    status: {
      type: String,
      enum: ["interested", "not_interested", "no_response", "switch_off", "wrong_number", "callback"],
      required: true,
      index: true,
    },
    notes: { type: String, default: "" },
    calledAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

callStatusSchema.index({ voterId: 1, telecaller: 1 });

const CallStatusModel = mongoose.models.CallStatus || mongoose.model("CallStatus", callStatusSchema);

module.exports = { connectDB, VoterModel, CallStatusModel };
