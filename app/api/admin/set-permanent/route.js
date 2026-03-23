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
    const { adminUsernameHash, pinHash, targetUsernameHash, isPermanent } = await request.json();

    if (!adminUsernameHash || !pinHash || !targetUsernameHash || isPermanent === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!(await verifyAdmin(adminUsernameHash, pinHash))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await sql`
      UPDATE users SET is_permanent = ${isPermanent}
      WHERE username_hash = ${targetUsernameHash}
      RETURNING username_hash
    `;

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, isPermanent });
  } catch (error) {
    console.error('Admin set-permanent error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
