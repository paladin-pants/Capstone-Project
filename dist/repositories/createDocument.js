import { getDb } from "../db/mongo.js";
export async function createDocument(collectionName, data) {
    const db = await getDb();
    const createdAt = new Date();
    const docToInsert = { ...data, createdAt };
    const result = await db.collection(collectionName).insertOne(docToInsert);
    // This shape is exactly WithId<WithCreatedAt<T>>
    return { ...docToInsert, _id: result.insertedId };
}
//# sourceMappingURL=createDocument.js.map