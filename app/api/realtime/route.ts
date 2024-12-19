import { WebSocketServer, WebSocket as WSWebSocket } from 'ws';
import { NextRequest } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY is not defined');
}

export async function GET(req: NextRequest) {
  if (!req.headers.get('upgrade')?.includes('websocket')) {
    return new Response('Expected Upgrade: websocket', { status: 426 });
  }

  try {
    const wss = new WebSocketServer({ noServer: true });

    // @ts-ignore - Next.js types don't include socket
    const socket = req.socket;
    const head = Buffer.from([]);

    await new Promise((resolve) => {
      wss.handleUpgrade(req as any, socket, head, (ws) => {
        wss.emit('connection', ws);
        resolve(ws);
      });
    });

    wss.on('connection', (ws) => {
      console.log('Client connected');

      ws.on('message', async (data) => {
        try {
          const wsOpenAI = new WSWebSocket("wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024", {
            headers: {
              "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
              "OpenAI-Beta": "realtime=v1",
            }
          });

          wsOpenAI.on('open', () => {
            console.log('Connected to OpenAI');
            wsOpenAI.send(JSON.stringify({
              type: "response.create",
              response: {
                modalities: ["text", "audio"],
                instructions: "Please assist the user.",
              }
            }));
          });

          wsOpenAI.on('message', (message) => {
            ws.send(message);
          });

          wsOpenAI.on('error', (error) => {
            console.error('OpenAI WebSocket error:', error);
            ws.send(JSON.stringify({ error: 'OpenAI connection error' }));
          });
        } catch (error) {
          console.error('Error:', error);
          ws.send(JSON.stringify({ error: 'Failed to process message' }));
        }
      });
    });

    return new Response(null, { status: 101 });
  } catch (err) {
    console.error('WebSocket setup error:', err);
    return new Response('WebSocket setup error', { status: 500 });
  }
}

export const dynamic = 'force-dynamic';