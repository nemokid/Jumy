import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { usernameHash } = await request.json();
    
    if (!usernameHash) {
      return NextResponse.json({ error: 'Username hash required' }, { status: 400 });
    }
    
    const result = await sql`
      SELECT id FROM users WHERE username_hash = ${usernameHash}
    `;
    
    return NextResponse.json({ exists: result.rows.length > 0 });
  } catch (error) {
    console.error('Check username error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
