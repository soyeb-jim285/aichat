import { loadChat, saveChat } from "@/tools/chat-store";
import { google } from "@ai-sdk/google";
import {
  streamText,
  appendResponseMessages,
  createIdGenerator,
  appendClientMessage,
} from "ai";

export async function POST(req: Request) {
  // get the last message from the client:
  const { message, id } = await req.json();

  // load the previous messages from the server:
  const previousMessages = await loadChat(id);

  // append the new message to the previous messages:
  const messages = appendClientMessage({
    messages: previousMessages,
    message,
  });

  const result = streamText({
    model: google("gemini-2.0-flash-001"),
    messages,
    async onFinish({ response }) {
      await saveChat({
        id,
        messages: appendResponseMessages({
          messages,
          responseMessages: response.messages,
        }),
      });
    }, // id format for server-side messages:
    experimental_generateMessageId: createIdGenerator({
      prefix: "msgs",
      size: 16,
    }),
  });
  // consume the stream to ensure it runs to completion & triggers onFinish
  // even when the client response is aborted:
  result.consumeStream(); // no await

  return result.toDataStreamResponse();
}
