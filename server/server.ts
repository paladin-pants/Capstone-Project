import express from "express";
import "dotenv/config";
import { MongoClient, Db } from "mongodb";

const app = express();
app.use(express.json());

const uri = process.env.MONGODB_URI;
const dbName = process.env.DB_NAME ?? "yourDatabaseName";
const port = Number(process.env.PORT ?? 3000);

if (!uri) throw new Error("Missing env var: MONGODB_URI");

const client = new MongoClient(uri);

let db: Db;

// Reuse one connection (lazy connect on first request)
export async function connectToDatabase(): Promise<Db> {
  if (!db) {
    await client.connect();
    db = client.db(dbName);
    console.log("Connected to MongoDB");
  }
  return db;
}

/**
 * GET /api/inventory
 * Returns all documents in the inventory collection
 */
app.get("/api/machines", async (_req, res) => {
  try {
    const db = await connectToDatabase();
    const docs = await db.collection("machines").find({}).toArray();
    res.json(docs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch machines" });
  }
});

/**
 * POST /api/machines
 * Creates a machine record
 */
app.post("/api/machines", async (req, res) => {
  try {
    const { name, type } = req.body;
    if (!name) return res.status(400).json({ error: "name is required" });

    const db = await connectToDatabase();
    const result = await db.collection("inventory").insertOne({
      name,
      type: type ?? "unknown",
      createdAt: new Date(),
    });

    res.status(201).json({
      _id: result.insertedId,
      name,
      type: type ?? "unknown",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create machine" });
  }
});

app.get("/", (_req, res) => {
  res.send("Backend is running ✅");
});

app.listen(port, () => console.log(`API running on http://localhost:${port}`));