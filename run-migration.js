// Migration script to add projectContext column to Diagram table
const { createClient } = require('@libsql/client');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  console.log('🔄 Starting database migration...');

  // Check for required environment variables
  const dbUrl = process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!dbUrl) {
    console.error('❌ Error: TURSO_DATABASE_URL or DATABASE_URL environment variable is required');
    process.exit(1);
  }

  console.log('✅ Database URL found');
  console.log('✅ Auth token:', authToken ? 'present' : 'not present');

  const client = createClient({
    url: dbUrl,
    authToken: authToken,
  });

  try {
    // Check if the column already exists
    console.log('🔍 Checking if projectContext column already exists...');

    try {
      const testResult = await client.execute({
        sql: 'SELECT projectContext FROM Diagram LIMIT 1',
        args: []
      });
      console.log('✅ Column already exists! No migration needed.');
      return;
    } catch (error) {
      if (error.message.includes('no such column')) {
        console.log('📝 Column does not exist. Proceeding with migration...');
      } else {
        throw error;
      }
    }

    // Run the migration
    console.log('🔧 Adding projectContext column to Diagram table...');

    await client.execute({
      sql: 'ALTER TABLE Diagram ADD COLUMN projectContext TEXT',
      args: []
    });

    console.log('✅ Migration completed successfully!');

    // Verify the change
    console.log('🔍 Verifying the migration...');
    const verifyResult = await client.execute({
      sql: 'SELECT projectContext FROM Diagram LIMIT 1',
      args: []
    });

    console.log('✅ Verification successful! Column is accessible.');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Error details:', error);
    process.exit(1);
  } finally {
    client.close();
  }
}

runMigration().then(() => {
  console.log('🎉 Migration script completed');
  process.exit(0);
}).catch(error => {
  console.error('💥 Unexpected error:', error);
  process.exit(1);
});
