import { sql } from '@vercel/postgres';
import { del } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { logEvent, getClientIp } from '@/src/lib/db';

export async function POST(request) {
  const clientIp = getClientIp(request);
  
  try {
    const { usernameHash, messageId } = await request.json();
    
    if (!usernameHash || !messageId) {
      return NextResponse.json({ error: 'Username and message ID required' }, { status: 400 });
    }
    
    const message = await sql`
      SELECT attachment_url FROM messages 
      WHERE id = ${messageId} AND recipient_hash = ${usernameHash}
    `;
    
    if (message.rows.length > 0) {
      if (message.rows[0].attachment_url) {
        try {
          await del(message.rows[0].attachment_url);
        } catch (e) {
          console.error('Failed to delete blob:', e);
        }
      }
      
      await sql`
        DELETE FROM messages 
        WHERE id = ${messageId} AND recipient_hash = ${usernameHash}
      `;
      
      await logEvent('message_deleted', clientIp, usernameHash, messageId, 'user_deleted');
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json({ error: 'Failed to delete message' }, { status: 500 });
  }
}
