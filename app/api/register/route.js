import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';
import { logEvent, getClientIp } from '@/src/lib/db';

export async function POST(request) {
  const clientIp = getClientIp(request);
  
  try {
    const { usernameHash, pinHash } = await request.json();
    
    if (!usernameHash || !pinHash) {
      return NextResponse.json({ error: 'Username and PIN hashes required' }, { status: 400 });
    }
    
    // Check if username already exists
    const existing = await sql`
      SELECT id FROM users WHERE username_hash = ${usernameHash}
    `;
    
    if (existing.rows.length > 0) {
      return NextResponse.json({ error: 'Username already exists' }, { status: 409 });
    }
    
    // Create user
    await sql`
      INSERT INTO users (username_hash, pin_hash)
      VALUES (${usernameHash}, ${pinHash})
    `;
    
    await logEvent('user_registered', clientIp, usernameHash);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }
}
