import crypto from "crypto";

// Data dari webhook Midtrans yang Anda terima
const notification = {
  order_id: "RAB-68e4edfdb754d89f3fcfe571-1759851491516",
  status_code: "200",
  gross_amount: "1200000.00",
  signature_key:
    "fbff536d61d1914e6722a562bcb3ad61222253aeba7070e88a1f6ece6bbb59713fa22d89cd13aa3957159e145e9117ddb98276e0f5bf8b817163ef24ea912f66",
};

// Server keys to test
const serverKeys = [
  "SB-Mid-server-Fj3ePUi0ZtXwRwemdjNnshf-", // Hardcoded di middleware
  process.env.MIDTRANS_SERVER_KEY || "NOT_SET", // From env
];

console.log("🔍 Testing Midtrans Signature Verification\n");
console.log("Received Data:");
console.log("- Order ID:", notification.order_id);
console.log("- Status Code:", notification.status_code);
console.log("- Gross Amount:", notification.gross_amount);
console.log("- Received Signature:", notification.signature_key);
console.log("\n" + "=".repeat(80) + "\n");

serverKeys.forEach((serverKey, index) => {
  console.log(
    `Test ${index + 1}: Server Key = ${serverKey.substring(0, 15)}...`
  );

  // Test dengan format gross_amount as-is (dengan .00)
  const signatureString1 = `${notification.order_id}${notification.status_code}${notification.gross_amount}${serverKey}`;
  const hash1 = crypto
    .createHash("sha512")
    .update(signatureString1)
    .digest("hex");

  console.log(`  Format 1 (dengan .00): ${notification.gross_amount}`);
  console.log(
    `  Signature String: ${notification.order_id}${notification.status_code}${notification.gross_amount}[SERVER_KEY]`
  );
  console.log(`  Calculated Hash: ${hash1}`);
  console.log(
    `  Match: ${hash1 === notification.signature_key ? "✅ YES" : "❌ NO"}`
  );

  // Test dengan format gross_amount tanpa decimal (1200000)
  const grossAmountInt = parseFloat(notification.gross_amount).toString();
  const signatureString2 = `${notification.order_id}${notification.status_code}${grossAmountInt}${serverKey}`;
  const hash2 = crypto
    .createHash("sha512")
    .update(signatureString2)
    .digest("hex");

  console.log(`\n  Format 2 (tanpa .00): ${grossAmountInt}`);
  console.log(
    `  Signature String: ${notification.order_id}${notification.status_code}${grossAmountInt}[SERVER_KEY]`
  );
  console.log(`  Calculated Hash: ${hash2}`);
  console.log(
    `  Match: ${hash2 === notification.signature_key ? "✅ YES" : "❌ NO"}`
  );

  console.log("\n" + "-".repeat(80) + "\n");
});

console.log("\n📋 Recommendations:");
console.log("1. Check which server key and format matches");
console.log(
  "2. Make sure MIDTRANS_SERVER_KEY in .env matches the one in Midtrans Dashboard"
);
console.log("3. Verify gross_amount format (with or without decimal)");
