import { db } from "./index";
import { categories } from "./schema";
import { sql } from "drizzle-orm";

const SEED = [
  { id: "food", name: "Food", color: "#ef4444", sortOrder: 1 },
  { id: "transport", name: "Transport", color: "#3b82f6", sortOrder: 2 },
  { id: "bills", name: "Bills", color: "#a855f7", sortOrder: 3 },
  { id: "shopping", name: "Shopping", color: "#f59e0b", sortOrder: 4 },
  { id: "health", name: "Health", color: "#10b981", sortOrder: 5 },
  { id: "entertainment", name: "Entertainment", color: "#ec4899", sortOrder: 6 },
  { id: "pets", name: "Pets", color: "#b45309", sortOrder: 7 },
  { id: "other", name: "Other", color: "#6b7280", sortOrder: 99 },
];

async function main() {
  for (const c of SEED) {
    await db
      .insert(categories)
      .values(c)
      .onConflictDoUpdate({
        target: categories.id,
        set: { name: c.name, color: c.color, sortOrder: c.sortOrder },
      });
  }
  const rows = await db.execute(sql`select count(*)::int as n from categories`);
  console.log(`seeded categories — total rows: ${(rows as any)[0]?.n}`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
