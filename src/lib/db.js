import { sql } from '@vercel/postgres';

export async function logEvent(eventType, clientIp, usernameHash = null, messageId = null, details = null) {
  await sql`
    INSERT INTO logs (event_type, client_ip, username_hash, message_id, details)
    VALUES (${eventType}, ${clientIp}, ${usernameHash}, ${messageId}, ${details})
  `;
}

export function getClientIp(request) {
  return request.headers.get('x-forwarded-for')?.split(',')[0] || 
         request.headers.get('x-real-ip') || 
         'unknown';
}
