import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  const connection = postgres(process.env.DATABASE_URL, { ssl: true, max: 1 });
  const db = drizzle(connection);

  console.log('Starting migration...');
  await migrate(db, { migrationsFolder: './drizzle' });
  console.log('Migration completed');

  await connection.end();
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
