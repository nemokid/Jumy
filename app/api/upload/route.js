import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.arrayBuffer();
    
    // Check file size (10MB limit)
    if (body.byteLength > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 });
    }
    
    // Generate a random filename (no identifying info)
    const filename = `${crypto.randomUUID()}.enc`;
    
    // Upload to Vercel Blob
    const blob = await put(filename, body, {
      access: 'public',
      addRandomSuffix: false,
    });
    
    return NextResponse.json({ url: blob.url });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}