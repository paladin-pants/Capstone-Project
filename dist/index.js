import { createDocument } from "./repositories/createDocument.js";
async function main() {
    const user = await createDocument("machines", {
        name: "Henry",
        email: "henry@example.com",
        skills: ["TypeScript", "MongoDB"],
        meta: {
            source: "capstone",
        },
    });
    console.log("Inserted document:", user);
}
main().catch(console.error);
//# sourceMappingURL=index.js.map