import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

async function verifyAdmin(adminUsernameHash, pinHash) {
  const result = await sql`
    SELECT pin_hash FROM admins WHERE username_hash = ${adminUsernameHash}
  `;
  return result.rows.length > 0 && result.rows[0].pin_hash === pinHash;
}

async function getLogsTimestampColumn() {
  const schema = await sql`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'logs'
  `;
  const cols = new Set(schema.rows.map(r => r.column_name));
  for (const candidate of ['created_at', 'timestamp', 'logged_at', 'ts', 'created', 'time']) {
    if (cols.has(candidate)) return candidate;
  }
  return null;
}

async function getMessageSentCounts(tsCol) {
  if (tsCol === 'created_at') {
    const [h24, d7, d30, d90] = await Promise.all([
      sql`SELECT COUNT(*) FROM logs WHERE event_type = 'message_sent' AND created_at >= NOW() - INTERVAL '24 hours'`,
      sql`SELECT COUNT(*) FROM logs WHERE event_type = 'message_sent' AND created_at >= NOW() - INTERVAL '7 days'`,
      sql`SELECT COUNT(*) FROM logs WHERE event_type = 'message_sent' AND created_at >= NOW() - INTERVAL '30 days'`,
      sql`SELECT COUNT(*) FROM logs WHERE event_type = 'message_sent' AND created_at >= NOW() - INTERVAL '90 days'`,
    ]);
    return [h24, d7, d30, d90].map(r => parseInt(r.rows[0].count));
  }

  if (tsCol === 'timestamp') {
    const [h24, d7, d30, d90] = await Promise.all([
      sql`SELECT COUNT(*) FROM logs WHERE event_type = 'message_sent' AND "timestamp" >= NOW() - INTERVAL '24 hours'`,
      sql`SELECT COUNT(*) FROM logs WHERE event_type = 'message_sent' AND "timestamp" >= NOW() - INTERVAL '7 days'`,
      sql`SELECT COUNT(*) FROM logs WHERE event_type = 'message_sent' AND "timestamp" >= NOW() - INTERVAL '30 days'`,
      sql`SELECT COUNT(*) FROM logs WHERE event_type = 'message_sent' AND "timestamp" >= NOW() - INTERVAL '90 days'`,
    ]);
    return [h24, d7, d30, d90].map(r => parseInt(r.rows[0].count));
  }

  if (tsCol === 'logged_at') {
    const [h24, d7, d30, d90] = await Promise.all([
      sql`SELECT COUNT(*) FROM logs WHERE event_type = 'message_sent' AND logged_at >= NOW() - INTERVAL '24 hours'`,
      sql`SELECT COUNT(*) FROM logs WHERE event_type = 'message_sent' AND logged_at >= NOW() - INTERVAL '7 days'`,
      sql`SELECT COUNT(*) FROM logs WHERE event_type = 'message_sent' AND logged_at >= NOW() - INTERVAL '30 days'`,
      sql`SELECT COUNT(*) FROM logs WHERE event_type = 'message_sent' AND logged_at >= NOW() - INTERVAL '90 days'`,
    ]);
    return [h24, d7, d30, d90].map(r => parseInt(r.rows[0].count));
  }

  // No recognisable timestamp column — fall back to total count only
  const total = await sql`SELECT COUNT(*) FROM logs WHERE event_type = 'message_sent'`;
  const count = parseInt(total.rows[0].count);
  return [count, count, count, count];
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

    const [tsCol, userStats, msgStats] = await Promise.all([
      getLogsTimestampColumn(),
      Promise.all([
        sql`SELECT COUNT(*) FROM users`,
        sql`SELECT COUNT(*) FROM users WHERE is_permanent = TRUE`,
        sql`SELECT COUNT(*) FROM users WHERE last_active >= NOW() - INTERVAL '24 hours'`,
        sql`SELECT COUNT(*) FROM users WHERE last_active >= NOW() - INTERVAL '7 days'`,
        sql`SELECT COUNT(*) FROM users WHERE last_active >= NOW() - INTERVAL '30 days'`,
      ]),
      Promise.all([
        sql`SELECT COUNT(*) FROM messages WHERE attachment_url IS NOT NULL`,
        sql`SELECT COALESCE(SUM(attachment_size), 0) AS total FROM messages WHERE attachment_size IS NOT NULL`,
      ]),
    ]);

    const [sent24h, sent7d, sent30d, sent90d] = await getMessageSentCounts(tsCol);

    const [totalUsers, permanentUsers, activeUsers24h, activeUsers7d, activeUsers30d] = userStats;
    const [msgsWithAttachments, storageUsed] = msgStats;

    return NextResponse.json({
      users: {
        total: parseInt(totalUsers.rows[0].count),
        permanent: parseInt(permanentUsers.rows[0].count),
        active24h: parseInt(activeUsers24h.rows[0].count),
        active7d: parseInt(activeUsers7d.rows[0].count),
        active30d: parseInt(activeUsers30d.rows[0].count),
      },
      messages: {
        sent24h,
        sent7d,
        sent30d,
        sent90d,
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
