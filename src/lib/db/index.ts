import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Database client and connection initialization
let client: ReturnType<typeof postgres> | null = null;
let db: ReturnType<typeof drizzle> | null = null;

// Initialize database connection
if (typeof window === 'undefined') {
  try {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL is not set');
    }

    // Create the postgres client with better connection handling
    client = postgres(connectionString, {
      ssl: true,
      max: 3,
      idle_timeout: 30,
      connect_timeout: 15,
      prepare: false,
      connection: {
        application_name: "zero-to-hero-app"
      }
    });

    // Create the drizzle instance
    db = drizzle(client, { schema });

    // Log success
    console.log('Database connection initialized');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    // Don't throw here, let the query fail if db is not initialized
  }
}

export { db }
export { schema }
