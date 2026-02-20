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
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    return NextResponse.json({ exists: true });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
