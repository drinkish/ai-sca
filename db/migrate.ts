import fs from 'fs';
import path from 'path';

import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

config({
  path: process.env.NODE_ENV === 'production' ? undefined : '.env.local',
});

const runMigrate = async () => {
  if (!process.env.POSTGRES_URL) {
    throw new Error("POSTGRES_URL is not defined");
  }

  const sql = postgres(process.env.POSTGRES_URL, { max: 1 });
  const db = drizzle(sql);

  console.log("⏳ Running migrations...");

  // Log the migration files in the directory
  const migrationsFolder = "./lib/drizzle";
  console.log("Migration files in directory:");
  fs.readdirSync(migrationsFolder).forEach(file => {
    console.log(file);
  });

  const start = Date.now();
  try {
    const migrations = await migrate(db, { migrationsFolder });
    console.log("Applied migrations:", migrations);
  } catch (error) {
    console.error("Migration failed:", error);
  }
  const end = Date.now();

  console.log("✅ Migrations completed in", end - start, "ms");

  // Log the current schema
  try {
    const schemaQuery = `
      SELECT table_name, column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public'
    `;
    const tables = await sql.unsafe(schemaQuery);
    console.log("Current schema:", JSON.stringify(tables, null, 2));
  } catch (error) {
    console.error("Failed to fetch schema:", error);
  }

  await sql.end();
  process.exit(0);
};

runMigrate().catch((err) => {
  console.error("❌ Migration failed");
  console.error(err);
  process.exit(1);
});