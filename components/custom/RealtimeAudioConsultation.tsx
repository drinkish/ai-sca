"use client";

import { Buffer } from 'buffer';

import { Mic, MicOff } from 'lucide-react';
import React, { useState, useCallback, useEffect, useRef } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function RealtimeAudioConsultation({ 
  role = 'patient'
}) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<Array<{role: string; content: string}>>([]);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [audioQueue, setAudioQueue] = useState<Array<string>>([]);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  
  const wsRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Handle audio queue playback
  useEffect(() => {
    const playNextInQueue = async () => {
      if (audioQueue.length > 0 && !isPlayingAudio && hasInteracted) {
        setIsPlayingAudio(true);
        const nextAudio = audioQueue[0];
        
        try {
          // Convert base64 to audio
          const audioData = Buffer.from(nextAudio, 'base64');
          const audioBlob = new Blob([audioData], { type: 'audio/wav' });
          const audioUrl = URL.createObjectURL(audioBlob);
          const audio = new Audio(audioUrl);
          
          audio.onended = () => {
            URL.revokeObjectURL(audioUrl);
            setAudioQueue(prev => prev.slice(1));
            setIsPlayingAudio(false);
          };

          await audio.play();
        } catch (error) {
          console.error('Error playing audio:', error);
          setAudioQueue(prev => prev.slice(1));
          setIsPlayingAudio(false);
        }
      }
    };

    playNextInQueue();
  }, [audioQueue, isPlayingAudio, hasInteracted]);

  // Initialize WebSocket connection
  useEffect(() => {
    const wsUrl = 'ws://localhost:3001';
    console.log('Connecting to WebSocket:', wsUrl);
    
    wsRef.current = new WebSocket(wsUrl);

    wsRef.current.onopen = () => {
      console.log('WebSocket Connected');
      setIsConnected(true);
    };

    wsRef.current.onmessage = async (event) => {
      try {
        console.log('Raw message received:', event.data);
        let message;
        
        if (event.data instanceof Blob) {
          const text = await event.data.text();
          message = JSON.parse(text);
        } else {
          message = JSON.parse(event.data);
        }
        
        console.log('Parsed message:', message);

        if (message.error) {
          console.error('Server error:', message.error);
          return;
        }

        // Handle text responses
        if (message.type === 'response.text.delta' && message.delta) {
          setMessages(prev => [...prev, { role: 'assistant', content: message.delta }]);
        }

        // Handle audio responses by adding to queue
        if (message.type === 'response.audio.delta' && message.delta) {
          setAudioQueue(prev => [...prev, message.delta]);
        }
      } catch (error) {
        console.error('Error processing message:', error);
      }
    };

    wsRef.current.onclose = () => {
      console.log('WebSocket Disconnected');
      setIsConnected(false);
      setIsStreaming(false);
    };

    wsRef.current.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
      setIsStreaming(false);
    };

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startStreaming = useCallback(async () => {
    if (!hasInteracted) {
      setHasInteracted(true);
    }
    
    try {
      // Initialize AudioContext on user interaction
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext({
          sampleRate: 24000,
        });
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1,
          sampleRate: 24000,
          sampleSize: 16,
        } 
      });
      streamRef.current = stream;
      
      const source = audioContextRef.current.createMediaStreamSource(stream);
      const processor = audioContextRef.current.createScriptProcessor(4096, 1, 1);
      
      source.connect(processor);
      processor.connect(audioContextRef.current.destination);
      
      processor.onaudioprocess = (e) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          const inputData = e.inputBuffer.getChannelData(0);
          // Convert to 16-bit PCM
          const pcmData = new Int16Array(inputData.length);
          for (let i = 0; i < inputData.length; i++) {
            pcmData[i] = Math.max(-1, Math.min(1, inputData[i])) * 0x7FFF;
          }
          
          // Convert to base64
          const base64Audio = Buffer.from(pcmData.buffer).toString('base64');
          
          const message = {
            type: "conversation.item.create",
            item: {
              type: "message",
              role: "user",
              content: [{
                type: "input_audio",
                audio: base64Audio
              }]
            }
          };
          console.log('Sending audio message');
          wsRef.current.send(JSON.stringify(message));
        }
      };
      
      setIsStreaming(true);
      console.log('Started streaming audio');
    } catch (err) {
      console.error('Error accessing microphone:', err);
    }
  }, []);

  const stopStreaming = useCallback(() => {
    console.log('Stopping stream...');
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    setIsStreaming(false);
    console.log('Stream stopped');
  }, []);

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Audio Consultation - {role === 'patient' ? 'Patient' : 'Examiner'}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col space-y-4">
          {!hasInteracted && (
            <Button
              className="w-full"
              onClick={() => setHasInteracted(true)}
            >
              Click here to enable audio
            </Button>
          )}
          <div className="flex-1 min-h-[400px] border rounded-lg p-4 space-y-4 overflow-y-auto">
            {messages.map((message, index) => (
              <div 
                key={index} 
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[80%] rounded-lg p-3 ${
                  message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                }`}>
                  {message.content}
                </div>
              </div>
            ))}
          </div>
          <div className="flex flex-col items-center gap-4">
            <Button 
              size="lg"
              variant={isStreaming ? "destructive" : "default"}
              className="w-16 h-16 rounded-full"
              onClick={isStreaming ? stopStreaming : startStreaming}
              disabled={!isConnected}
            >
              {isStreaming ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
            </Button>
            <div className="text-center text-sm text-muted-foreground">
              {!isConnected ? 'Connecting...' : 
               isStreaming ? 'Streaming audio...' : 
               'Click to start streaming'}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}