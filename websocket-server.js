const path = require('path');

const dotenv = require('dotenv');
const WebSocket = require('ws');


// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY is not defined');
}

const wss = new WebSocket.Server({ 
  port: 3001,
  perMessageDeflate: false
});

console.log('WebSocket server starting on port 3001...');

wss.on('listening', () => {
  console.log('WebSocket server is listening on port 3001');
});

wss.on('connection', (ws) => {
  console.log('Client connected');
  let openAIWs = null;

  // Initialize OpenAI WebSocket connection
  const initOpenAI = async () => {
    openAIWs = new WebSocket("wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01", {
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "OpenAI-Beta": "realtime=v1",
      }
    });

    openAIWs.on('open', () => {
      console.log('Connected to OpenAI');
      openAIWs.send(JSON.stringify({
        type: "response.create",
        response: {
          modalities: ["text", "audio"],
          instructions: "Please assist the user.",
        }
      }));
    });

    openAIWs.on('message', (message) => {
      console.log('Received from OpenAI:', typeof message, message);
      try {
        let dataToSend;
        
        if (Buffer.isBuffer(message)) {
          // Convert Buffer to string if it's JSON
          const stringData = message.toString();
          try {
            // Try to parse as JSON first
            const parsed = JSON.parse(stringData);
            console.log('Parsed message:', parsed);
            
            // If it's an audio response, format it properly
            if (parsed.type === 'response.audio.delta') {
              dataToSend = stringData;
            } else {
              dataToSend = stringData;
            }
          } catch {
            // If not valid JSON, it might be binary audio data
            dataToSend = JSON.stringify({
              type: 'response.audio.delta',
              delta: message.toString('base64')
            });
          }
        } else if (typeof message === 'string') {
          // Ensure it's valid JSON
          const parsed = JSON.parse(message);
          console.log('String message:', parsed);
          dataToSend = message;
        } else {
          dataToSend = JSON.stringify(message);
        }
        
        console.log('Sending to client:', dataToSend);
        ws.send(dataToSend);
      } catch (error) {
        console.error('Error processing OpenAI message:', error);
        ws.send(JSON.stringify({ error: 'Error processing message' }));
      }
    });

    openAIWs.on('error', (error) => {
      console.error('OpenAI WebSocket error:', error);
      ws.send(JSON.stringify({ error: 'OpenAI connection error' }));
    });

    openAIWs.on('close', () => {
      console.log('OpenAI connection closed');
      openAIWs = null;
    });
  };

  // Initialize OpenAI connection when client connects
  initOpenAI();

  ws.on('message', async (data) => {
    try {
      // Parse incoming data
      const message = JSON.parse(data.toString());
      console.log('Received from client:', message);

      // Ensure OpenAI connection is active
      if (!openAIWs || openAIWs.readyState !== WebSocket.OPEN) {
        console.log('Reconnecting to OpenAI...');
        await initOpenAI();
      }

      // Forward the message to OpenAI
      openAIWs.send(JSON.stringify(message));
      console.log('Sent to OpenAI:', message);

    } catch (error) {
      console.error('Error processing client message:', error);
      ws.send(JSON.stringify({ error: 'Failed to process message' }));
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
    if (openAIWs) {
      openAIWs.close();
    }
  });

  ws.on('error', (error) => {
    console.error('Client WebSocket error:', error);
  });
});

wss.on('error', (error) => {
  console.error('WebSocket server error:', error);
}); 