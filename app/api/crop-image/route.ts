import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { getStorage } from 'firebase-admin/storage';
import { v4 as uuid } from 'uuid';

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export async function POST(req: NextRequest) {
  try {
    const { imageUrl, crop } = await req.json();
    if (!imageUrl || !crop) {
      return NextResponse.json({ error: 'Image URL and crop area are required' }, { status: 400 });
    }

    // Download the image
    const response = await fetch(imageUrl);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Get image dimensions
    const metadata = await sharp(buffer).metadata();
    if (!metadata.width || !metadata.height) {
      throw new Error('Could not get image dimensions');
    }

    // Convert relative crop values to absolute pixels
    const cropArea: CropArea = {
      x: Math.round(crop.x * metadata.width),
      y: Math.round(crop.y * metadata.height),
      width: Math.round(crop.width * metadata.width),
      height: Math.round(crop.height * metadata.height)
    };

    // Crop and resize the image
    const croppedBuffer = await sharp(buffer)
      .extract({
        left: cropArea.x,
        top: cropArea.y,
        width: cropArea.width,
        height: cropArea.height
      })
      .resize(400, 400, { fit: 'contain' })
      .toBuffer();

    // Upload to Firebase Storage
    const storage = getStorage();
    const bucket = storage.bucket();
    const filename = `logos/${uuid()}.png`;
    const fileRef = bucket.file(filename);

    await fileRef.save(croppedBuffer, {
      metadata: {
        contentType: 'image/png',
      },
    });

    // Get public URL
    const [url] = await fileRef.getSignedUrl({
      action: 'read',
      expires: '03-01-2500', // Far future expiration
    });

    return NextResponse.json({ url });
  } catch (error) {
    console.error('Error cropping image:', error);
    return NextResponse.json(
      { error: 'Failed to crop image' },
      { status: 500 }
    );
  }
} 