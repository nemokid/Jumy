import { sql } from '@vercel/postgres';
import { del } from '@vercel/blob';
import { NextResponse } from 'next/server';

async function verifyAdmin(adminUsernameHash, pinHash) {
  const result = await sql`
    SELECT pin_hash FROM admins WHERE username_hash = ${adminUsernameHash}
  `;
  return result.rows.length > 0 && result.rows[0].pin_hash === pinHash;
}

export async function POST(request) {
  try {
    const { adminUsernameHash, pinHash, targetUsernameHash } = await request.json();

    if (!adminUsernameHash || !pinHash || !targetUsernameHash) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!(await verifyAdmin(adminUsernameHash, pinHash))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await sql`SELECT username_hash FROM users WHERE username_hash = ${targetUsernameHash}`;
    if (user.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const attachments = await sql`
      SELECT attachment_url FROM messages
      WHERE recipient_hash = ${targetUsernameHash} AND attachment_url IS NOT NULL
    `;

    for (const row of attachments.rows) {
      try {
        await del(row.attachment_url);
      } catch (e) {
        console.error('Failed to delete blob:', e);
      }
    }

    await sql`DELETE FROM messages WHERE recipient_hash = ${targetUsernameHash}`;
    await sql`DELETE FROM users WHERE username_hash = ${targetUsernameHash}`;

    await sql`
      INSERT INTO logs (event_type, client_ip, details)
      VALUES ('admin_delete_account', 'admin', 'account deleted by admin')
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin delete-account error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
