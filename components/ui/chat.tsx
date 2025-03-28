"use client";

import { Message, useChat } from "@ai-sdk/react";
import { createIdGenerator } from "ai";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bot } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";
import "katex/dist/katex.min.css";
import { useEffect, useState } from "react";

export default function Chat({
  id,
  initialMessages,
}: { id?: string | undefined; initialMessages?: Message[] } = {}) {
  const { user } = useUser();
  const [groupedMessages, setGroupedMessages] = useState<Message[]>([]);
  
  const { 
    input, 
    handleInputChange, 
    handleSubmit, 
    messages, 
    isLoading 
  } = useChat({
    api: "/api/chat/google/gemini-2.0-flash",
    id,
    initialMessages,
    sendExtraMessageFields: true,
    experimental_prepareRequestBody({ messages, id }) {
      return { message: messages[messages.length - 1], id };
    },
    generateId: createIdGenerator({
      prefix: 'msgc',
      size: 16,
    }),
  });

  // Effect to process messages into conversation pairs
  useEffect(() => {
    setGroupedMessages(messages);
  }, [messages]);

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] container max-w-4xl mx-auto">
      <div className="flex-1 overflow-y-auto py-4 px-2 space-y-6">
        {groupedMessages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-center">
            <div className="text-muted-foreground">
              <h3 className="text-lg font-medium">Start a conversation</h3>
              <p className="text-sm">Ask a question to begin chatting</p>
            </div>
          </div>
        ) : (
          groupedMessages.map((message) => (
            <div 
              key={message.id} 
              className={cn(
                "flex items-start gap-4 max-w-[80%]", 
                message.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
              )}
            >
              {message.role !== "user" && (
                <Avatar className="h-8 w-8 border bg-primary-foreground">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    <Bot size={18} />
                  </AvatarFallback>
                </Avatar>
              )}
              
              <div 
                className={cn(
                  "rounded-lg px-4 py-2 text-sm",
                  message.role === "user" 
                    ? "bg-primary text-primary-foreground text-right" 
                    : "bg-muted"
                )}
              >
                {message.role === "user" ? (
                  <div>{message.content}</div>
                ) : (
                  <div className="prose prose-sm max-w-none dark:prose-invert prose-p:leading-relaxed prose-pre:p-2">
                    {typeof message.content === 'string' ? (
                      <ReactMarkdown 
                        remarkPlugins={[remarkMath]}
                        rehypePlugins={[rehypeHighlight, rehypeKatex]}
                        components={{
                          p: ({...props}) => <p className="mb-2 last:mb-0" {...props} />,
                          ul: ({...props}) => <ul className="mb-2 list-disc pl-4 last:mb-0" {...props} />,
                          ol: ({...props}) => <ol className="mb-2 list-decimal pl-4 last:mb-0" {...props} />,
                          li: ({...props}) => <li className="mb-1" {...props} />,
                          h1: ({...props}) => <h1 className="mb-2 text-lg font-bold" {...props} />,
                          h2: ({...props}) => <h2 className="mb-2 text-base font-bold" {...props} />,
                          h3: ({...props}) => <h3 className="mb-1 text-sm font-bold" {...props} />,
                          code: ({className, children, ...props}) => {
                            const match = /language-(\w+)/.exec(className || '');
                            return match ? (
                              <pre className="mb-2 rounded bg-gray-800 p-2 text-xs text-white">
                                <code className={className} {...props}>
                                  {children}
                                </code>
                              </pre>
                            ) : (
                              <code className="rounded bg-gray-200 px-1 py-0.5 text-sm dark:bg-gray-800" {...props}>
                                {children}
                              </code>
                            );
                          },
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    ) : (
                      <div>Unable to display message content</div>
                    )}
                  </div>
                )}
              </div>
              
              {message.role === "user" && (
                <Avatar>
                  <AvatarImage src={user?.imageUrl} alt={user?.fullName || "User"} />
                  <AvatarFallback>
                    {(user?.firstName?.[0] || "") + (user?.lastName?.[0] || "")}
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          ))
        )}
      </div>

      <div className="border-t p-4">
        <form 
          onSubmit={handleSubmit} 
          className="flex gap-2 items-center"
        >
          <input
            className="flex-1 min-w-0 px-4 py-2 rounded-full border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            value={input}
            placeholder="Type your message..."
            onChange={handleInputChange}
            disabled={isLoading}
          />
          <button 
            type="submit" 
            className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-full"
            disabled={isLoading || !input.trim()}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}