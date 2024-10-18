import { Chat } from "@/components/custom/chat";
import { generateUUID } from "@/lib/utils";
import { withAuth } from '@/lib/withAuth'


export default withAuth(async function Page() {
  const id = generateUUID();
  return <Chat key={id} id={id} initialMessages={[]} />;
});
