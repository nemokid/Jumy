import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { usernameHash } = await request.json();
    
    if (!usernameHash) {
      return NextResponse.json({ error: 'Username hash required' }, { status: 400 });
    }
    
    // Delete expired messages first
    await sql`
      DELETE FROM messages 
      WHERE recipient_hash = ${usernameHash} AND expires_at <= NOW()
    `;
    
    // Get valid messages (content stays encrypted - decryption happens client-side)
    const result = await sql`
      SELECT 
        id, 
        sender_hash, 
        content, 
        attachment_url,
        attachment_name,
        attachment_size,
        created_at, 
        expires_at
      FROM messages 
      WHERE recipient_hash = ${usernameHash} AND expires_at > NOW()
      ORDER BY created_at DESC
    `;
    
    const messages = result.rows.map(row => ({
      id: row.id,
      senderHash: row.sender_hash,
      content: row.content, // Still encrypted
      attachmentUrl: row.attachment_url,
      attachmentName: row.attachment_name,
      attachmentSize: row.attachment_size,
      hasAttachment: !!row.attachment_url,
      createdAt: row.created_at,
      expiresAt: row.expires_at
    }));
    
    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Inbox error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
