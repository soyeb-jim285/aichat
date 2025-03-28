import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  primaryKey,
  boolean,
} from "drizzle-orm/pg-core";

export const chats = pgTable("chats", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().default(''), // Clerk user ID
  title: text("title").default("New Chat"),
  isPublic: boolean("is_public").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const messages = pgTable("messages", {
  id: text("id").primaryKey(),
  chatId: text("chat_id")
    .notNull()
    .references(() => chats.id, { onDelete: "cascade" }),
  role: text("role").notNull(), // "user" or "assistant"
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Define relationships
export const chatsRelations = relations(chats, ({ many }) => ({
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  chat: one(chats, {
    fields: [messages.chatId],
    references: [chats.id],
  }),
}));