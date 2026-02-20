import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';
import { logEvent, getClientIp } from '@/src/lib/db';

export async function POST(request) {
  const clientIp = getClientIp(request);
  
  try {
    const { 
      senderHash, 
      recipientHash, 
      content, 
      attachmentUrl, 
      attachmentName, 
      attachmentSize 
    } = await request.json();
    
    if (!senderHash || !recipientHash || !content) {
      return NextResponse.json({ error: 'Sender, recipient, and content required' }, { status: 400 });
    }
    
    // Check if recipient exists (silently discard if not)
    const recipient = await sql`
      SELECT id FROM users WHERE username_hash = ${recipientHash}
    `;
    
    if (recipient.rows.length === 0) {
      // Silently accept but don't store (as per spec)
      await logEvent('message_discarded', clientIp, senderHash, null, 'recipient_not_found');
      return NextResponse.json({ success: true, messageId: -1 });
    }
    
    // Insert message (content is already encrypted client-side)
    const result = await sql`
      INSERT INTO messages (
        recipient_hash, 
        sender_hash, 
        content, 
        attachment_url,
        attachment_name,
        attachment_size,
        expires_at
      )
      VALUES (
        ${recipientHash}, 
        ${senderHash}, 
        ${content}, 
        ${attachmentUrl},
        ${attachmentName},
        ${attachmentSize},
        NOW() + INTERVAL '24 hours'
      )
      RETURNING id
    `;
    
    const messageId = result.rows[0].id;
    
    await logEvent(
      'message_sent', 
      clientIp, 
      senderHash, 
      messageId, 
      `to:${recipientHash.substring(0, 8)}...`
    );
    
    return NextResponse.json({ success: true, messageId });
  } catch (error) {
    console.error('Send error:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
