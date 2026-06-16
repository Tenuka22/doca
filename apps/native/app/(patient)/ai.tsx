"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  View,
} from "react-native";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { _client, orpc, queryClient } from "@/utils/orpc";

interface ChatMsg {
  agent?: string;
  content: string;
  id: string;
  role: "user" | "assistant" | "tool_call";
  toolName?: string;
}

const qc = queryClient;

export default function AiChatScreen() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [streaming, setStreaming] = useState(false);
  const [showSessions, setShowSessions] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const abortRef = useRef<AbortController | null>(null);

  // ── Sessions ──

  const sessionsQuery = useQuery(
    orpc.ai.chat.sessions.queryOptions({ input: { limit: 50 } })
  );

  const createMutation = useMutation(
    orpc.ai.chat.create.mutationOptions({
      onSuccess: (s) => {
        setActiveSessionId(s.id);
        setMessages([]);
        qc.invalidateQueries({ queryKey: ["ai"] });
        setShowSessions(false);
      },
    })
  );

  const deleteMutation = useMutation(
    orpc.ai.chat.delete.mutationOptions({
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ["ai"] });
        const remaining = sessionsQuery.data?.sessions?.filter(
          (s) => s.id !== activeSessionId
        );
        if (remaining?.length) {
          switchSession(remaining[0].id);
        } else {
          setActiveSessionId(null);
          setMessages([]);
        }
      },
    })
  );

  // ── History ──

  const loadHistory = useCallback(async (sid: string) => {
    try {
      const data = await _client.ai.chat.history({
        sessionId: sid,
        limit: 100,
      });
      const history: ChatMsg[] = (
        data as Array<{
          id: string;
          role: string;
          content: string;
          agent?: string;
        }>
      ).map((m) => ({
        id: m.id,
        role: m.role === "user" ? "user" : "assistant",
        content: m.content,
        agent: m.agent,
      }));
      setMessages(history);
    } catch {
      setMessages([]);
    }
  }, []);

  const switchSession = useCallback(
    (sid: string) => {
      setActiveSessionId(sid);
      loadHistory(sid);
      setShowSessions(false);
    },
    [loadHistory]
  );

  // ── Send (streaming via oRPC EventIterator) ──

  const sendMessage = async () => {
    if (!input.trim() || streaming) {
      return;
    }
    const text = input.trim();
    setInput("");

    let sid = activeSessionId;
    if (!sid) {
      const s = await createMutation.mutateAsync({ title: text.slice(0, 50) });
      sid = s.id;
    }

    const userMsg: ChatMsg = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
    };
    setMessages((prev) => [...prev, userMsg]);
    setStreaming(true);

    const ac = new AbortController();
    abortRef.current = ac;

    try {
      const iter = await _client.ai.chat.send(
        { sessionId: sid, message: text },
        { signal: ac.signal }
      );

      let assistantContent = "";
      for await (const event of iter) {
        console.log(event);
        const ev = (event as { event: string; data: Record<string, unknown> })
          .event;
        const d = (event as { event: string; data: Record<string, unknown> })
          .data;

        if (ev === "message.token") {
          const tk = (d.token as string) ?? "";
          assistantContent += tk;
          setMessages((prev) => {
            const cp = [...prev];
            const last = cp[cp.length - 1];
            if (last?.role === "assistant" && last.id === sid) {
              cp[cp.length - 1] = { ...last, content: assistantContent };
            } else {
              cp.push({
                id: sid!,
                role: "assistant",
                content: assistantContent,
                agent: d.agent as string,
              });
            }
            return cp;
          });
        } else if (ev === "message.tool_call") {
          setMessages((prev) => [
            ...prev,
            {
              id: crypto.randomUUID(),
              role: "tool_call",
              content: `Using ${d.tool as string}...`,
              toolName: d.tool as string,
            },
          ]);
        } else if (ev === "message.end") {
          setMessages((prev) => {
            const cp = [...prev];
            const last = cp[cp.length - 1];
            if (last?.role === "assistant") {
              cp[cp.length - 1] = {
                ...last,
                content: (d.finalResponse as string) || assistantContent,
              };
            }
            return cp;
          });
          qc.invalidateQueries({ queryKey: ["ai"] });
        } else if (ev === "message.error") {
          setMessages((prev) => [
            ...prev,
            {
              id: crypto.randomUUID(),
              role: "assistant",
              content: `Error: ${(d.error as string) ?? "Unknown"}`,
            },
          ]);
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        return;
      }
      const msg = err instanceof Error ? err.message : "Unknown error";
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: `Error: ${msg}`,
        },
      ]);
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  };

  const stopStreaming = () => {
    abortRef.current?.abort();
  };

  const activeSession = sessionsQuery.data?.sessions?.find(
    (s) => s.id === activeSessionId
  );

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center justify-between border-border border-b bg-card px-page py-3">
        <Pressable
          className="flex-1"
          onPress={() => setShowSessions((v) => !v)}
        >
          <Text
            className="font-bold font-sans text-base text-foreground"
            numberOfLines={1}
          >
            {activeSession?.title ?? "AI Assistant"}
          </Text>
          <Text className="font-sans text-muted-foreground text-xs">
            {activeSession
              ? `${activeSession.messageCount} messages`
              : "Tap to start"}
          </Text>
        </Pressable>
        <Button
          onPress={() => createMutation.mutate({ title: "New Chat" })}
          size="sm"
          variant="ghost"
        >
          +
        </Button>
      </View>

      {/* Sessions panel */}
      {showSessions && (
        <View className="max-h-60 border-border border-b bg-card">
          {sessionsQuery.isLoading && <ActivityIndicator className="py-4" />}
          {sessionsQuery.data?.sessions?.map((s) => (
            <Pressable
              className="flex-row items-center justify-between px-page py-3 active:bg-muted"
              key={s.id}
              onPress={() => switchSession(s.id)}
            >
              <View className="flex-1">
                <Text
                  className="font-sans text-foreground text-sm"
                  numberOfLines={1}
                >
                  {s.title}
                </Text>
                <Text className="font-sans text-muted-foreground text-xs">
                  {s.messageCount} msgs ·{" "}
                  {new Date(s.updatedAt).toLocaleDateString()}
                </Text>
              </View>
              <Button
                onPress={() =>
                  Alert.alert("Delete session?", s.title, [
                    { text: "Cancel", style: "cancel" },
                    {
                      text: "Delete",
                      style: "destructive",
                      onPress: () => deleteMutation.mutate({ sessionId: s.id }),
                    },
                  ])
                }
                size="sm"
                variant="ghost"
              >
                ✕
              </Button>
            </Pressable>
          ))}
          {sessionsQuery.data?.sessions?.length === 0 && (
            <Text className="px-page py-4 font-sans text-muted-foreground text-sm">
              No sessions yet
            </Text>
          )}
        </View>
      )}

      {/* Messages */}
      <FlatList
        className="flex-1 px-page"
        contentContainerStyle={{ paddingVertical: 12 }}
        data={messages}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          activeSessionId ? null : (
            <View className="flex-1 items-center justify-center pt-20">
              <Text className="px-8 text-center font-sans text-lg text-muted-foreground">
                Tap + to start a new conversation
              </Text>
            </View>
          )
        }
        onContentSizeChange={() =>
          flatListRef.current?.scrollToEnd({ animated: true })
        }
        ref={flatListRef}
        renderItem={({ item }) => {
          if (item.role === "tool_call") {
            return (
              <View className="mb-2 flex-row items-center gap-2 self-center px-3 py-1">
                <ActivityIndicator size="small" />
                <Text className="font-sans text-muted-foreground text-xs italic">
                  {item.content}
                </Text>
              </View>
            );
          }
          return (
            <View
              className={`mb-3 max-w-[85%] rounded-2xl px-4 py-3 ${
                item.role === "user"
                  ? "self-end bg-primary"
                  : "self-start bg-card"
              }`}
            >
              {item.agent && (
                <Text className="mb-1 font-bold text-[10px] uppercase tracking-wide opacity-50">
                  {item.agent}
                </Text>
              )}
              <Text
                className={`font-sans text-base ${item.role === "user" ? "text-primary-foreground" : "text-foreground"}`}
              >
                {item.content}
              </Text>
            </View>
          );
        }}
      />

      {/* Streaming controls */}
      {streaming && (
        <View className="flex-row items-center justify-center gap-3 py-1">
          <ActivityIndicator size="small" />
          <Text className="font-sans text-muted-foreground text-xs">
            Assistant is typing...
          </Text>
          <Pressable
            className="rounded bg-destructive/20 px-3 py-1"
            onPress={stopStreaming}
          >
            <Text className="font-bold font-sans text-destructive text-xs">
              Stop
            </Text>
          </Pressable>
        </View>
      )}

      {/* Input */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={80}
      >
        <View className="flex-row items-end gap-2 border-border border-t bg-card px-page py-3">
          <View className="flex-1">
            <Input
              editable={!streaming}
              label=""
              multiline
              onChangeText={setInput}
              placeholder="Ask about doctors, appointments..."
              value={input}
            />
          </View>
          <Button
            disabled={streaming || !input.trim()}
            onPress={sendMessage}
            size="sm"
          >
            Send
          </Button>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
