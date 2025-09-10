import { db } from './src/lib/db/index.js';
import { sql } from 'drizzle-orm';

async function runMigration() {
  try {
    console.log('Starting database migration...');
    
    // Check if password_hash column exists and password doesn't
    const checkColumns = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name IN ('password_hash', 'password', 'public_profile_visible')
    `);
    
    const columns = checkColumns.map(row => row.column_name);
    console.log('Existing columns:', columns);
    
    // Only rename if password_hash exists and password doesn't
    if (columns.includes('password_hash') && !columns.includes('password')) {
      console.log('Renaming password_hash to password...');
      await db.execute(sql`ALTER TABLE users RENAME COLUMN password_hash TO password`);
    }
    
    // Add new settings columns if they don't exist
    const settingsColumns = [
      'public_profile_visible',
      'profile_searchable', 
      'show_real_name',
      'personal_stats_visible',
      'data_sharing',
      'environmental_tracking',
      'collection_history_retention'
    ];
    
    for (const columnName of settingsColumns) {
      if (!columns.includes(columnName)) {
        console.log(`Adding column: ${columnName}`);
        
        switch (columnName) {
          case 'public_profile_visible':
          case 'profile_searchable':
          case 'personal_stats_visible':
          case 'environmental_tracking':
            await db.execute(sql.raw(`ALTER TABLE users ADD COLUMN ${columnName} BOOLEAN DEFAULT true NOT NULL`));
            break;
          case 'show_real_name':
            await db.execute(sql.raw(`ALTER TABLE users ADD COLUMN ${columnName} BOOLEAN DEFAULT false NOT NULL`));
            break;
          case 'data_sharing':
            await db.execute(sql.raw(`ALTER TABLE users ADD COLUMN ${columnName} VARCHAR(20) DEFAULT 'anonymous' NOT NULL`));
            break;
          case 'collection_history_retention':
            await db.execute(sql.raw(`ALTER TABLE users ADD COLUMN ${columnName} VARCHAR(20) DEFAULT '1year' NOT NULL`));
            break;
        }
      }
    }
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

runMigration();
