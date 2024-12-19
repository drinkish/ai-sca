import { NextResponse } from 'next/server';

const TAVUS_API_KEY = process.env.TAVUS_API_KEY;
const TAVUS_REPLICA_ID = process.env.TAVUS_REPLICA_ID;
const TAVUS_PERSONA_ID = process.env.TAVUS_PERSONA_ID;
const TAVUS_API_URL = 'https://tavusapi.com/v2';

export async function POST(request: Request) {
  try {
    // Verify environment variables
    if (!TAVUS_API_KEY) {
      throw new Error('TAVUS_API_KEY is not configured');
    }
    if (!TAVUS_REPLICA_ID) {
      throw new Error('TAVUS_REPLICA_ID is not configured');
    }
    if (!TAVUS_PERSONA_ID) {
      throw new Error('TAVUS_PERSONA_ID is not configured');
    }

    console.log('Creating Tavus conversation...');
    console.log('API URL:', `${TAVUS_API_URL}/conversations`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(`${TAVUS_API_URL}/conversations`, {
        method: 'POST',
        headers: {
          'x-api-key': TAVUS_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          replica_id: TAVUS_REPLICA_ID,
          persona_id: TAVUS_PERSONA_ID,
          conversation_name: 'Headache',
          conversational_context: 'You have come to see the GP with a bad headache. You have to answer the questions the GP asks you based on this medical scenario:\n\nPatient Name: Sarah Thompson\nAge: 32\n\nPresenting Complaint: I am having the worst headache I have ever had. History of Presenting Complaint:\nSarah reports that her headache started suddenly about 3 hours ago while she was at work. She describes it as a severe, throbbing pain on the right side of her head and rates it a 9 out of 10 in intensity. The pain is associated with nausea and sensitivity to light. She denies any aura but mentions that she has experienced mild headaches in the past, usually triggered by stress or lack of sleep. She has not taken any medication for this headache yet, as she was unsure if this headache was different from her normal ones. There are no relieving factors she has identified so far. She also notes that she has experienced a funny feeling in her right arm since the headache started, which is concerning her.\n\nPast Medical History:\n\nMigraines (diagnosed 5 years ago)\nAnxiety disorder\nNo significant surgeries\nNo known allergies\nDrug History:\n\nSertraline 50 mg once daily for anxiety\nOccasional use of ibuprofen for migraines (last used 3 months ago)\nNo other regular medications\nFamily History:\n\nMother with a history of migraines\nFather with a history of hypertension and stroke\nSocial History:\n\nWorks as a graphic designer\nNon-smoker\nOccasionally drinks alcohol (2-3 glasses of wine per week)\nNo recent travel history\nIdeas, Concerns, and Expectations:\n\nSarah is worried that this headache could be a sign of something serious like a stroke, especially with the new arm symptoms.\nShe believes her stress from work might be contributing to her headaches but doesnt think this one feels the same. She expects to receive treatment today and is hoping for a quick resolution, as she is concerned about her ability to work and her overall health.',
          properties: {
            max_call_duration: 720,
            participant_left_timeout: 60,
            participant_absent_timeout: 300,
            enable_recording: true,
            enable_transcription: true,
            language: 'english'
          }
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Tavus API error response:', {
          status: response.status,
          statusText: response.statusText,
          errorData
        });
        throw new Error(`Tavus API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return NextResponse.json(data);

    } catch (error) {
      if (error && typeof error === 'object' && 'name' in error && error.name === 'AbortError') {
        throw new Error('Tavus API request timed out after 10 seconds');
      }
      throw error;
    }

  } catch (error) {
    console.error('Error creating conversation:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to create conversation',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
} 