import { getClient } from "../db/mongo";
export async function findAll(collectionName) {
    const client = await getClient();
    const db = client.db(process.env.DB_NAME);
    return db.collection(collectionName).find({}).toArray();
}
//# sourceMappingURL=findAll.js.map