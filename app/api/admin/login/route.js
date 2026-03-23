import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { adminUsernameHash, pinHash } = await request.json();

    if (!adminUsernameHash || !pinHash) {
      return NextResponse.json({ error: 'Credentials required' }, { status: 400 });
    }

    const result = await sql`
      SELECT pin_hash FROM admins WHERE username_hash = ${adminUsernameHash}
    `;

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    if (result.rows[0].pin_hash !== pinHash) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    return NextResponse.json({ authenticated: true });
  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
