import { google } from "@ai-sdk/google";
import { streamText, Message } from "ai";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages }: { messages: Message[] } = await req.json();

  const result = streamText({
    model: google("gemini-2.0-flash-thinking-exp-01-21"),
    messages,
  });

  return result.toDataStreamResponse();
}
