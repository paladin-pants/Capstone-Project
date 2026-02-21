import type { Document } from "mongodb";
import { getDb } from "./db/mongo.js";

async function toggleName(collectionName: string) {
  const db = await getDb();
  const collection = db.collection<Document>(collectionName);

  await collection.updateMany(
    { name: "Henry" },
    { $set: { name: "James" } }
  );
// Temporarily disabled, must add either if else loop or option to choose how to disable
//   await collection.updateMany(
//     { name: "James" },
//     { $set: { name: "Henry" } }
//   );

  console.log("Toggle complete");
}

const collectionName = process.argv[2];
if (!collectionName) {
  throw new Error("Usage: toggleName <collection>");
}

toggleName(collectionName).catch(console.error);
