import { useAuth } from "@clerk/expo";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter, useSegments } from "expo-router";
import {
  ArrowRight,
  MessageCircle,
  SendHorizonal,
  X,
} from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useToast } from "@/components/ui/toast";
import { orpc } from "@/utils/orpc";
import { useThemeColor } from "@/utils/theme";

const LOCAL_STORAGE_KEY = "chat_local_messages";

interface ChatMessage {
  content: string;
  doctorReferences?: Array<{ doctorId: string; displayName: string }>;
  role: "user" | "assistant";
  toolCallInProgress?: string;
}

const SUGGESTIONS = [
  "I've been feeling anxious lately",
  "I need help managing stress",
  "I'm having trouble sleeping",
  "What does the Sprite companion do?",
  "How do I book a doctor appointment?",
  "Tell me about the Stress Hub feature",
];

const MAX_MODAL_HEIGHT = 540;

async function loadLocalMessages(): Promise<ChatMessage[]> {
  try {
    const data = await AsyncStorage.getItem(LOCAL_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

async function saveLocalMessages(messages: ChatMessage[]) {
  try {
    await AsyncStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(messages));
  } catch {}
}

async function clearLocalMessages() {
  try {
    await AsyncStorage.removeItem(LOCAL_STORAGE_KEY);
  } catch {}
}

export function ChatOverlay() {
  const router = useRouter();
  const segments = useSegments();
  const isHome = segments[0] === "(guardian)" || segments[0] === "(patient)";
  const isLanding = segments[0] === "landing";
  const colors = useThemeColor();
  const insets = useSafeAreaInsets();
  const { toast } = useToast();
  const { isSignedIn, isLoaded } = useAuth();

  const [visible, setVisible] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);

  const scrollRef = useRef<ScrollView>(null);
  const cancelRef = useRef<(() => void) | null>(null);

  const hasMessages = messages.length > 0;
  const authReady = isLoaded;
  const showSignInPrompt = authReady && !isSignedIn && hasMessages;

  const historyQuery = useQuery(
    orpc.getChatHistory.queryOptions({
      input: { chatId: "default" },
      enabled: visible && !!isSignedIn,
      retry: false,
      meta: { ignoreError: true },
    })
  );

  useEffect(() => {
    if (!visible) {
      return;
    }
    if (isSignedIn) {
      if (historyQuery.data?.messages) {
        setMessages(historyQuery.data.messages as ChatMessage[]);
      }
    } else {
      loadLocalMessages().then(setMessages);
    }
  }, [visible, isSignedIn, historyQuery.data]);

  const clearHistoryMutation = useMutation(
    orpc.clearChatHistory.mutationOptions({
      onSuccess: () => {
        setMessages([]);
        toast({ type: "info", title: "Chat history cleared" });
      },
      onError: () => {
        toast({ type: "error", title: "Failed to clear history" });
      },
    })
  );

  const closeChat = useCallback(() => {
    if (cancelRef.current) {
      cancelRef.current();
      cancelRef.current = null;
    }
    setVisible(false);
  }, []);

  const handleSignIn = useCallback(() => {
    closeChat();
    setTimeout(() => {
      router.push("/sign-in");
    }, 400);
  }, [closeChat, router]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || streaming) {
      return;
    }

    setInput("");
    setStreaming(true);

    const userMessage: ChatMessage = { role: "user", content: text };

    // Instead of local state management, we rely on the refetch to avoid dupes
    // and just show a temporary pending message if needed.
    // But for simplicity, we'll just show the full history on finish.

    setMessages((prev) => [
      ...prev,
      userMessage,
      { role: "assistant", content: "" },
    ]);

    try {
      const iterator = await orpc.chatPatient.call({
        chatId: "default",
        messages: [
          {
            id: crypto.randomUUID(),
            role: "user",
            parts: [{ type: "text" as const, text }],
          },
        ],
      });

      let accumulatedText = "";

      const cancel = consumeEventIterator(iterator, {
        onEvent: (data: unknown) => {
          const event = data as {
            type: string;
            text?: string;
            toolName?: string;
            doctorId?: string;
            displayName?: string;
          };

          if (event.type === "tool-call-start") {
            setMessages((prev) => {
              const next = [...prev];
              const lastIdx = next.length - 1;
              if (next[lastIdx]?.role === "assistant") {
                next[lastIdx] = {
                  ...next[lastIdx],
                  content: "",
                  toolCallInProgress: event.toolName || "tool",
                };
              }
              return next;
            });
          } else if (event.type === "tool-call-end") {
            setMessages((prev) => {
              const next = [...prev];
              const lastIdx = next.length - 1;
              if (next[lastIdx]?.role === "assistant") {
                next[lastIdx] = {
                  ...next[lastIdx],
                  toolCallInProgress: undefined,
                };
              }
              return next;
            });
          } else if (event.type === "text-delta" && event.text) {
            accumulatedText += event.text;
            setMessages((prev) => {
              const next = [...prev];
              const lastIdx = next.length - 1;
              if (next[lastIdx]?.role === "assistant") {
                next[lastIdx] = {
                  ...next[lastIdx],
                  content: accumulatedText,
                  toolCallInProgress: undefined,
                };
              }
              return next;
            });
          } else if (event.type === "doctor-reference") {
            const doctorId = event.doctorId;
            const displayName = event.displayName;
            if (doctorId && displayName) {
              setMessages((prev) => {
                const next = [...prev];
                const lastIdx = next.length - 1;
                if (next[lastIdx]?.role === "assistant") {
                  const refs = next[lastIdx].doctorReferences || [];
                  if (!refs.some((r) => r.doctorId === doctorId)) {
                    next[lastIdx] = {
                      ...next[lastIdx],
                      doctorReferences: [...refs, { doctorId, displayName }],
                    };
                  }
                }
                return next;
              });
            }
          }
        },
        onFinish: () => {
          setStreaming(false);
          historyQuery.refetch();
        },
        onError: () => {
          setStreaming(false);
          historyQuery.refetch();
        },
      });

      cancelRef.current = cancel;
    } catch {
      setMessages((prev) => prev.slice(0, -1));
      toast({
        type: "error",
        title: "Chat error",
        message: "Failed to get response. Please try again.",
      });
      setStreaming(false);
    }
  }, [input, messages, streaming, toast, isSignedIn]);

  const handleClearHistory = useCallback(() => {
    if (isSignedIn) {
      if (clearHistoryMutation.isPending) {
        return;
      }
      clearHistoryMutation.mutate({ chatId: "default" });
    } else {
      clearLocalMessages();
      setMessages([]);
      toast({ type: "info", title: "Chat cleared" });
    }
  }, [clearHistoryMutation, isSignedIn, toast]);

  const scrollToEnd = useCallback(() => {
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, []);

  useEffect(() => {
    if (visible) {
      scrollToEnd();
    }
  }, [visible, messages, scrollToEnd]);

  return (
    <>
      {/* Chat Button */}
      <Pressable
        className="absolute right-6 z-50 h-14 w-14 items-center justify-center rounded-full"
        onPress={() => setVisible(true)}
        style={{
          backgroundColor: colors.primary,
          bottom: isLanding ? 24 : isHome ? 86 : 120,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 6,
          elevation: 8,
        }}
      >
        <MessageCircle color="#fff" size={26} strokeWidth={2} />
      </Pressable>

      {/* Chat Modal — bottom sheet style */}
      <Modal
        animationType="slide"
        onRequestClose={closeChat}
        transparent
        visible={visible}
      >
        <Pressable
          className="flex-1 justify-end bg-black/40"
          onPress={closeChat}
        >
          <Pressable onPress={() => {}}>
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : undefined}
              className="overflow-hidden rounded-t-[2rem] bg-background"
              style={{ maxHeight: MAX_MODAL_HEIGHT }}
            >
              {/* Header */}
              <View
                className="flex-row items-center justify-between border-border border-b-[3px] px-page pb-4"
                style={{ paddingTop: insets.top + 12 }}
              >
                <View className="flex-1">
                  <Text className="font-black font-sans text-foreground text-xl uppercase tracking-tight">
                    ZenDoc Assistant
                  </Text>
                  <Text className="font-medium font-sans text-muted-foreground text-xs">
                    Ask about features, find a doctor, or get wellness tips
                  </Text>
                </View>

                <View className="flex-row items-center gap-2">
                  {hasMessages && (
                    <Pressable
                      className="rounded-control border-2 border-border bg-card px-3 py-1.5"
                      onPress={handleClearHistory}
                    >
                      <Text className="font-bold font-sans text-[10px] text-muted-foreground uppercase tracking-wider">
                        Clear
                      </Text>
                    </Pressable>
                  )}
                  <Pressable
                    className="rounded-full border-2 border-border bg-card p-2"
                    onPress={closeChat}
                  >
                    <X color={colors.foreground} size={18} strokeWidth={2.5} />
                  </Pressable>
                </View>
              </View>

              {/* Sign-in prompt for non-signed-in users with history */}
              {showSignInPrompt && (
                <View className="mx-page mt-3 flex-row items-center gap-2 rounded-xl border-2 border-primary/30 bg-primary/10 px-4 py-3">
                  <View className="flex-1">
                    <Text className="font-bold font-sans text-foreground text-xs">
                      Sign in to save your chat history
                    </Text>
                    <Text className="font-medium font-sans text-[10px] text-muted-foreground">
                      Your current messages are saved on this device only
                    </Text>
                  </View>
                  <Pressable
                    className="rounded-lg bg-primary px-4 py-2"
                    onPress={handleSignIn}
                  >
                    <Text className="font-bold font-sans text-primary-foreground text-xs">
                      Sign In
                    </Text>
                  </Pressable>
                </View>
              )}

              {/* Messages */}
              <ScrollView
                className="flex-1 px-page"
                contentContainerStyle={{ paddingVertical: 16, flexGrow: 1 }}
                ref={scrollRef}
              >
                {hasMessages || streaming ? (
                  <View className="gap-4">
                    {messages.map((msg, index) => {
                      const isProcessingToolCall =
                        msg.role === "assistant" && msg.toolCallInProgress;

                      return (
                        <View
                          className={`max-w-[85%] rounded-card border-2 px-4 py-3 ${
                            msg.role === "user"
                              ? "self-end border-primary bg-primary/10"
                              : "self-start border-border bg-card"
                          }`}
                          key={index}
                        >
                          {isProcessingToolCall ? (
                            <View className="flex-row items-center gap-2">
                              <Text className="font-medium font-sans text-muted-foreground text-sm">
                                Calling {msg.toolCallInProgress}...
                              </Text>
                            </View>
                          ) : (
                            <Text
                              className={`font-medium font-sans text-sm leading-relaxed ${
                                msg.role === "user"
                                  ? "text-foreground"
                                  : "text-foreground/90"
                              }`}
                            >
                              <FormattedBold text={msg.content} />
                              {index === messages.length - 1 &&
                                msg.role === "assistant" &&
                                streaming &&
                                msg.content?.trim() && (
                                  <Text className="text-primary"> ▊</Text>
                                )}
                            </Text>
                          )}
                          {msg.role === "assistant" &&
                            msg.doctorReferences &&
                            msg.doctorReferences.length > 0 && (
                              <View className="mt-2 flex-row flex-wrap gap-2 border-border border-t pt-2">
                                {msg.doctorReferences.map((ref) => (
                                  <Pressable
                                    className="flex-row items-center gap-1 rounded-full bg-primary/10 px-3 py-1.5"
                                    key={ref.doctorId}
                                    onPress={() =>
                                      router.push(`/doctors/${ref.doctorId}`)
                                    }
                                  >
                                    <Text className="font-bold font-sans text-[10px] text-primary uppercase tracking-wider">
                                      {ref.displayName}
                                    </Text>
                                    <ArrowRight
                                      color={colors.primary}
                                      size={12}
                                      strokeWidth={2.5}
                                    />
                                  </Pressable>
                                ))}
                              </View>
                            )}
                        </View>
                      );
                    })}
                  </View>
                ) : (
                  <View className="flex-1 items-center justify-center gap-4 px-8">
                    <View className="h-16 w-16 items-center justify-center rounded-2xl border-[3px] border-border bg-card">
                      <MessageCircle
                        color={colors.primary}
                        size={32}
                        strokeWidth={2}
                      />
                    </View>
                    <Text className="text-center font-bold font-sans text-foreground text-lg">
                      {isSignedIn ? "How can we help you?" : "Ask a question"}
                    </Text>
                    <Text className="text-center font-medium font-sans text-muted-foreground text-sm leading-relaxed">
                      {isSignedIn
                        ? "Explore ZenDoc features, find a doctor, or get wellness tips."
                        : "Ask about ZenDoc features or find a doctor. Sign in to save your chat history."}
                    </Text>
                    {!isSignedIn && (
                      <Pressable
                        className="rounded-xl border-2 border-primary bg-primary px-6 py-3"
                        onPress={handleSignIn}
                      >
                        <Text className="font-bold font-sans text-primary-foreground text-sm">
                          Sign In to Get Started
                        </Text>
                      </Pressable>
                    )}
                    <View className="mt-2 w-full gap-2">
                      {SUGGESTIONS.map((suggestion) => (
                        <Pressable
                          className="rounded-card border-2 border-border/60 bg-card/50 px-4 py-3"
                          key={suggestion}
                          onPress={() => setInput(suggestion)}
                        >
                          <Text className="font-medium font-sans text-foreground/80 text-sm">
                            {suggestion}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                )}
              </ScrollView>

              {/* Input */}
              <View
                className="flex-row items-end gap-2 border-border border-t-[3px] px-page pt-3"
                style={{ paddingBottom: insets.bottom + 12 }}
              >
                <View className="flex-1 rounded-card border-2 border-border bg-card">
                  <TextInput
                    blurOnSubmit
                    className="max-h-24 px-4 py-3 font-medium font-sans text-foreground text-sm"
                    editable={!streaming}
                    multiline
                    onChangeText={setInput}
                    onSubmitEditing={handleSend}
                    placeholder="Ask about features, doctors, or wellness..."
                    placeholderTextColor={colors.mutedForeground}
                    value={input}
                  />
                </View>
                <Pressable
                  className="h-12 w-12 items-center justify-center rounded-card border-2 border-border bg-card"
                  disabled={!input.trim() || streaming}
                  onPress={handleSend}
                  style={{
                    opacity: !input.trim() || streaming ? 0.4 : 1,
                  }}
                >
                  <SendHorizonal
                    color={colors.primary}
                    size={20}
                    strokeWidth={2.5}
                  />
                </Pressable>
              </View>
            </KeyboardAvoidingView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

function FormattedBold({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <Text className="font-bold" key={i}>
              {part.slice(2, -2)}
            </Text>
          );
        }
        return <Text key={i}>{part}</Text>;
      })}
    </>
  );
}

function consumeEventIterator(
  iterator: AsyncIterable<unknown>,
  handlers: {
    onEvent: (data: unknown) => void;
    onFinish?: () => void;
    onError?: (error: unknown) => void;
  }
): () => void {
  let cancelled = false;

  const run = async () => {
    try {
      for await (const event of iterator) {
        if (cancelled) {
          break;
        }
        handlers.onEvent(event);
      }
      if (!cancelled) {
        handlers.onFinish?.();
      }
    } catch (error) {
      if (!cancelled) {
        handlers.onError?.(error);
      }
    }
  };

  run();

  return () => {
    cancelled = true;
    (iterator as unknown as AsyncIterator<unknown>).return?.();
  };
}
