import { migrate } from "drizzle-orm/postgres-js/migrator";
import { db } from "./index";
import path from "node:path";

const migrationsFolder = path.join(import.meta.dir, "../../drizzle");

await migrate(db, { migrationsFolder });
console.log("migrations applied");
process.exit(0);
