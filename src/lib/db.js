import { sql } from '@vercel/postgres';

// Initialize database tables
export async function initDatabase() {
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username_hash VARCHAR(64) UNIQUE NOT NULL,
      pin_hash VARCHAR(64) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

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

  // Create indexes if they don't exist
  await sql`
    CREATE INDEX IF NOT EXISTS idx_messages_recipient 
    ON messages(recipient_hash)
  `;
  
  await sql`
    CREATE INDEX IF NOT EXISTS idx_messages_expires 
    ON messages(expires_at)
  `;
}

// Log an event
export async function logEvent(eventType, clientIp, usernameHash = null, messageId = null, details = null) {
  await sql`
    INSERT INTO logs (event_type, client_ip, username_hash, message_id, details)
    VALUES (${eventType}, ${clientIp}, ${usernameHash}, ${messageId}, ${details})
  `;
}

// Clean up expired messages
export async function cleanupExpiredMessages() {
  const result = await sql`
    DELETE FROM messages 
    WHERE expires_at <= NOW()
    RETURNING id, attachment_url
  `;
  return result.rows;
}

// Get client IP from request
export function getClientIp(request) {
  return request.headers.get('x-forwarded-for')?.split(',')[0] || 
         request.headers.get('x-real-ip') || 
         'unknown';
}
