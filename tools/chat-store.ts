"use server";
import { db } from "@/app/db";
import { chats, messages } from "@/app/db/schema";
import { auth } from '@clerk/nextjs/server'
import { and, eq } from "drizzle-orm";
import { Message } from "ai";
import { nanoid } from "nanoid";

export async function createChat() {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("User not authenticated");
  }
  const id = nanoid();
  await db.insert(chats).values({
    id,
    userId,
    createdAt: new Date(),
    updatedAt: new Date(),
  });  
  return id;
}

export async function getChatById(id: string) {
  const { userId } = await auth();
  
  const chat = await db.query.chats.findFirst({
    where: and(
      eq(chats.id, id),
      eq(chats.userId, userId || "")
    ),
  });
  
  return chat;
}

export async function loadChat(id: string): Promise<Message[]> {
  const { userId } = await auth();
  
  // Verify user has access to this chat
  const chat = await db.query.chats.findFirst({
    where: and(
      eq(chats.id, id),
      eq(chats.userId, userId || "")
    ),
  });
  
  if (!chat && userId) {
    return [];
  }
  
  let dbMessages;
  try {
    dbMessages = await db.query.messages.findMany({
      where: eq(messages.chatId, id),
      orderBy: (messages, { asc }) => [asc(messages.createdAt)],
    });
  } catch (error) {
    console.error("Error fetching messages: ", error);
    throw error;
  }
  
  // Group messages by conversation turns (user message followed by assistant response)
  const result: Message[] = [];
  
  // Simple map of database messages to AI SDK Message format
  const formattedMessages = dbMessages.map(msg => ({
    id: msg.id,
    role: msg.role as "user" | "assistant",
    content: msg.content,
    createdAt: msg.createdAt ?? undefined,
  }));
  
  // Ensure messages maintain proper user -> assistant ordering
  for (let i = 0; i < formattedMessages.length; i++) {
    const message = formattedMessages[i];
    result.push(message);
    
    // If this is a user message and the next one is an assistant message, 
    // make sure they stay together in the right order
    if (message.role === "user" && 
        i + 1 < formattedMessages.length && 
        formattedMessages[i + 1].role === "assistant") {
      result.push(formattedMessages[i + 1]);
      i++; // Skip the next message as we've already added it
    }
  }
  
  return result;
}

interface SaveChatProps {
  id: string;
  messages: Message[];
}

export async function saveChat({ id, messages: chatMessages }: SaveChatProps) {
  const { userId } = await auth();
  
  // Insert chat if it doesn't exist; on conflict, do nothing.
  if (userId) {
    await db.insert(chats).values({
      id,
      userId,
      updatedAt: new Date(),
    }).onConflictDoNothing();
  }
  
  // Update the chat's last updated time
  await db.update(chats)
    .set({ updatedAt: new Date() })
    .where(eq(chats.id, id));
  
  // Delete existing messages for this chat
  await db.delete(messages).where(eq(messages.chatId, id));
  
  // Insert all messages
  if (chatMessages.length > 0) {
    await db.insert(messages).values(
      chatMessages.map(msg => ({
        id: msg.id,
        chatId: id,
        role: msg.role,
        content: msg.content,
        ...(msg.createdAt 
          ? { createdAt: msg.createdAt instanceof Date ? msg.createdAt : new Date(msg.createdAt) }
          : {}
        )
      }))
    );
  }
}

export async function getUserChats() {
  const { userId } = await auth();
  
  if (!userId) return [];
  
  return db.query.chats.findMany({
    where: eq(chats.userId, userId),
    orderBy: (chats, { desc }) => [desc(chats.updatedAt)],
  });
}

export async function deleteChat(id: string) {
  const { userId } = await auth();
  
  await db.delete(chats).where(
    and(
      eq(chats.id, id),
      eq(chats.userId, userId || "")
    )
  );
}

export async function updateChatIsPublic(id: string, isPublic: boolean) {
  const { userId } = await auth();
  
  await db.update(chats)
    .set({ isPublic })
    .where(
      and(
        eq(chats.id, id),
        eq(chats.userId, userId || "")
      )
    );
}