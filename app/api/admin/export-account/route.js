import { sql } from '@vercel/postgres';
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

    const user = await sql`
      SELECT username_hash, is_permanent, last_active
      FROM users WHERE username_hash = ${targetUsernameHash}
    `;
    if (user.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const messages = await sql`
      SELECT id, sender_hash, sender_encrypted, content,
             attachment_url, attachment_name, attachment_size,
             created_at, expires_at
      FROM messages
      WHERE recipient_hash = ${targetUsernameHash}
      ORDER BY created_at DESC
    `;

    await sql`
      INSERT INTO logs (event_type, client_ip, details)
      VALUES ('admin_export_account', 'admin', ${`exported ${messages.rows.length} messages`})
    `;

    return NextResponse.json({
      account: {
        usernameHash: targetUsernameHash,
        isPermanent: user.rows[0].is_permanent,
        lastActive: user.rows[0].last_active,
      },
      messages: messages.rows,
      exportedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Admin export-account error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
