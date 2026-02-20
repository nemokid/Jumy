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
    
    const result = await sql`
      SELECT pin_hash FROM users WHERE username_hash = ${usernameHash}
    `;
    
    if (result.rows.length === 0) {
      await logEvent('login_attempt', clientIp, usernameHash, null, 'fake_login_no_user');
      return NextResponse.json({ authenticated: true, fakeMode: true });
    }
    
    const isValidPin = result.rows[0].pin_hash === pinHash;
    
    await logEvent(
      'login_attempt', 
      clientIp, 
      usernameHash, 
      null, 
      isValidPin ? 'successful' : 'fake_login_wrong_pin'
    );
    
    return NextResponse.json({ 
      authenticated: true, 
      fakeMode: !isValidPin 
    });
  } catch (error) {
    console.error('Verify PIN error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
