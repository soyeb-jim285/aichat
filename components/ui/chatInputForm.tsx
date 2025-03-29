"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  input: string;
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleSubmit: (e: React.FormEvent) => void;
  status?: string;
  placeholder?: string;
}

export const ChatInput = React.memo(({
  input,
  handleInputChange,
  handleSubmit,
  status,
  placeholder = "Type your message..."
}: ChatInputProps) => {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const isLoading = status === 'in-progress' || status === 'submitted';

  // Auto-resize textarea based on content
  React.useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, [input]);

  // Handle Enter key to submit form (while allowing Shift+Enter for new line)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const form = e.currentTarget.form;
      if (form) {
        form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
      }
    }
  };

  return (
    <form 
      onSubmit={handleSubmit} 
      className="flex gap-2 items-end max-w-2xl mx-auto"
    >
      <Textarea
        ref={textareaRef}
        className={cn(
          "flex-1 min-w-0 resize-none rounded-2xl shadow-sm border-muted-foreground/20 py-3 px-4",
          "max-h-[200px] overflow-y-auto",
          "focus-visible:ring-1 focus-visible:ring-primary"
        )}
        value={input}
        placeholder={placeholder}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        disabled={isLoading}
        autoComplete="off"
        spellCheck="false"
        rows={1}
      />
      <Button 
        type="submit" 
        size="icon"
        className="rounded-full shadow-sm mb-1 h-10 w-10"
        disabled={isLoading || !input.trim()}
      >
        {isLoading ? 
          <Loader2 size={18} className="animate-spin" /> : 
          <Send size={18} />
        }
      </Button>
    </form>
  );
});

ChatInput.displayName = "ChatInput";