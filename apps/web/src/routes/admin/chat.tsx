import { useUser } from "@clerk/tanstack-react-start";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Badge } from "@zen-doc/ui/components/badge";
import { Button } from "@zen-doc/ui/components/button";
import { Card, CardContent } from "@zen-doc/ui/components/card";
import {
  ArrowRight,
  Bot,
  MessageCircle,
  SendHorizonal,
  ShieldIcon,
  Sparkles,
  Trash2,
  User,
} from "lucide-react";
import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { orpc } from "@/utils/orpc";

interface ChatMessage {
  content: string;
  doctorReferences?: Array<{ doctorId: string; displayName: string }>;
  role: "user" | "assistant";
}

const SUGGESTIONS = [
  "I've been feeling anxious lately",
  "I need help managing stress",
  "What doctors specialize in sleep disorders?",
  "Find me a therapist for relationship counseling",
];

function FormattedText({ text }: { text: string }) {
  if (!text) {
    return null;
  }
  const parts = text.split(/(\*\*[^*]+\*\*)/);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return <strong key={i}>{part.slice(2, -2)}</strong>;
        }
        return <Fragment key={i}>{part}</Fragment>;
      })}
    </>
  );
}

const DEFAULT_CHAT_ID = "admin-test";

export const Route = createFileRoute("/admin/chat")({
  component: AdminChatPage,
});

