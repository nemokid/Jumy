import { sql } from '@vercel/postgres';
import { del } from '@vercel/blob';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
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
    
    return NextResponse.json({ success: true, deleted: expired.rows.length });
  } catch (error) {
    console.error('Cleanup error:', error);
    return NextResponse.json({ error: 'Cleanup failed' }, { status: 500 });
  }
}
