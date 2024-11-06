import { NextResponse } from 'next/server';
import { ListObjectsV2Command } from '@aws-sdk/client-s3';
import { r2Client } from '@/utils/r2-client';

export async function GET() {
  try {
    const { Contents = [] } = await r2Client.send(
      new ListObjectsV2Command({
        Bucket: process.env.CLOUDFLARE_R2_BUCKET,
      })
    );

    const files = Contents.map((item) => ({
      name: item.Key,
      size: item.Size,
      lastModified: item.LastModified?.toISOString(),
      url: `${process.env.CLOUDFLARE_R2_PUBLIC_URL}/${item.Key}`,
    }));

    return NextResponse.json({ files });
  } catch (error) {
    console.error('List error:', error);
    return NextResponse.json(
      { error: 'Failed to list files' },
      { status: 500 }
    );
  }
}
