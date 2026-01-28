import { config } from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
config({ path: path.resolve(process.cwd(), '.env.local') });

export default {
    dialect: "postgresql",
    schema: "./src/lib/db/schema.ts",
    out: "./drizzle",
    dbCredentials: {
      url: process.env.DATABASE_URL
    },
  };
  