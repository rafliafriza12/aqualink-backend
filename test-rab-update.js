import mongoose from "mongoose";
import RabConnection from "./models/RabConnection.js";
import { configDotenv } from "dotenv";

configDotenv();

// Connect to MongoDB
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/aqualink";

console.log("🔗 Connecting to MongoDB...");
await mongoose.connect(MONGODB_URI);
console.log("✅ Connected to MongoDB\n");

// Test RAB ID - ganti dengan ID yang actual
const testRabId = "68e4edfdb754d89f3fcfe571";

console.log(`🔍 Testing RAB update for ID: ${testRabId}\n`);

try {
  // 1. Find RAB before update
  const rabBefore = await RabConnection.findById(testRabId);
  console.log("📋 RAB BEFORE update:", {
    _id: rabBefore?._id,
    isPaid: rabBefore?.isPaid,
    totalBiaya: rabBefore?.totalBiaya,
  });

  if (!rabBefore) {
    console.error("❌ RAB not found!");
    process.exit(1);
  }

  // 2. Update RAB
  console.log("\n🔄 Updating isPaid to true...");
  const updatedRab = await RabConnection.findByIdAndUpdate(
    testRabId,
    { isPaid: true },
    { new: true }
  );

  console.log("📋 RAB AFTER update:", {
    _id: updatedRab?._id,
    isPaid: updatedRab?.isPaid,
    totalBiaya: updatedRab?.totalBiaya,
  });

  // 3. Verify update
  const rabVerify = await RabConnection.findById(testRabId);
  console.log("\n🔍 RAB verification (re-fetch):", {
    _id: rabVerify?._id,
    isPaid: rabVerify?.isPaid,
    totalBiaya: rabVerify?.totalBiaya,
  });

  if (rabVerify?.isPaid === true) {
    console.log("\n✅ UPDATE SUCCESSFUL!");
  } else {
    console.log("\n❌ UPDATE FAILED!");
  }

  // 4. Reset back to false for next test
  console.log("\n🔄 Resetting isPaid to false...");
  await RabConnection.findByIdAndUpdate(testRabId, { isPaid: false });
  console.log("✅ Reset complete");
} catch (error) {
  console.error("❌ Error:", error);
} finally {
  await mongoose.disconnect();
  console.log("\n🔌 Disconnected from MongoDB");
  process.exit(0);
}
