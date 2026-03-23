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
    const { adminUsernameHash, pinHash } = await request.json();

    if (!adminUsernameHash || !pinHash) {
      return NextResponse.json({ error: 'Credentials required' }, { status: 400 });
    }

    if (!(await verifyAdmin(adminUsernameHash, pinHash))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [
      totalUsers,
      permanentUsers,
      activeUsers24h,
      activeUsers7d,
      activeUsers30d,
      msgSent24h,
      msgSent7d,
      msgSent30d,
      msgSent90d,
      msgsWithAttachments,
      storageUsed,
    ] = await Promise.all([
      sql`SELECT COUNT(*) FROM users`,
      sql`SELECT COUNT(*) FROM users WHERE is_permanent = TRUE`,
      sql`SELECT COUNT(*) FROM users WHERE last_active >= NOW() - INTERVAL '24 hours'`,
      sql`SELECT COUNT(*) FROM users WHERE last_active >= NOW() - INTERVAL '7 days'`,
      sql`SELECT COUNT(*) FROM users WHERE last_active >= NOW() - INTERVAL '30 days'`,
      sql`SELECT COUNT(*) FROM logs WHERE event_type = 'message_sent' AND timestamp >= NOW() - INTERVAL '24 hours'`,
      sql`SELECT COUNT(*) FROM logs WHERE event_type = 'message_sent' AND timestamp >= NOW() - INTERVAL '7 days'`,
      sql`SELECT COUNT(*) FROM logs WHERE event_type = 'message_sent' AND timestamp >= NOW() - INTERVAL '30 days'`,
      sql`SELECT COUNT(*) FROM logs WHERE event_type = 'message_sent' AND timestamp >= NOW() - INTERVAL '90 days'`,
      sql`SELECT COUNT(*) FROM messages WHERE attachment_url IS NOT NULL`,
      sql`SELECT COALESCE(SUM(attachment_size), 0) AS total FROM messages WHERE attachment_size IS NOT NULL`,
    ]);

    return NextResponse.json({
      users: {
        total: parseInt(totalUsers.rows[0].count),
        permanent: parseInt(permanentUsers.rows[0].count),
        active24h: parseInt(activeUsers24h.rows[0].count),
        active7d: parseInt(activeUsers7d.rows[0].count),
        active30d: parseInt(activeUsers30d.rows[0].count),
      },
      messages: {
        sent24h: parseInt(msgSent24h.rows[0].count),
        sent7d: parseInt(msgSent7d.rows[0].count),
        sent30d: parseInt(msgSent30d.rows[0].count),
        sent90d: parseInt(msgSent90d.rows[0].count),
        withAttachments: parseInt(msgsWithAttachments.rows[0].count),
      },
      storage: {
        totalBytes: parseInt(storageUsed.rows[0].total),
      },
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
