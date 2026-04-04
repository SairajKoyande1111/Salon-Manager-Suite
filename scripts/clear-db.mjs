/**
 * AT Smart Salon — Database Clear Script
 *
 * Deletes ALL documents from every collection.
 * Does NOT drop collections or indexes — schema structure is fully preserved.
 *
 * Usage:
 *   node scripts/clear-db.mjs "mongodb+srv://user:pass@cluster/dbname"
 */

import mongoose from "mongoose";

const MONGODB_URI = process.argv[2];

if (!MONGODB_URI) {
  console.error("\n❌  No MongoDB URI provided.");
  console.error(
    "    Usage: node scripts/clear-db.mjs \"mongodb+srv://user:pass@cluster/dbname\"\n"
  );
  process.exit(1);
}

const COLLECTIONS = [
  "customers",
  "appointments",
  "bills",
  "expenses",
  "customermemberships",
  "staffs",
  "services",
  "products",
  "productmetas",
  "memberships",
];

async function run() {
  console.log("\n🔌  Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI);
  console.log("✅  Connected.\n");

  const db = mongoose.connection.db;
  const existingCollections = await db
    .listCollections()
    .toArray()
    .then((cols) => cols.map((c) => c.name));

  let totalDeleted = 0;

  console.log("🧹  Clearing collections:\n");
  for (const name of COLLECTIONS) {
    if (!existingCollections.includes(name)) {
      console.log(`   ⚪  ${name.padEnd(22)} — not found, skipped`);
      continue;
    }
    const result = await db.collection(name).deleteMany({});
    totalDeleted += result.deletedCount;
    console.log(
      `   🗑️   ${name.padEnd(22)} — ${result.deletedCount} document(s) deleted`
    );
  }

  console.log(`\n✅  Done. Total deleted: ${totalDeleted} document(s)`);
  console.log(
    "    All collection schemas, indexes, and structure are preserved.\n"
  );
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error("\n❌  Error:", err.message);
  process.exit(1);
});
