import { Collection, ObjectId } from "mongodb";
// Example use: const wasDeleted = await deleteById(usersCollection, "65c1f4a8c8a1e9f2d4e12345");
export async function deleteById(collection, id) {
    const result = await collection.deleteOne({
        _id: new ObjectId(id)
    });
    return result.deletedCount === 1;
}
