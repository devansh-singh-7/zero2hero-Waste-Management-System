import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import * as schema from "./schema";

export type Database = NeonHttpDatabase<typeof schema>;

let db: Database | undefined;
let sqlClient: ReturnType<typeof neon> | undefined;

async function initializeDB(): Promise<Database> {
  if (db) return db;
  
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not defined. Please set it in your environment.");
  }

  try {
    console.log("Initializing database connection...");
    sqlClient = neon(process.env.DATABASE_URL);
    
    await sqlClient`SELECT 1`;
    
    const initialized = drizzle(sqlClient, { schema }) as Database;
    console.log("Database connection successful");
    
    db = initialized;
    return initialized;
  } catch (error) {
    console.error("Failed to initialize database:", error);
    throw new Error("Database initialization failed");
  }
}

void initializeDB().catch(console.error);

export { db, sqlClient, initializeDB };
