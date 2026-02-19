import "dotenv/config";
import { MongoClient } from "mongodb";

async function main() {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB;

  if (!uri) throw new Error("Missing MONGODB_URI in .env");
  if (!dbName) throw new Error("Missing MONGODB_DB in .env");

  // Show that env loaded (don’t print credentials)
  console.log("MONGODB_URI loaded:", uri.startsWith("mongodb"));
  console.log("DB name:", dbName);

  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");

    // Ping the server
    await client.db("admin").command({ ping: 1 });
    console.log("✅ Ping OK");

    // Write + read a test doc
    const db = client.db(dbName);
    const col = db.collection("connection_tests");

    const insertRes = await col.insertOne({
      createdAt: new Date(),
      note: "env + connection test"
    });

    console.log("✅ Inserted test doc id:", insertRes.insertedId);

    const found = await col.findOne({ _id: insertRes.insertedId });
    console.log("✅ Read back:", found);
  } finally {
    await client.close();
    console.log("🔌 Closed connection");
  }
}

main().catch((err) => {
  console.error("❌ Connection test failed:");
  console.error(err);
  process.exit(1);
});
