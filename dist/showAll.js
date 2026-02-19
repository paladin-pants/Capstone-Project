/**
 * showAll.ts
 * Prints all documents from a MongoDB collection
 */
import { MongoClient } from "mongodb";
import "dotenv/config";
// --- Environment variables ---
const { MONGODB_URI, DB_NAME, COLLECTION_NAME, } = process.env;
if (!MONGODB_URI)
    throw new Error("Missing env var: MONGODB_URI");
if (!DB_NAME)
    throw new Error("Missing env var: DB_NAME");
if (!COLLECTION_NAME)
    throw new Error("Missing env var: COLLECTION_NAME");
async function showAll() {
    const client = new MongoClient(MONGODB_URI);
    console.log('test1');
    try {
        await client.connect();
        const db = client.db(DB_NAME);
        const collection = db.collection(COLLECTION_NAME);
        const docs = await collection.find({}).toArray();
        console.log('test2');
        console.log(`Found ${docs.length} document(s) in ${DB_NAME}.${COLLECTION_NAME}`);
        for (const doc of docs) {
            console.log(JSON.stringify(doc, null, 2));
        }
    }
    finally {
        await client.close();
    }
}
showAll().catch((err) => {
    console.error("Error:", err);
    process.exitCode = 1;
});
