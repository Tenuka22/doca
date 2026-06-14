"use client";

import { Filter, Loader2, MessageSquare } from "lucide-react";
import * as React from "react";
import { Button } from "./button";
import { Card } from "./card";
import { Input } from "./input";
import { ScrollArea } from "./scroll-area";

export interface Suggestion {
  description?: string;
  label: string;
  value: string;
}

export interface ChatMessage {
  content: string;
  id: string;
  role: "user" | "assistant";
  suggestions?: Suggestion[];
  timestamp: string;
}

type InputMode = "text" | "select";

interface ChatProps {
  isLoading?: boolean;
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  suggestions?: Suggestion[];
}

export function Chat({
  messages,
  isLoading,
  onSendMessage,
  suggestions: externalSuggestions,
}: ChatProps) {
  const [input, setInput] = React.useState("");
  const [inputMode, setInputMode] = React.useState<InputMode>(
    externalSuggestions && externalSuggestions.length > 0 ? "select" : "text"
  );
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const latestSuggestions =
    externalSuggestions ??
    messages
      .filter((m) => m.role === "assistant" && m.suggestions && m.suggestions.length > 0)
      .pop()?.suggestions;

  const hasSuggestions = latestSuggestions && latestSuggestions.length > 0;

  React.useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  React.useEffect(() => {
    if (hasSuggestions) {
      setInputMode("select");
    }
  }, [hasSuggestions]);

  const handleSuggestionClick = (value: string) => {
    if (isLoading) return;
    onSendMessage(value);
  };

  const handleSend = () => {
    if (!input.trim() || isLoading) {
      return;
    }
    onSendMessage(input);
    setInput("");
  };

  return (
    <div className="flex h-full flex-col gap-4">
      {/* Messages */}
      <ScrollArea className="flex-1 rounded-lg border p-4">
        <div className="space-y-4">
          {messages.map((msg) => (
            <div
              className={`flex ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
              key={msg.id}
            >
              <div
                className={`max-w-xs rounded-lg px-4 py-2 ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                <p className="text-sm">{msg.content}</p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="rounded-lg bg-muted px-4 py-2">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Mode Toggle */}
      <div className="flex gap-2">
        <Button
          className="gap-2"
          onClick={() => setInputMode("text")}
          size="sm"
          variant={inputMode === "text" ? "default" : "outline"}
        >
          <MessageSquare className="h-4 w-4" />
          Text
        </Button>
        <Button
          className="gap-2"
          disabled={!hasSuggestions}
          onClick={() => setInputMode("select")}
          size="sm"
          variant={inputMode === "select" ? "default" : "outline"}
        >
          <Filter className="h-4 w-4" />
          Cards
        </Button>
      </div>

      {/* Input Area */}
      <div className="space-y-2">
        {inputMode === "select" ? (
          hasSuggestions ? (
            <div>
              <label className="mb-3 block font-medium text-sm">
                What would you like to do next?
              </label>
              <div className="grid grid-cols-1 gap-2">
                {latestSuggestions.map((opt) => (
                  <Card
                    className="cursor-pointer p-4 transition-colors hover:bg-accent"
                    key={opt.value}
                    onClick={() => handleSuggestionClick(opt.value)}
                  >
                    <div className="font-medium">{opt.label}</div>
                    {opt.description && (
                      <div className="mt-1 text-muted-foreground text-xs">
                        {opt.description}
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-4 text-center text-muted-foreground text-sm">
              No suggestions available. Switch to text mode to type a message.
            </div>
          )
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex gap-2">
              <Input
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSend();
                  }
                }}
                placeholder="Type a message..."
                value={input}
              />
              <Button disabled={isLoading || !input.trim()} onClick={handleSend}>
                Send
              </Button>
            </div>
            {hasSuggestions && (
              <div className="flex flex-wrap gap-2">
                {latestSuggestions.slice(0, 4).map((opt) => (
                  <Button
                    className="text-xs"
                    disabled={isLoading}
                    key={opt.value}
                    onClick={() => handleSuggestionClick(opt.value)}
                    size="sm"
                    variant="outline"
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
