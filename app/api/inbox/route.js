import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { usernameHash } = await request.json();
    
    if (!usernameHash) {
      return NextResponse.json({ error: 'Username hash required' }, { status: 400 });
    }
    
    await sql`
      DELETE FROM messages 
      WHERE recipient_hash = ${usernameHash} AND expires_at <= NOW()
    `;
    
    const result = await sql`
      SELECT 
        id, 
        sender_hash,
        sender_encrypted,
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
      senderEncrypted: row.sender_encrypted,
      content: row.content,
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
