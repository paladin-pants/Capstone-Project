import { MongoClient, Db } from "mongodb";
import "dotenv/config";
function requireEnv(name) {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Missing ${name}`);
    }
    return value;
}
const uri = requireEnv("MONGODB_URI");
const dbName = requireEnv("MONGODB_DB");
let client = null;
let db = null;
export async function getDb() {
    if (db)
        return db;
    client = new MongoClient(uri);
    await client.connect();
    db = client.db(dbName);
    return db;
}
