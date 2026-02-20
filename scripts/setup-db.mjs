// Run this script to initialize the database tables
// Usage: node scripts/setup-db.js

import { sql } from '@vercel/postgres';

async function setup() {
  console.log('Setting up database tables...');
  
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username_hash VARCHAR(64) UNIQUE NOT NULL,
        pin_hash VARCHAR(64) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✓ Created users table');

    await sql`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        recipient_hash VARCHAR(64) NOT NULL,
        sender_hash VARCHAR(64) NOT NULL,
        content TEXT NOT NULL,
        attachment_url TEXT,
        attachment_name TEXT,
        attachment_size INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP NOT NULL
      )
    `;
    console.log('✓ Created messages table');

    await sql`
      CREATE TABLE IF NOT EXISTS logs (
        id SERIAL PRIMARY KEY,
        event_type VARCHAR(50) NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        client_ip VARCHAR(45),
        username_hash VARCHAR(64),
        message_id INTEGER,
        details TEXT
      )
    `;
    console.log('✓ Created logs table');

    await sql`CREATE INDEX IF NOT EXISTS idx_messages_recipient ON messages(recipient_hash)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_messages_expires ON messages(expires_at)`;
    console.log('✓ Created indexes');

    console.log('\n✅ Database setup complete!');
  } catch (error) {
    console.error('Error setting up database:', error);
    process.exit(1);
  }
}

setup();
