import { Elysia } from "elysia";
import { asc } from "drizzle-orm";
import { db } from "../db";
import { categories } from "../db/schema";

export const categoryRoutes = new Elysia({ prefix: "/categories" }).get("/", async () => {
  return db.select().from(categories).orderBy(asc(categories.sortOrder));
});
