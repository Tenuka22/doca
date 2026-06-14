import { Badge } from "@doca/ui/components/badge";
import { Button } from "@doca/ui/components/button";
import type { ChatMessage } from "@doca/ui/components/chat";
import { Chat } from "@doca/ui/components/chat";
import { Input } from "@doca/ui/components/input";
import { ScrollArea } from "@doca/ui/components/scroll-area";
import { Skeleton } from "@doca/ui/components/skeleton";
import { cn } from "@doca/ui/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { History, MessageSquarePlus, SearchIcon } from "lucide-react";
import * as React from "react";
import { client, orpc } from "@/utils/orpc";

export const Route = createFileRoute("/chat")({
  component: ChatPage,
});

function ChatPage() {
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = React.useState<string>();
  const [isLoading, setIsLoading] = React.useState(false);
  const [status, setStatus] = React.useState<string>();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [sidebarOpen, setSidebarOpen] = React.useState(true);

  const { data: conversations, refetch: refetchConversations } = useQuery(
    orpc.chat.getConversations.queryOptions({ input: {} })
  );

  const { data: previousMessages, isLoading: isMessagesLoading } = useQuery({
    ...orpc.chat.getMessages.queryOptions({
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
    } else if (!conversationId) {
      setMessages([]);
    }
  }, [previousMessages, conversationId]);

  const filteredConversations = React.useMemo(
    () =>
      conversations?.filter((conv) =>
        conv.title.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [conversations, searchQuery]
  );

  const handleSendMessage = React.useCallback(
    async (message: string) => {
      if (!message.trim()) {
        return;
      }

      setIsLoading(true);

      try {
        const stream = await client.chat.sendMessage({
          message,
          conversationId,
          system: "doctor_search",
        });

        let currentAssistantMessageId: string | null = null;

        for await (const anyEvent of stream) {
          const event = anyEvent as any;
          if (event.type === "message") {
            setMessages((prev) => {
              if (prev.some((m) => m.id === event.data.id)) {
                return prev;
              }
              return [...prev, event.data as ChatMessage];
            });
          } else if (event.type === "status") {
            setStatus(event.status);
          } else if (event.type === "tool_call") {
            setMessages((prev) => {
              const last = prev[prev.length - 1];
              const tc = { name: event.name, args: event.data, id: event.id };
              if (
                last &&
                last.role === "assistant" &&
                last.id === currentAssistantMessageId
              ) {
                return [
                  ...prev.slice(0, -1),
                  { ...last, toolCalls: [...(last.toolCalls || []), tc] },
                ];
              }
              const newId = crypto.randomUUID();
              currentAssistantMessageId = newId;
              return [
                ...prev,
                {
                  id: newId,
                  role: "assistant",
                  content: "",
                  toolCalls: [tc],
                  timestamp: new Date().toISOString(),
                },
              ];
            });
          } else if (event.type === "tool_result") {
            setMessages((prev) => {
              const last = prev[prev.length - 1];
              if (
                last &&
                last.role === "assistant" &&
                last.id === currentAssistantMessageId
              ) {
                return [
                  ...prev.slice(0, -1),
                  {
                    ...last,
                    toolCalls: last.toolCalls?.map((tc) =>
                      tc.id === event.id || tc.name === event.name
                        ? { ...tc, result: event.data }
                        : tc
                    ),
                  },
                ];
              }
              return prev;
            });
          } else if (event.type === "token") {
            setStatus(undefined);
            setMessages((prev) => {
              const last = prev[prev.length - 1];
              if (
                last &&
                last.role === "assistant" &&
                last.id === currentAssistantMessageId
              ) {
                return [
                  ...prev.slice(0, -1),
                  { ...last, content: last.content + event.content },
                ];
              }
              const newId = crypto.randomUUID();
              currentAssistantMessageId = newId;
              return [
                ...prev,
                {
                  id: newId,
                  role: "assistant",
                  content: event.content,
                  timestamp: new Date().toISOString(),
                },
              ];
            });
          } else if (event.type === "result") {
            setStatus(undefined);
            setMessages((prev) => {
              const last = prev[prev.length - 1];
              if (
                last &&
                last.role === "assistant" &&
                last.id === currentAssistantMessageId
              ) {
                return [
                  ...prev.slice(0, -1),
                  {
                    ...last,
                    content: event.content,
                    suggestions: event.suggestions,
                  },
                ];
              }
              return [
                ...prev,
                {
                  id: crypto.randomUUID(),
                  role: "assistant",
                  content: event.content,
                  suggestions: event.suggestions,
                  timestamp: new Date().toISOString(),
                },
              ];
            });
          } else if (event.type === "done") {
            if (!conversationId) {
              setConversationId(event.conversationId);
            }
            refetchConversations();
          }
        }
      } catch (e) {
        console.error("Chat error:", e);
      } finally {
        setIsLoading(false);
        setStatus(undefined);
      }
    },
    [conversationId, refetchConversations]
  );

  const DEFAULT_SUGGESTIONS = [
    {
      label: "Find a specialist",
      value: "I need to find a specialist",
      description: "Search for doctors by specific medical specialty",
    },
    {
      label: "Near me",
      value: "Find doctors near me",
      description: "Locate medical professionals in your area",
    },
    {
      label: "Check profile",
      value: "Tell me about a doctor",
      description: "Get background and experience details",
    },
  ];

  const latestSuggestions =
    messages.length === 0
      ? DEFAULT_SUGGESTIONS
      : messages
          .filter(
            (m) =>
              m.role === "assistant" &&
              m.suggestions &&
              m.suggestions.length > 0
          )
          .pop()?.suggestions;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Sidebar */}
      <aside
        className={cn(
          "flex flex-col border-r bg-muted/30 transition-all duration-300",
          sidebarOpen ? "w-80" : "-ml-80 w-0"
        )}
      >
        {/* Sidebar Header */}
        <div className="relative h-32 overflow-hidden bg-gradient-to-r from-primary/20 via-primary/10 to-background md:h-40">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(120,119,198,0.15),transparent_50%)]" />
          <div className="absolute bottom-4 left-4">
            <div className="flex items-center gap-2">
              <div className="flex size-9 items-center justify-center rounded-lg bg-primary shadow-md">
                <SearchIcon className="size-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-semibold text-sm tracking-tight">
                  Doca Assistant
                </h1>
                <p className="text-[10px] text-muted-foreground">
                  AI Medical Search
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* New Chat Button */}
        <div className="p-3">
          <Button
            className="w-full gap-2 rounded-full shadow-sm"
            onClick={() => {
              setConversationId(undefined);
              setMessages([]);
            }}
          >
            <MessageSquarePlus className="size-4" />
            New Search
          </Button>
        </div>

        {/* Search Conversations */}
        <div className="px-3 pb-2">
          <div className="relative">
            <SearchIcon className="absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="h-9 rounded-full border-none bg-muted/50 pl-9 text-xs focus-visible:ring-1 focus-visible:ring-primary/50"
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter conversations..."
              value={searchQuery}
            />
          </div>
        </div>

        {/* Conversation List */}
        <div className="mb-2 flex items-center gap-2 px-5 font-semibold text-[10px] text-muted-foreground uppercase tracking-widest">
          <History className="size-3" />
          Recent
        </div>

        <ScrollArea className="flex-1 px-2">
          <div className="flex flex-col gap-0.5 pr-2">
            {filteredConversations?.length === 0 && (
              <p className="px-3 py-8 text-center text-muted-foreground text-xs">
                No conversations yet
              </p>
            )}
            {filteredConversations?.map((conv) => (
              <Button
                className={cn(
                  "group h-auto w-full justify-start gap-3 rounded-xl border py-2.5 pr-2 pl-3 text-left transition-all",
                  conversationId === conv.id
                    ? "border-border bg-background shadow-sm"
                    : "border-transparent font-normal hover:bg-muted"
                )}
                key={conv.id}
                onClick={() => setConversationId(conv.id)}
                variant="ghost"
              >
                <div
                  className={cn(
                    "size-2 shrink-0 rounded-full transition-all",
                    conversationId === conv.id
                      ? "bg-primary"
                      : "bg-transparent group-hover:bg-muted-foreground/20"
                  )}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-sm">{conv.title}</p>
                  <p className="truncate text-[10px] text-muted-foreground opacity-70">
                    {new Date(conv.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              </Button>
            ))}
            {filteredConversations && filteredConversations.length > 0 && (
              <div className="px-3 pt-3 text-center">
                <Badge className="px-2 py-0 text-[10px]" variant="secondary">
                  {filteredConversations.length} conversations
                </Badge>
              </div>
            )}
          </div>
        </ScrollArea>
      </aside>

      {/* Sidebar toggle button (when closed) */}
      {!sidebarOpen && (
        <Button
          className="absolute top-3 left-3 z-10 size-9 rounded-full bg-background/80 shadow-md backdrop-blur-sm"
          onClick={() => setSidebarOpen(true)}
          size="icon"
          variant="outline"
        >
          <History className="size-4" />
        </Button>
      )}

      {/* Main Chat Area */}
      <main className="relative flex flex-1 flex-col overflow-hidden">
        {/* Mobile sidebar toggle */}
        <div className="flex items-center justify-between border-b px-4 py-2 md:hidden">
          <Button
            className="size-8 rounded-full"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            size="icon"
            variant="ghost"
          >
            <History className="size-4" />
          </Button>
          <div className="flex items-center gap-2">
            <Badge className="gap-1" variant="default">
              <SearchIcon className="size-3" />
              Doctor Search
            </Badge>
          </div>
          <Button
            className="size-8 rounded-full"
            onClick={() => {
              setConversationId(undefined);
              setMessages([]);
            }}
            size="icon"
            variant="ghost"
          >
            <MessageSquarePlus className="size-4" />
          </Button>
        </div>

        {/* Loading state */}
        {isMessagesLoading && (
          <div className="flex flex-col gap-4 p-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                className={cn(
                  "flex",
                  i % 2 === 0 ? "justify-end" : "justify-start"
                )}
                key={i.toString()}
              >
                <div className="flex max-w-[75%] flex-col gap-2">
                  <Skeleton
                    className={cn(
                      "h-8 rounded-2xl",
                      i % 2 === 0 ? "rounded-tr-none" : "rounded-tl-none"
                    )}
                  />
                  <Skeleton className="h-4 w-2/3 rounded-2xl" />
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex-1">
          <Chat
            isLoading={isLoading || isMessagesLoading}
            messages={messages}
            onSendMessage={handleSendMessage}
            status={status}
            suggestions={latestSuggestions}
          />
        </div>
      </main>
    </div>
  );
}
