// import { MongoClient } from "mongodb";
// import type { Document } from "mongodb";
// import "dotenv/config";

// const { MONGODB_URI, DB_NAME, COLLECTION_NAME} = process.env as 
//     {MONGODB_URI: string; DB_NAME: string;COLLECTION_NAME: string;};


// Creates a washer or dryer machine and adds it to the database
export function createMachine(): void {
    const input = document.getElementById("machineName") as HTMLInputElement | null;
    alert(`Machine name: ${input?.value ?? ""}`);
}

// export async function showAll(): Promise<void> {
//   const client = new MongoClient(MONGODB_URI);

//   try {
//     await client.connect();

//     const db = client.db(DB_NAME);
//     const collection = db.collection<Document>(COLLECTION_NAME);

//     const docs = await collection.find({}).toArray();

//     console.log(
//       `Found ${docs.length} document(s) in ${DB_NAME}.${COLLECTION_NAME}`
//     );

//     for (const doc of docs) {
//       console.log(JSON.stringify(doc, null, 2));
//     }
//   } finally {
//     await client.close();
//   }
// }