import { Button } from "@doca/ui/components/button";
import type { ChatMessage } from "@doca/ui/components/chat";
import { Chat } from "@doca/ui/components/chat";
import { ScrollArea } from "@doca/ui/components/scroll-area";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import * as React from "react";
import { orpcWs, orpc } from "@/utils/orpc";

export const Route = createFileRoute("/chat")({
  component: ChatPage,
});

function ChatPage() {
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = React.useState<string>();
  const [isLoading, setIsLoading] = React.useState(false);
  const wsRef = React.useRef<AsyncIterable<unknown> | null>(null);

  const { data: conversations, refetch: refetchConversations } = useQuery(
    orpc.getConversations.queryOptions({ input: {} }),
  );

  const { data: previousMessages, isLoading: isMessagesLoading } = useQuery({
    ...orpc.getMessages.queryOptions({
      input: { conversationId: conversationId! },
    }),
    enabled: !!conversationId,
  });

  React.useEffect(() => {
    if (previousMessages?.items) {
      setMessages(
        previousMessages.items.map((m) => ({
          ...m,
          role: m.role as "user" | "assistant",
        }))
      );
    }
  }, [previousMessages]);

  const handleSendMessage = React.useCallback(
    async (message: string) => {
      if (!message.trim()) {
        return;
      }

      setIsLoading(true);

      try {
        const stream = await orpcWs.chat.sendMessage({
          message,
          conversationId,
          system: "doctor_search",
        });

        wsRef.current = stream;

        for await (const event of stream) {
          const data = event as {
            type: string;
            data?: ChatMessage;
            conversationId?: string;
          };

          if (data.type === "message") {
            setMessages((prev) => [...prev, data.data!]);
            setIsLoading(false);
          } else if (data.type === "done") {
            setConversationId(data.conversationId);
            refetchConversations();
          }
        }
      } finally {
        setIsLoading(false);
      }
    },
    [conversationId, refetchConversations]
  );

  const DEFAULT_SUGGESTIONS = [
    { label: "Find a doctor", value: "I need to find a doctor", description: "Search for doctors by name or specialty" },
    { label: "Get doctor info", value: "Tell me about a doctor", description: "Learn more about a specific doctor" },
    { label: "Browse specialties", value: "What specialties are available?", description: "See available medical specialties" },
  ];

  const latestSuggestions = messages.length === 0
    ? DEFAULT_SUGGESTIONS
    : messages
        .filter((m) => m.role === "assistant" && m.suggestions && m.suggestions.length > 0)
        .pop()?.suggestions;

  return (
    <div className="flex h-screen flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="font-bold text-2xl">Doctor Search Assistant</h1>
        <div className="flex gap-2">
          <Button
            onClick={() => {
              setConversationId(undefined);
              setMessages([]);
            }}
            variant="outline"
          >
            New Chat
          </Button>
          <Link to="/">
            <Button variant="outline">Home</Button>
          </Link>
        </div>
      </div>

      <div className="flex flex-1 gap-4 overflow-hidden">
        <div className="w-64 flex-col gap-2 rounded-lg border bg-background p-4 hidden md:flex">
          <h2 className="mb-2 font-semibold">Previous Chats</h2>
          <ScrollArea className="flex-1">
            <div className="flex flex-col gap-2">
              {conversations?.map((conv) => (
                <Button
                  className={`justify-start text-left font-normal ${
                    conversationId === conv.id ? "bg-accent" : ""
                  }`}
                  key={conv.id}
                  onClick={() => setConversationId(conv.id)}
                  variant="ghost"
                >
                  <span className="truncate">{conv.title}</span>
                </Button>
              ))}
            </div>
          </ScrollArea>
        </div>

        <div className="flex-1 rounded-lg border bg-background overflow-hidden">
          <Chat
            isLoading={isLoading || isMessagesLoading}
            messages={messages}
            onSendMessage={handleSendMessage}
            suggestions={latestSuggestions}
          />
        </div>
      </div>
    </div>
  );
}
