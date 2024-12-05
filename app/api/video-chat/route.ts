// app/api/video-chat/route.ts
import { NextResponse } from 'next/server';

const TAVUS_API_KEY = process.env.TAVUS_API_KEY;
const TAVUS_AVATAR_ID = process.env.TAVUS_AVATAR_ID;

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as Blob;

    // 1. First, upload the audio to Tavus
    const uploadResponse = await fetch('https://api.tavus.io/v1/uploads', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TAVUS_API_KEY}`,
      },
      body: audioFile
    });

    const { uploadId } = await uploadResponse.json();

    // 2. Create a video generation request
    const generationResponse = await fetch('https://api.tavus.io/v1/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TAVUS_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        avatarId: TAVUS_AVATAR_ID,
        uploadId: uploadId,
        config: {
          background: 'office', // or any other background setting
          output: {
            format: 'mp4',
            quality: 'high',
          }
        }
      })
    });

    const { generationId } = await generationResponse.json();

    // 3. Poll for video completion
    let videoUrl = null;
    let attempts = 0;
    while (!videoUrl && attempts < 30) {
      const statusResponse = await fetch(`https://api.tavus.io/v1/generations/${generationId}`, {
        headers: {
          'Authorization': `Bearer ${TAVUS_API_KEY}`,
        }
      });

      const status = await statusResponse.json();
      
      if (status.status === 'completed') {
        videoUrl = status.videoUrl;
        break;
      }

      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds between polls
      attempts++;
    }

    if (!videoUrl) {
      throw new Error('Video generation timed out');
    }

    return NextResponse.json({ videoUrl, status: 'completed' });
  } catch (error) {
    console.error('Error processing video:', error);
    return NextResponse.json({ error: 'Failed to process video' }, { status: 500 });
  }
}