// app/video-chat/VideoChatClient.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';

interface TavusResponse {
  conversation_id: string;
  conversation_url: string;
  status: string;
}

export default function VideoChatClient() {
  const [isStreaming, setIsStreaming] = useState(false);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [error, setError] = useState<string>('');
  const [conversationUrl, setConversationUrl] = useState<string>('');

  useEffect(() => {
    // Request camera access when component mounts
    const setupCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: true,
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            sampleRate: 44100
          }
        });
        
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
          setIsCameraReady(true);
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setError('Failed to access camera and microphone. Please ensure you have granted the necessary permissions.');
      }
    };

    setupCamera();

    // Cleanup function to stop all tracks when component unmounts
    return () => {
      if (localVideoRef.current?.srcObject) {
        const stream = localVideoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startStreaming = async () => {
    try {
      // Create a new conversation
      const response = await fetch('/api/video-chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('Failed to create conversation');
      }

      const data: TavusResponse = await response.json();
      
      if (data.conversation_url) {
        setConversationUrl(data.conversation_url);
        window.open(data.conversation_url, '_blank', 'width=800,height=600');
        setIsStreaming(true);
        setError('');
      } else {
        throw new Error('No conversation URL received');
      }
    } catch (error) {
      console.error('Error starting stream:', error);
      setError(error instanceof Error ? error.message : 'Failed to start streaming');
    }
  };

  const stopStreaming = () => {
    setIsStreaming(false);
    setConversationUrl('');
  };

  return (
    <div className="space-y-6 p-4">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          {error}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Local video preview */}
        <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        </div>

        {/* Instructions or status */}
        <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
          <div className="flex items-center justify-center h-full p-4">
            <div className="text-center">
              {isStreaming ? (
                <>
                  <p className="text-gray-700 mb-2">Video chat is active in a new window</p>
                  <a 
                    href={conversationUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    Click here if the chat window didn't open
                  </a>
                </>
              ) : (
                <p className="text-gray-500">
                  Click "Start Chat" to begin a video consultation
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-center gap-4">
        <Button
          onClick={isStreaming ? stopStreaming : startStreaming}
          disabled={!isCameraReady}
          className={isStreaming ? 'bg-red-500 hover:bg-red-600' : ''}
        >
          {isStreaming ? 'End Chat' : 'Start Chat'}
        </Button>
      </div>
    </div>
  );
}