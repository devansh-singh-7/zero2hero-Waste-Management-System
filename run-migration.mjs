import { migrate } from 'drizzle-orm/neon-http/migrator';
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
config({ path: path.resolve(process.cwd(), '.env.local') });

async function main() {
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
        console.error('❌ DATABASE_URL environment variable is not set');
        console.error('   Please ensure .env.local file exists with DATABASE_URL');
        process.exit(1);
    }

    console.log('🔄 Starting database migration...');
    console.log('   Database: Neon PostgreSQL (HTTP driver)');

    try {
        const sql = neon(databaseUrl);
        const db = drizzle(sql);

        await migrate(db, { migrationsFolder: './drizzle' });

        console.log('✅ Migrations completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

main();
