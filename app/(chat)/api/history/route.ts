import { auth } from "@/app/(auth)/auth";
import { getChatsByUserId } from "@/db/queries";

export async function GET() {
  const session = await auth();

  if (!session || !session.user) {
    return Response.json("Unauthorized!", { status: 401 });
  }

  try {
    const chats = await getChatsByUserId(session.user.id!); // Updated: passing id directly
    return Response.json(chats);
  } catch (error) {
    console.error("Error fetching chat history:", error);
    return Response.json("Failed to fetch chat history", { status: 500 });
  }
}