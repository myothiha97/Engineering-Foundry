import { createDatabase, schema } from "./index";
const db = createDatabase();
await db
  .insert(schema.users)
  .values({ name: "Demo Learner", email: "learner@example.com", emailVerified: true })
  .onConflictDoNothing();
console.log("Seeded demo learner");
