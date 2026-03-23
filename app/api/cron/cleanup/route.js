import { sql } from '@vercel/postgres';
import { del } from '@vercel/blob';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // --- Delete expired messages ---
    const expired = await sql`
      SELECT id, attachment_url FROM messages
      WHERE expires_at <= NOW()
    `;

    for (const row of expired.rows) {
      if (row.attachment_url) {
        try {
          await del(row.attachment_url);
        } catch (e) {
          console.error('Failed to delete blob:', e);
        }
      }
    }

    await sql`DELETE FROM messages WHERE expires_at <= NOW()`;

    if (expired.rows.length > 0) {
      await sql`
        INSERT INTO logs (event_type, client_ip, details)
        VALUES ('cleanup', 'cron', ${`deleted ${expired.rows.length} messages`})
      `;
    }

    // --- Delete inactive non-permanent accounts (7+ days inactive) ---
    const inactiveUsers = await sql`
      SELECT username_hash FROM users
      WHERE is_permanent = FALSE
        AND (last_active IS NULL OR last_active <= NOW() - INTERVAL '7 days')
    `;

    let deletedUsers = 0;
    for (const user of inactiveUsers.rows) {
      const userHash = user.username_hash;

      // Fetch all attachments for this user's received messages
      const attachments = await sql`
        SELECT attachment_url FROM messages
        WHERE recipient_hash = ${userHash} AND attachment_url IS NOT NULL
      `;

      for (const row of attachments.rows) {
        try {
          await del(row.attachment_url);
        } catch (e) {
          console.error('Failed to delete user blob:', e);
        }
      }

      // Delete their received messages
      await sql`DELETE FROM messages WHERE recipient_hash = ${userHash}`;

      // Delete the user
      await sql`DELETE FROM users WHERE username_hash = ${userHash}`;

      deletedUsers++;
    }

    if (deletedUsers > 0) {
      await sql`
        INSERT INTO logs (event_type, client_ip, details)
        VALUES ('cleanup', 'cron', ${`deleted ${deletedUsers} inactive accounts`})
      `;
    }

    return NextResponse.json({
      success: true,
      deletedMessages: expired.rows.length,
      deletedUsers
    });
  } catch (error) {
    console.error('Cleanup error:', error);
    return NextResponse.json({ error: 'Cleanup failed' }, { status: 500 });
  }
}
