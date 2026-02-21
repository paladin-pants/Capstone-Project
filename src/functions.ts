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

export async function showAll(): Promise<void> {
  const res = await fetch("/api/machines"); // or "http://localhost:3000/api/inventory"
  if (!res.ok) throw new Error("Failed to load machines");
  const docs = await res.json();
  console.log(docs);
    console.log(':(')
}