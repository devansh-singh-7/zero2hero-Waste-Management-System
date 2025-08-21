import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  const queryClient = postgres(process.env.DATABASE_URL);
  const db = drizzle(queryClient);

  // Query to get table information
  const result = await queryClient`
    SELECT column_name, data_type, column_default, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'users'
    ORDER BY ordinal_position;
  `;

  console.log('Users table structure:');
  console.table(result);

  await queryClient.end();
}

main().catch(console.error);
