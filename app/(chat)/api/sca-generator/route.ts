import { OpenAIStream, StreamingTextResponse } from 'ai';
import { Configuration, OpenAIApi } from 'openai-edge';

const config = new Configuration({
  apiKey: process.env.OPENAI_API_KEY
});
const openai = new OpenAIApi(config);

export const runtime = 'edge';

function getPrompt(action: string, params: any): string {
  const { domain, additionalInfo, patientNotes, doctorNotes } = params;
  
  switch (action) {
    case 'generatePatientNotes':
      return `Your role is to help a GP ST3 trainee prepare for the final SCA exam in the UK. For this, one has to do a lot of roleplays to practice consultation skills. Your role is to generate a thorough scenario for a patient role player, that fits under the ${domain} category, related to ${additionalInfo}, and covers a wide range of diagnoses from the NICE CKS guidelines. You are to give the patient's name, age at the top, then their presenting complaint, history of presenting complaint, past medical history, drug history, and any other relevant information. To finish off, you will mention their ideas, concerns, and expectations and write the diagnosis that the GP should be working towards at the end. Make sure you use a wide range of conditions, not just the most common ones. Use markdown formatting.

# Patient Details
Generate a name from various ethnicities and age for a patient in the ${domain} category.

## Presenting Complaint
Detail the main symptoms related to ${additionalInfo}.

## History of Presenting Complaint
Provide a detailed timeline and description of symptoms.

## Past Medical History
List relevant medical history.

## Drug History
List current medications.

## Social History
Include relevant lifestyle factors.

## Ideas, Concerns, and Expectations
- Ideas: What does the patient think is wrong?
- Concerns: What are they worried about?
- Expectations: What do they hope to get from this consultation?

## Case summary
Case summary`;
    
    case 'generateDoctorNotes':
      return `With this information from "${patientNotes}", write a short briefing for a GP trainee who is to see this patient in clinic next. The aim of this exercise is to practice for the GP SCA exam in the UK. Don't give the case information that you would expect a GP to know to ask of a patient. Only include the name and age of the patient and a one-liner on the reason they have booked to see the doctor today. You may include their drug history as a list, but no other information. Don't offer information on the specific case information from "${patientNotes}". Don't mention the ideas, concerns, and expectations here or any information that would point towards the diagnosis.`;
    
    case 'generateMarkScheme':
      return `With this information about the case from the patient notes "${patientNotes}" and doctor's information "${doctorNotes}", write a comprehensive mark scheme encompassing three areas: Data Gathering, Clinical Management, and Relating to Others. Display this in an appropriately formatted table with the areas to the side. There should be an appropriate management plan and diagnosis according to the NICE CKS guidelines. This should be a holistic management plan also taking into account the patient's concerns and expectations. However, it should adhere to NICE guidelines and best practice in the UK NHS. The Data Gathering should include the following, personalised to the case: Systematically gathers and organises relevant and targeted information. Addresses the needs of the patient/colleague and their problem(s). Adopts a structured and informed approach to problem-solving, generating an appropriate differential diagnosis or relying on first principles of investigation where the presentation is undifferentiated, uncertain, or complex. The Clinical Management should include the following: Demonstrates the ability to formulate safe and appropriate management options which include effective prioritisation, continuity, and time and self-management. Demonstrates commitment to providing optimum care in the short and long-term, whilst acknowledging the challenges. Relating to Others section should include the following: Demonstrates ethical awareness where appropriate. Shows the ability to communicate in a person-centred way. Demonstrates initiative and flexibility, adjusting consultation approach where appropriate to overcome any communication barriers. Reaches a shared understanding with the patient. All the scenarios will be practiced as video consultations, so if necessary part of the management plan may also involve bringing the patient in to the clinic for a physical examination. If so, then you must be specific about what you will examine or measure (e.g., obs). The aim of this exercise is to practice for the GP SCA exam in the UK and to have a mark scheme and management plan that encompasses all the domains in good detail that trainees can learn from. Also, offer appropriate follow-up and safety netting specific to the case. At the end, also give a summary of the problem at hand and the management, plus link to the appropriate NICE CKS page for more information.`;
    
    default:
      throw new Error('Invalid action');
  }
}

export async function POST(req: Request) {
  try {
    // Parse the request body
    const body = await req.json();
    const { action, domain, additionalInfo, patientNotes, doctorNotes } = body;

    // Log the received action for debugging
    console.log('Received action:', action);

    if (!action) {
      throw new Error('Action is required');
    }

    const prompt = getPrompt(action, { domain, additionalInfo, patientNotes, doctorNotes });

    const response = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      stream: true,
      messages: [{ role: 'user', content: prompt }],
    });

    const stream = OpenAIStream(response);
    return new StreamingTextResponse(stream);
  } catch (error) {
    console.error('Error in POST handler:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}