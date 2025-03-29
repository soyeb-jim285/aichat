import Chat from "@/components/ui/chat";
import { loadChat } from "@/tools/chat-store";
import { Message } from "ai";

export default async function Page({ params }: { params: Promise<{ id?: string[] }> }) {
  const resolvedParams = await params;
  const idArray = resolvedParams.id;
  const id = idArray?.[0]; // Extract the first segment if it exists

  let initialMessages: Message[] = [];
  if (id) {
    initialMessages = await loadChat(id); // Load messages if an ID is provided
  }

  return <Chat id={id} initialMessages={initialMessages} />;
}