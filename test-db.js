// Test Turso database connection and initialize tables
require('dotenv').config();
const { createClient } = require('@libsql/client');
const fs = require('fs');

async function testDatabase() {
  console.log('🚀 Testing Turso database connection...');
  
  try {
    // Create database client
    const client = createClient({
      url: process.env.DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });

    console.log('✅ Database client created');
    console.log('🔗 URL:', process.env.DATABASE_URL);

    // Test basic connection
    const result = await client.execute('SELECT 1 as test');
    console.log('✅ Database connection successful:', result.rows[0]);

    // Read and execute schema
    console.log('📋 Initializing database schema...');
    const schema = fs.readFileSync('./init-db.sql', 'utf8');
    const statements = schema.split(';').filter(stmt => stmt.trim());

    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await client.execute(statement.trim());
          console.log('✅ Executed:', statement.trim().split('\n')[0]);
        } catch (error) {
          console.log('⚠️  Statement already exists or error:', statement.trim().split('\n')[0]);
        }
      }
    }

    // Test table creation by checking if tables exist
    const tables = await client.execute(`
      SELECT name FROM sqlite_master 
      WHERE type='table' 
      AND name NOT LIKE 'sqlite_%'
      ORDER BY name
    `);
    
    console.log('✅ Database tables:', tables.rows.map(row => row.name));

    // Test inserting a user
    const userId = 'test-' + Date.now();
    await client.execute({
      sql: 'INSERT OR REPLACE INTO User (id, email, name) VALUES (?, ?, ?)',
      args: [userId, 'test@airlane.com', 'Test User']
    });
    console.log('✅ Test user created:', userId);

    // Test querying users
    const users = await client.execute('SELECT * FROM User WHERE email = ?', ['test@airlane.com']);
    console.log('✅ User query result:', users.rows[0]);

    console.log('🎉 Database integration successful!');
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  testDatabase();
}

module.exports = { testDatabase };