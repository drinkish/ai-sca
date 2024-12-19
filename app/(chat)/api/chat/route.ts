import { convertToCoreMessages, Message, streamText } from "ai";

import { customModel } from "@/ai";
import { auth } from "@/app/(auth)/auth";
import { deleteChatById, getChatById, insertChat, updateChat } from "@/db/queries";

export async function POST(request: Request) {
  const { id, messages }: { id: string; messages: Array<Message> } =
    await request.json();

  const session = await auth();

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const coreMessages = convertToCoreMessages(messages);

  const result = await streamText({
    model: customModel,
    system: `You are a dedicated revision assistant for GP ST3 doctors preparing for the RCGP SCA exam in the UK. Your primary role is to assist with medical-related queries specifically applicable to this exam or any other exam revision help, providing accurate and detailed answers grounded in NHS primary care practices. All responses must be based on the latest UK guidelines, ensuring they are sufficiently detailed for comprehensive exam revision.

When responding:

1. Provide thorough explanations, covering all essential clinical details and be specific, especially with regards to medication dosages or ages of patients. Your output amount should depend on the query. Some queries may be more brief, others ask for more details.
2. Integrate key NICE CKS recommendations relevant to the query but don't mention NICE CKS specifically.
3. Highlight the right management advice, including when to refer patients and which red flags to be aware of.
4. Emphasise addressing patient concerns and considering the impact on their personal lives to guide appropriate management.
5. Offer practical advice and step-by-step approaches where applicable. Remember that examination is not assessed in the exam so don't need to mention this.
6. Tailor the length of your responses to the complexity of the query, keeping answers succinct when appropriate while ensuring all necessary details are included.
7. Encourage follow-up questions for clarification or additional information.

By following these guidelines, ensure that your responses are not only informative but also tailored to the specific needs of final year GP trainees preparing for the RCGP SCA exam.`,
  messages: coreMessages,
    maxSteps: 5,
    experimental_telemetry: {
      isEnabled: true,
      functionId: "stream-text",
    },
    onFinish: async ({ responseMessages }) => {
      if (session.user && session.user.id) {
        try {
          const existingChat = await getChatById(id);
          
          if (existingChat) {
            await updateChat(id, [...coreMessages, ...responseMessages]);
          } else {
            await insertChat({
              id,
              messages: [...coreMessages, ...responseMessages],
              userId: session.user.id,
            });
          }
        } catch (error) {
          console.error("Failed to save chat");
        }
      }
    },
  });

  return result.toDataStreamResponse({});
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return new Response("Not Found", { status: 404 });
  }

  const session = await auth();

  if (!session || !session.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const chat = await getChatById(id);

    if (!chat) {
      return new Response("Chat not found", { status: 404 });
    }

    if (chat.userId !== session.user.id) {
      return new Response("Unauthorized", { status: 401 });
    }

    await deleteChatById(id);

    return new Response("Chat deleted", { status: 200 });
  } catch (error) {
    console.error("Error deleting chat:", error);
    return new Response("An error occurred while processing your request", {
      status: 500,
    });
  }
}