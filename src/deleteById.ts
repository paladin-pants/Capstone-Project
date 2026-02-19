import { Collection, ObjectId, type DeleteResult } from "mongodb";

// Example use: const wasDeleted = await deleteById(usersCollection, "65c1f4a8c8a1e9f2d4e12345");
export async function deleteById<T extends Document>(
  collection: Collection<T>,
  id: string
): Promise<boolean> {
  const result: DeleteResult = await collection.deleteOne({
    _id: new ObjectId(id)
  } as any);

  return result.deletedCount === 1;
}
