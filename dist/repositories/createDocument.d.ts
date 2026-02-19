import type { WithId, Document } from "mongodb";
type WithCreatedAt<T extends Document> = T & {
    createdAt: Date;
};
export declare function createDocument<T extends Document>(collectionName: string, data: T): Promise<WithId<WithCreatedAt<T>>>;
export {};
//# sourceMappingURL=createDocument.d.ts.map