function AdminChatPage() {
  const { user } = useUser();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [toolCallInProgress, setToolCallInProgress] = useState<string | null>(null);
  const cancelRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatId = DEFAULT_CHAT_ID;

  const hasMessages = messages.length > 0;
  const isAdmin = user?.publicMetadata?.role === "admin";

  const historyQuery = useQuery(
    orpc.getChatHistory.queryOptions({
      input: { chatId },
      enabled: !!user,
      retry: false,
      meta: { ignoreError: true },
    })
  );

  const clearMutation = useMutation(
    orpc.clearChatHistory.mutationOptions({
      onSuccess: () => {
        setMessages([]);
        historyQuery.refetch();
      },
    })
  );

  useEffect(() => {
    if (historyQuery.data && messages.length === 0) {
      setMessages(historyQuery.data.messages as ChatMessage[]);
    }
  }, [historyQuery.data]);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      const viewport = scrollRef.current.querySelector(
        "[data-slot='scroll-area-viewport']"
      );
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || streaming) return;

    setInput("");
    setStreaming(true);

    const userMessage: ChatMessage = { role: "user", content: text };
    setMessages((prev) => [...prev, userMessage, { role: "assistant", content: "" }]);

    const controller = new AbortController();
    cancelRef.current = controller;

    try {
      const iterator = await orpc.chatPatient.call(
        {
          chatId,
          messages: [{
            id: crypto.randomUUID(),
            role: "user",
            parts: [{ type: "text" as const, text }],
          }],
        },
        { signal: controller.signal }
      );

      let buffer = "";
      const refs: ChatMessage["doctorReferences"] = [];

      for await (const event of iterator) {
        if (controller.signal.aborted) break;

        const chunk = event as {
          type: string;
          text?: string;
          toolName?: string;
          doctorId?: string;
          displayName?: string;
          doctors?: Array<{ doctorId: string; displayName: string }>;
        };

        if (chunk.type === "tool-call-start") {
          setToolCallInProgress(chunk.toolName || "tool");
        } else if (chunk.type === "tool-call-end") {
          setToolCallInProgress(null);
        } else if (chunk.type === "text-delta" && chunk.text) {
          buffer = chunk.text;
          setMessages((prev) => {
            const next = [...prev];
            const last = next[next.length - 1];
            if (last?.role === "assistant") {
              next[next.length - 1] = {
                role: "assistant",
                content: buffer,
                doctorReferences: refs.length ? [...refs] : undefined,
              };
            }
            return next;
          });
        } else if (chunk.type === "doctor-reference" && chunk.doctorId && chunk.displayName) {
          if (!refs.some((r) => r.doctorId === chunk.doctorId)) {
            refs.push({ doctorId: chunk.doctorId, displayName: chunk.displayName });
          }
        } else if (chunk.type === "related-doctors-mentioned" && chunk.doctors) {
          for (const doc of chunk.doctors) {
            if (!refs.some((r) => r.doctorId === doc.doctorId)) {
              refs.push({ doctorId: doc.doctorId, displayName: doc.displayName });
            }
          }
        }
      }
    } catch {
      if (!controller.signal.aborted) {
        setMessages((prev) => prev.slice(0, -1));
      }
    } finally {
      setStreaming(false);
      setToolCallInProgress(null);
      cancelRef.current = null;
    }
  }, [input, streaming, chatId]);

  const handleClear = useCallback(() => {
    if (cancelRef.current) {
      cancelRef.current.abort();
      cancelRef.current = null;
    }
    clearMutation.mutate({ chatId });
  }, [clearMutation, chatId]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        e.currentTarget.form?.requestSubmit();
      }
    },
    []
  );

  if (!user) {
    return null;
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <Card className="w-full max-w-md rounded-3xl">
          <CardContent className="flex flex-col items-center p-6 text-center">
            <div className="mb-4 inline-flex rounded-2xl border bg-muted/40 p-4">
              <ShieldIcon className="size-6" />
            </div>
            <h2 className="mb-2 font-semibold text-xl tracking-tight">
              Unauthorized
            </h2>
            <p className="text-muted-foreground text-sm">
              You do not have admin access.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-4rem)] max-w-5xl flex-col gap-6">
      <Card className="shrink-0 overflow-hidden rounded-[2rem] border-border/60 bg-gradient-to-br from-background via-background to-muted/20">
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">Admin console</Badge>
              <Badge variant="secondary">AI Chat</Badge>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <h1 className="font-semibold text-4xl tracking-tight">
                  AI Chat Test
                </h1>
                <p className="max-w-2xl text-muted-foreground text-sm md:text-base">
                  Test the AI doctor recommendation chat assistant.
                </p>
              </div>

              {hasMessages && (
                <Button
                  disabled={clearMutation.isPending}
                  onClick={handleClear}
                  size="sm"
                  variant="outline"
                >
                  <Trash2 className="mr-2 size-4" />
                  Clear
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-lg">
        <div className="h-[80vh] flex-1 overflow-y-auto bg-muted/20">
          {hasMessages || streaming ? (
            <div className="flex flex-col gap-6 p-6">
              {messages.map((msg, index) => {
                const isUser = msg.role === "user";
                const isLast = index === messages.length - 1;

                // Skip rendering empty assistant messages (usually tool calls in history)
                // except when it's the very last message and we are currently streaming.
                if (
                  !(isUser || msg.content?.trim() || (streaming && isLast))
                ) {
                  return null;
                }

                // Show tool call indicator when a tool is running
                const isProcessingToolCall = !isUser && toolCallInProgress && isLast;

                return (
                  <div
                    className={`flex items-start gap-3 ${isUser ? "flex-row-reverse" : ""}`}
                    key={index}
                  >
                    <div
                      className={`flex size-8 shrink-0 items-center justify-center rounded-full border ${
                        isUser
                          ? "border-primary/30 bg-primary/10 text-primary"
                          : "border-border bg-card text-muted-foreground"
                      }`}
                    >
                      {isUser ? (
                        <User className="size-4" />
                      ) : (
                        <Bot className="size-4" />
                      )}
                    </div>
                    <div
                      className={`max-w-[75%] rounded-2xl border px-4 py-3 ${
                        isUser
                          ? "border-primary/20 bg-primary/10"
                          : "border-border bg-card"
                      }`}
                    >
                      {isProcessingToolCall ? (
                        <div className="flex items-center gap-2 text-muted-foreground text-sm">
                          <div className="size-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                          <span>Calling {toolCallInProgress}...</span>
                        </div>
                      ) : (
                        <div className="whitespace-pre-wrap text-sm leading-relaxed">
                          <FormattedText text={msg.content} />
                          {isLast &&
                            msg.role === "assistant" &&
                            streaming &&
                            msg.content?.trim() && (
                              <span className="ml-0.5 inline-block animate-pulse text-primary">
                                ▊
                              </span>
                            )}
                        </div>
                      )}
                      {msg.role === "assistant" &&
                        msg.doctorReferences &&
                        msg.doctorReferences.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2 border-border border-t pt-2">
                            {msg.doctorReferences.map((ref) => (
                              <a
                                className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 font-bold text-[10px] text-primary uppercase tracking-wider transition-colors hover:bg-primary/20"
                                href={`/doctors/${ref.doctorId}`}
                                key={ref.doctorId}
                              >
                                {ref.displayName}
                                <ArrowRight className="size-3" />
                              </a>
                            ))}
                          </div>
                        )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-6 px-6 py-24">
              <div className="inline-flex size-16 items-center justify-center rounded-2xl border-[3px] border-border bg-card shadow-sm">
                <Sparkles className="size-8 text-primary" />
              </div>
              <div className="space-y-2 text-center">
                <h2 className="font-semibold text-xl tracking-tight">
                  Test the Chat Assistant
                </h2>
                <p className="mx-auto max-w-md text-muted-foreground text-sm">
                  Describe symptoms or ask for a doctor recommendation. The AI
                  will match you with relevant specialists.
                </p>
              </div>
              <div className="flex w-full max-w-lg flex-wrap justify-center gap-2">
                {SUGGESTIONS.map((suggestion) => (
                  <Button
                    className="rounded-full"
                    key={suggestion}
                    onClick={() => setInput(suggestion)}
                    size="sm"
                    variant="secondary"
                  >
                    <MessageCircle className="mr-2 size-3" />
                    {suggestion}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="border-border border-t bg-background p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
          >
            <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card px-3 py-2 focus-within:ring-1 focus-within:ring-ring">
              <textarea
                className="w-full resize-none bg-transparent text-foreground text-sm outline-none placeholder:text-muted-foreground disabled:opacity-50"
                disabled={streaming}
                onChange={(e) => setInput(e.target.value)}
                onInput={(e) => {
                  const target = e.currentTarget;
                  target.style.height = "auto";
                  target.style.height = `${Math.min(target.scrollHeight, 200)}px`;
                }}
                onKeyDown={handleKeyDown}
                placeholder="Describe your concerns..."
                ref={textareaRef}
                rows={1}
                value={input}
              />
              <div className="flex items-center justify-end">
                <div className="flex items-center gap-2">
                  <Button
                    className="size-8 rounded-full"
                    disabled={!input.trim() || streaming}
                    size="icon"
                    type="submit"
                  >
                    {streaming ? (
                      <div className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    ) : (
                      <SendHorizonal className="size-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
