"use client";

import { Message, useChat } from "@ai-sdk/react";
import { createIdGenerator } from "ai";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bot, Loader2, Send } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";
import remarkGfm from "remark-gfm";
import "katex/dist/katex.min.css";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createChat } from "@/tools/chat-store";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea"; 
import { ChatInput } from "./chatInputForm";

export default function Chat({
  id,
  initialMessages,
}: { id?: string | undefined; initialMessages?: Message[] } = {}) {
  const { user } = useUser();
  const [initialInput, setInitialInput] = useState("");
  const [isCreatingChat, setIsCreatingChat] = useState(false);
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const initialTextareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Auto-resize initial textarea
  useEffect(() => {
    const textarea = initialTextareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, [initialInput]);

  // Handle keydown for initial input
  const handleInitialKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const form = e.currentTarget.form;
      if (form) {
        form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
      }
    }
  };
  
  // Handle submitting the first message when there's no chat ID yet
  const handleInitialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!initialInput.trim() || isCreatingChat) return;
    
    setIsCreatingChat(true);
    
    try {
      // Create a new chat ID
      const newChatId = await createChat();
      
      // Navigate to the new chat URL with the message ready to be sent
      router.push(`/chat/${newChatId}?message=${encodeURIComponent(initialInput)}`);
    } catch (error) {
      console.error("Error creating chat:", error);
      setIsCreatingChat(false);
    }
  };
  
  const { 
    input, 
    handleInputChange, 
    handleSubmit, 
    messages, 
    status 
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

  // Effect to check for message parameter in URL (for first-time navigation)
  useEffect(() => {
    if (id && typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const messageParam = urlParams.get('message');
      
      if (messageParam) {
        handleInputChange({ target: { value: messageParam } } as any);
        // Clean URL by removing the query parameter
        router.replace(`/chat/${id}`);
        // Submit the message after a brief delay to ensure the form is ready
        setTimeout(() => {
          const form = document.querySelector('form');
          if (form) form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
        }, 100);
      }
    }
  }, [id, router]);

  // Auto-scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  
  // Effect to scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Render initial chat form when there's no ID
  if (!id) {
    return (
      <div className="flex flex-col h-[calc(100vh-6rem)] container max-w-4xl mx-auto bg-gradient-to-b from-background to-muted/20">
        <div className="flex-1 overflow-y-auto py-4 px-2">
          <div className="flex h-full items-center justify-center text-center">
            <div className="text-muted-foreground max-w-md p-6 rounded-xl bg-background/80 backdrop-blur-sm shadow-sm border">
              <h3 className="text-xl font-semibold mb-2">Start a conversation</h3>
              <p className="text-sm">Ask a question to begin chatting with the AI assistant</p>
            </div>
          </div>
        </div>
        
        <div className="p-4 border-t backdrop-blur-sm bg-background/90">
          <form className="flex gap-2 max-w-2xl mx-auto items-end" onSubmit={handleInitialSubmit}>
            <Textarea
              ref={initialTextareaRef}
              className="flex-1 min-w-0 resize-none rounded-2xl shadow-sm border-muted-foreground/20 py-3 px-4 max-h-[200px]"
              value={initialInput}
              onChange={(e) => setInitialInput(e.target.value)}
              onKeyDown={handleInitialKeyDown}
              placeholder="Type your message..."
              disabled={isCreatingChat}
              autoComplete="off"
              spellCheck="false"
              rows={1}
            />
            <Button 
              type="submit" 
              size="icon"
              className="rounded-full shadow-sm mb-1 h-10 w-10"
              disabled={isCreatingChat || !initialInput.trim()}
            >
              {isCreatingChat ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] container max-w-4xl mx-auto bg-gradient-to-b from-background to-muted/20">
      <div className="flex-1 overflow-y-auto py-4 px-2 space-y-6">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-center">
            <div className="text-muted-foreground max-w-md p-6 rounded-xl bg-background/80 backdrop-blur-sm shadow-sm border">
              <h3 className="text-xl font-semibold mb-2">Start a conversation</h3>
              <p className="text-sm">Ask a question to begin chatting with the AI assistant</p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <div 
                key={message.id} 
                className={cn(
                  "flex items-start gap-4 max-w-[85%] animate-in slide-in-from-bottom-2 duration-300", 
                  message.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                )}
              >
                {message.role !== "user" && (
                  <Avatar className="h-8 w-8 border shadow-sm bg-primary-foreground">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      <Bot size={18} />
                    </AvatarFallback>
                  </Avatar>
                )}
                
                <div 
                  className={cn(
                    "rounded-2xl px-4 py-2 text-sm shadow-sm",
                    message.role === "user" 
                      ? "bg-primary text-primary-foreground text-right rounded-tr-sm" 
                      : "bg-muted/70 backdrop-blur-sm rounded-tl-sm"
                  )}
                >
                  {message.role === "user" ? (
                    <div className="prose dark:prose-invert whitespace-pre-wrap">{message.content}</div>
                  ) : (
                    <div className="prose prose-sm max-w-none dark:prose-invert prose-p:leading-relaxed prose-pre:p-2">
                      {typeof message.content === 'string' ? (
                        <ReactMarkdown 
                          remarkPlugins={[remarkMath, remarkGfm]}
                          rehypePlugins={[rehypeHighlight, rehypeKatex]}
                          components={{
                            p: ({...props}) => <p className="mb-2 last:mb-0" {...props} />,
                            ul: ({...props}) => <ul className="mb-2 list-disc pl-4 last:mb-0" {...props} />,
                            ol: ({...props}) => <ol className="mb-2 list-decimal pl-4 last:mb-0" {...props} />,
                            li: ({...props}) => <li className="mb-1" {...props} />,
                            h1: ({...props}) => <h1 className="mb-2 text-lg font-bold" {...props} />,
                            h2: ({...props}) => <h2 className="mb-2 text-base font-bold" {...props} />,
                            h3: ({...props}) => <h3 className="mb-1 text-sm font-bold" {...props} />,
                            table: ({...props}) => <table className="mb-4 border-collapse border border-gray-300 dark:border-gray-700 rounded-sm overflow-hidden" {...props} />,
                            thead: ({...props}) => <thead className="bg-gray-100 dark:bg-gray-800" {...props} />,
                            tbody: ({...props}) => <tbody {...props} />,
                            tr: ({...props}) => <tr className="border-t border-gray-300 dark:border-gray-700" {...props} />,
                            th: ({...props}) => <th className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-left" {...props} />,
                            td: ({...props}) => <td className="border border-gray-300 dark:border-gray-700 px-4 py-2" {...props} />,
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
                  <Avatar className="shadow-sm">
                    <AvatarImage src={user?.imageUrl} alt={user?.fullName || "User"} />
                    <AvatarFallback>
                      {(user?.firstName?.[0] || "") + (user?.lastName?.[0] || "")}
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
            
            {/* Loading indicator */}
            {status === 'submitted' && (
              <div className="flex items-start gap-4 max-w-[85%] mr-auto animate-in fade-in duration-300">
                <Avatar className="h-8 w-8 border shadow-sm bg-primary-foreground">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    <Bot size={18} />
                  </AvatarFallback>
                </Avatar>
                <div className="rounded-2xl rounded-tl-sm px-4 py-3 bg-muted/70 backdrop-blur-sm shadow-sm">
                  <div className="flex items-center gap-1">
                    <div className="h-2 w-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "0ms" }}></div>
                    <div className="h-2 w-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "150ms" }}></div>
                    <div className="h-2 w-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "300ms" }}></div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t p-4 backdrop-blur-sm bg-background/90">
        <ChatInput
          input={input}
          handleInputChange={handleInputChange as any}
          handleSubmit={handleSubmit}
          status={status}
        />
      </div>
    </div>
  );
}