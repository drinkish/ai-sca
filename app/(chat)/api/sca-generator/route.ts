import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';


// Initialize the OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function generateWithGPT4(prompt: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // or "gpt-3.5-turbo" if you prefer
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1000, // Adjust as needed
    });

    return response.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('Error generating text:', error);
    throw error;
  }
}

export async function POST(req: NextRequest) {
  const { action, domain, additionalInfo, patientNotes, doctorNotes } = await req.json();

  let result;
  switch (action) {
    case 'generatePatientNotes':
      result = await generateWithGPT4(
        `Your role is to help a GP ST3 trainee prepare for the final SCA exam in the UK. For this, one has to do a lot of roleplays to practice consultation skills. Your role is to generate a thorough scenario for a patient role player, that fits under the ${domain} category, related to ${additionalInfo}, and covers a wide range of diagnoses from the NICE CKS guidelines. You are to give the patient's name, age at the top, then their presenting complaint, history of presenting complaint, past medical history, drug history, and any other relevant information. To finish off, you will mention their ideas, concerns, and expectations and write the diagnosis that the GP should be working towards at the end. Make sure you use a wide range of conditions, not just the most common ones. Use good formatting.`
      );
      break;
    case 'generateDoctorNotes':
      result = await generateWithGPT4(
        `With this information from "${patientNotes}", write a short briefing for a GP trainee who is to see this patient in clinic next. The aim of this exercise is to practice for the GP SCA exam in the UK. Don't give the case information that you would expect a GP to know to ask of a patient. Only include the name and age of the patient and a one-liner on the reason they have booked to see the doctor today. You may include their drug history as a list, but no other information. Don't offer information on the specific case information from "${patientNotes}". Don't mention the ideas, concerns, and expectations here or any information that would point towards the diagnosis.`
        
      );
      break;
    case 'generateMarkScheme':
      result = await generateWithGPT4(
        `With this information about the case from the patient notes "${patientNotes}" and doctor's information "${doctorNotes}", write a comprehensive mark scheme encompassing three areas: Data Gathering, Clinical Management, and Relating to Others. Display this in a table with the areas to the side. There should be an appropriate management plan and diagnosis according to the NICE CKS guidelines. This should be a holistic management plan also taking into account the patient's concerns and expectations. However, it should adhere to NICE guidelines and best practice in the UK NHS. The Data Gathering should include the following, personalised to the case: Systematically gathers and organises relevant and targeted information. Addresses the needs of the patient/colleague and their problem(s). Adopts a structured and informed approach to problem-solving, generating an appropriate differential diagnosis or relying on first principles of investigation where the presentation is undifferentiated, uncertain, or complex. The Clinical Management should include the following: Demonstrates the ability to formulate safe and appropriate management options which include effective prioritisation, continuity, and time and self-management. Demonstrates commitment to providing optimum care in the short and long-term, whilst acknowledging the challenges. Relating to Others section should include the following: Demonstrates ethical awareness where appropriate. Shows the ability to communicate in a person-centred way. Demonstrates initiative and flexibility, adjusting consultation approach where appropriate to overcome any communication barriers. Reaches a shared understanding with the patient. All the scenarios will be practiced as video consultations, so if necessary part of the management plan may also involve bringing the patient in to the clinic for a physical examination. If so, then you must be specific about what you will examine or measure (e.g., obs). The aim of this exercise is to practice for the GP SCA exam in the UK and to have a mark scheme and management plan that encompasses all the domains in good detail that trainees can learn from. Also, offer appropriate follow-up and safety netting specific to the case. At the end, also give a summary of the problem at hand and the management, plus link to the appropriate NICE CKS page for more information."
`      );
      break;
    default:
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }

  return NextResponse.json({ result });
}