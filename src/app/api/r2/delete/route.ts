import { NextResponse } from 'next/server';
import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import { r2Client } from '@/utils/r2-client';

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const file = searchParams.get('file');

    if (!file) {
      return NextResponse.json(
        { error: 'No file specified' },
        { status: 400 }
      );
    }

    await r2Client.send(
      new DeleteObjectCommand({
        Bucket: process.env.CLOUDFLARE_R2_BUCKET,
        Key: file,
      })
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete file' },
      { status: 500 }
    );
  }
}
