import express from "express";
import cors from "cors";
import "dotenv/config";
import { MongoClient, Db, ObjectId  } from "mongodb";

const app = express();
app.use(express.json());
app.use(cors());

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
 * DELETE /api/machines/:id
 * Deletes a machine by its id
 */
app.delete("/api/machines/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid machine id" });
    }

    const db = await connectToDatabase();

    const result = await db
      .collection("machines")
      .deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Machine not found" });
    }

    res.json({ message: "Machine deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete machine" });
  }
  return('success')
});

/**
 * GET /api/machine-states
 * Returns all machine states
 */
app.get("/api/machine-states", async (_req, res) => {
  try {
    const db = await connectToDatabase();
    const states = await db.collection("machineStates").find({}).toArray();
    res.json(states);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch machine states" });
  }
});

/**
 * GET /api/machine-states/:machineId
 * Returns the state for a machine
 */
app.get("/api/machine-states/:machineId", async (req, res) => {
  try {
    const { machineId } = req.params;
    if (!ObjectId.isValid(machineId)) {
      return res.status(400).json({ error: "Invalid machine id" });
    }
    const db = await connectToDatabase();
    const state = await db.collection("machineStates").findOne({ machineId });
    if (!state) return res.status(404).json({ error: "Machine state not found" });
    res.json(state);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch machine state" });
  }
});

/**
 * PUT /api/machine-states/:machineId
 * Creates or updates the state for a machine
 * Body: { status: "idle" | "running" | "off" }
 */
app.put("/api/machine-states/:machineId", async (req, res) => {
  try {
    const { machineId } = req.params;
    const { status } = req.body;
    if (!ObjectId.isValid(machineId)) {
      return res.status(400).json({ error: "Invalid machine id" });
    }
    const validStatuses = ["idle", "running", "off"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "status must be idle, running, or off" });
    }
    const db = await connectToDatabase();
    await db.collection("machineStates").updateOne(
      { machineId },
      { $set: { machineId, status } },
      { upsert: true }
    );
    res.json({ machineId, status });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update machine state" });
  }
  return;
});

/**
 * GET /api/machine-power
 * Returns all machine power records
 */
app.get("/api/machine-power", async (_req, res) => {
  try {
    const db = await connectToDatabase();
    const power = await db.collection("machinePower").find({}).toArray();
    res.json(power);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch machine power records" });
  }
});

/**
 * GET /api/machine-power/:machineId
 * Returns the power record for a machine
 */
app.get("/api/machine-power/:machineId", async (req, res) => {
  try {
    const { machineId } = req.params;
    if (!ObjectId.isValid(machineId)) {
      return res.status(400).json({ error: "Invalid machine id" });
    }
    const db = await connectToDatabase();
    const power = await db.collection("machinePower").findOne({ machineId });
    if (!power) return res.status(404).json({ error: "Machine power not found" });
    res.json(power);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch machine power" });
  }
});

/**
 * PUT /api/machine-power/:machineId
 * Creates or updates the wattage for a machine
 * Body: { wattage: number }
 */
function deriveState(wattage: number | undefined): string {
  if (wattage === undefined) return "unknown";
  if (wattage === 0) return "off";
  if (wattage > 100) return "running";
  if (wattage > 10) return "idle";
  return "unknown";
}

app.put("/api/machine-power/:machineId", async (req, res) => {
  try {
    const { machineId } = req.params;
    const { wattage } = req.body;
    if (!ObjectId.isValid(machineId)) {
      return res.status(400).json({ error: "Invalid machine id" });
    }
    if (typeof wattage !== "number" || wattage < 0) {
      return res.status(400).json({ error: "wattage must be a non-negative number" });
    }
    const db = await connectToDatabase();

    const existing = await db.collection("machinePower").findOne({ machineId });
    const fromState = deriveState(existing?.wattage);
    const toState = deriveState(wattage);

    await db.collection("machinePower").updateOne(
      { machineId },
      { $set: { machineId, wattage } },
      { upsert: true }
    );

    if (fromState !== toState) {
      await db.collection("activityLogs").insertOne({ machineId, fromState, toState, timestamp: new Date() });
    }

    res.json({ machineId, wattage });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update machine power" });
  }
  return;
});

/**
 * POST /api/machines
 * Creates a machine record
 */
app.post("/api/machines", async (req, res) => {
  try {
    const { type, building, floor, section } = req.body;
    if (!building) {return res.status(400).json({ error: "building is required" });}
    if (typeof floor !== "number") {return res.status(400).json({ error: "floor must be a number" });}

    const db = await connectToDatabase();

    const machineDoc = {
      type: type,
      location: {
        building,
        floor,
        ...(section ? { section } : {})
      },
      createdAt: new Date(),
    };

    const result = await db.collection("machines").insertOne(machineDoc);

    res.status(201).json({
      _id: result.insertedId,
      ...machineDoc,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create machine" });
  }
});

/**
 * GET /api/activity-logs
 * Returns all state transition logs, newest first
 */
app.get("/api/activity-logs", async (_req, res) => {
  try {
    const db = await connectToDatabase();
    const logs = await db.collection("activityLogs").find({}).sort({ timestamp: -1 }).toArray();
    res.json(logs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch activity logs" });
  }
});

/**
 * GET /api/machine-notes
 * Returns all notes across all machines, newest first (for activity log)
 */
app.get("/api/machine-notes", async (_req, res) => {
  try {
    const db = await connectToDatabase();
    const notes = await db.collection("machineNotes").find({}).sort({ createdAt: -1 }).toArray();
    res.json(notes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch notes" });
  }
});

/**
 * GET /api/machine-notes/:machineId
 * Returns active (non-dismissed) notes for a machine, newest first
 */
app.get("/api/machine-notes/:machineId", async (req, res) => {
  try {
    const { machineId } = req.params;
    if (!ObjectId.isValid(machineId)) {
      return res.status(400).json({ error: "Invalid machine id" });
    }
    const db = await connectToDatabase();
    const notes = await db.collection("machineNotes").find({ machineId, dismissed: { $ne: true } }).sort({ createdAt: -1 }).toArray();
    res.json(notes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch notes" });
  }
});

/**
 * PATCH /api/machine-notes/note/:noteId/dismiss
 * Soft-deletes a note by marking it as dismissed
 */
app.patch("/api/machine-notes/note/:noteId/dismiss", async (req, res) => {
  try {
    const { noteId } = req.params;
    if (!ObjectId.isValid(noteId)) {
      return res.status(400).json({ error: "Invalid note id" });
    }
    const db = await connectToDatabase();
    const result = await db.collection("machineNotes").updateOne(
      { _id: new ObjectId(noteId) },
      { $set: { dismissed: true, dismissedAt: new Date() } }
    );
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Note not found" });
    }
    res.json({ message: "Note dismissed" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to dismiss note" });
  }
});

/**
 * POST /api/machine-notes/:machineId
 * Creates a new note for a machine
 * Body: { text: string }
 */
app.post("/api/machine-notes/:machineId", async (req, res) => {
  try {
    const { machineId } = req.params;
    const { text } = req.body;
    if (!ObjectId.isValid(machineId)) {
      return res.status(400).json({ error: "Invalid machine id" });
    }
    if (!text || typeof text !== "string" || !text.trim()) {
      return res.status(400).json({ error: "text is required" });
    }
    const db = await connectToDatabase();
    const note = { machineId, text: text.trim(), createdAt: new Date() };
    const result = await db.collection("machineNotes").insertOne(note);
    res.status(201).json({ _id: result.insertedId, ...note });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create note" });
  }
});

app.listen(port, () => console.log(`API running on http://localhost:${port}`));