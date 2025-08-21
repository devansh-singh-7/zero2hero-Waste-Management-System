import pg from 'pg';
import fs from 'fs/promises';

const { Client } = pg;

const CONNECTION_STRING = process.env.DATABASE_URL;

async function runFileSQL(client, path) {
  const sql = await fs.readFile(path, 'utf8');
  await client.query(sql);
}

async function migrate() {
  const client = new Client({ connectionString: CONNECTION_STRING });
  try {
    await client.connect();
    console.log('Connected to database');

    // Apply migrations in order
    const migrations = [
      '0000_special_silver_centurion.sql',
      '0001_nextauth_tables.sql',
      '0003_allow_anonymous_reports.sql',
      '0004_fix_users_table.sql'
    ];

    for (const migration of migrations) {
      try {
        console.log(`Applying migration: ${migration}`);
        await runFileSQL(client, `drizzle/${migration}`);
        console.log(`Successfully applied: ${migration}`);
      } catch (e) {
        console.warn(`Error applying ${migration}:`, e.message);
        // Continue with next migration
      }
    }

    console.log('All migrations completed');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

migrate();