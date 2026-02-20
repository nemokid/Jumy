import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.arrayBuffer();
    
    if (body.byteLength > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 });
    }
    
    const filename = `${crypto.randomUUID()}.enc`;
    
    const blob = await put(filename, body, {
      addRandomSuffix: false,
    });
    
    return NextResponse.json({ url: blob.url });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}