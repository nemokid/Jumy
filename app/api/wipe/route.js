import { sql } from '@vercel/postgres';
import { del } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { logEvent, getClientIp } from '@/src/lib/db';

export async function POST(request) {
  const clientIp = getClientIp(request);
  
  try {
    const { usernameHash, pinHash } = await request.json();
    
    if (!usernameHash || !pinHash) {
      return NextResponse.json({ error: 'Username and PIN required' }, { status: 400 });
    }
    
    const user = await sql`
      SELECT pin_hash FROM users WHERE username_hash = ${usernameHash}
    `;
    
    if (user.rows.length === 0 || user.rows[0].pin_hash !== pinHash) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }
    
    const attachments = await sql`
      SELECT attachment_url FROM messages 
      WHERE recipient_hash = ${usernameHash} AND attachment_url IS NOT NULL
    `;
    
    for (const row of attachments.rows) {
      try {
        await del(row.attachment_url);
      } catch (e) {
        console.error('Failed to delete blob:', e);
      }
    }
    
    await sql`DELETE FROM messages WHERE recipient_hash = ${usernameHash}`;
    await sql`DELETE FROM users WHERE username_hash = ${usernameHash}`;
    
    await logEvent('account_wiped', clientIp, usernameHash);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Wipe error:', error);
    return NextResponse.json({ error: 'Failed to wipe account' }, { status: 500 });
  }
}
