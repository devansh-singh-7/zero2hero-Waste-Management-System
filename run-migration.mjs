import postgres from 'postgres';
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

// Load environment variables from .env.local
config({ path: path.resolve(process.cwd(), '.env.local') });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sql = postgres(process.env.DATABASE_URL, { ssl: true });

async function runMigration() {
  try {
    // Read the SQL file
    const sqlContent = await fs.readFile(path.join(__dirname, 'drizzle', '0009_recreate_users_with_password.sql'), 'utf-8');
    
    // Run the SQL
    await sql.unsafe(sqlContent);
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await sql.end();
  }
}

runMigration();
