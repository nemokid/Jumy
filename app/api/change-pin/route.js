import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';
import { logEvent, getClientIp } from '@/src/lib/db';

export async function POST(request) {
  const clientIp = getClientIp(request);
  
  try {
    const { usernameHash, oldPinHash, newPinHash } = await request.json();
    
    if (!usernameHash || !oldPinHash || !newPinHash) {
      return NextResponse.json({ error: 'All fields required' }, { status: 400 });
    }
    
    const user = await sql`
      SELECT pin_hash FROM users WHERE username_hash = ${usernameHash}
    `;
    
    if (user.rows.length === 0 || user.rows[0].pin_hash !== oldPinHash) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }
    
    await sql`
      UPDATE users SET pin_hash = ${newPinHash} WHERE username_hash = ${usernameHash}
    `;
    
    await logEvent('pin_changed', clientIp, usernameHash);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Change PIN error:', error);
    return NextResponse.json({ error: 'Failed to change PIN' }, { status: 500 });
  }
}
