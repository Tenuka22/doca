"use client";

import { useMutation } from "@tanstack/react-query";
import { Stack } from "expo-router";
import {
  Copy,
  Mic,
  MicOff,
  PhoneOff,
  Shield,
  Video,
  VideoOff,
} from "lucide-react-native";
import { useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { Button } from "@/components/design/ui/button";
import { Input } from "@/components/design/ui/input";
import { Screen } from "@/components/design/ui/screen";
import { ToggleGroup } from "@/components/design/ui/toggle-group";
import { useLiveKitRoom } from "@/hooks/use-livekit-room";
import { orpc } from "@/utils/orpc";

type Role = "patient" | "doctor" | "admin";

function TestVideoRoom({
  lk,
  isMock,
  sessionId,
  onDisconnect,
}: {
  lk: ReturnType<typeof useLiveKitRoom>;
  isMock: boolean;
  sessionId: string;
  onDisconnect: () => void;
}) {
  return (
    <View className="flex-1 bg-background">
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-1">
        <View className="flex-1 items-center justify-center bg-foreground/5">
          {lk.remoteParticipants.length > 0 ? (
            <View className="w-full flex-1 gap-2 p-4">
              {lk.remoteParticipants.map((p) => (
                <View
                  className="flex-1 items-center justify-center overflow-hidden rounded-3xl bg-background-elevated"
                  key={p.identity}
                >
                  {p.streamURL ? (
                    <View className="w-full flex-1" />
                  ) : (
                    <View className="items-center gap-2">
                      <View className="rounded-full bg-accent/10 p-4">
                        <Shield className="text-accent" size={32} />
                      </View>
                      <Text className="font-poppins-medium text-foreground-muted text-sm">
                        {p.displayName}
                      </Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          ) : (
            <View className="items-center gap-3">
              <View className="rounded-full bg-accent/10 p-4">
                <Shield className="text-accent" size={32} />
              </View>
              <Text className="font-poppins-medium text-foreground-muted">
                {isMock
                  ? "Mock simulation — no remote participants"
                  : `Waiting for participants in "${sessionId.slice(0, 8)}"`}
              </Text>
              {lk.localStreamURL ? (
                <Text className="text-foreground-muted text-micro">
                  Camera active
                </Text>
              ) : null}
            </View>
          )}
        </View>

        {lk.localStreamURL ? (
          <View className="absolute top-20 right-4 h-32 w-24 overflow-hidden rounded-2xl border-2 border-border bg-background-elevated shadow-lg" />
        ) : null}

        {lk.error ? (
          <View className="mx-4 mt-2 rounded-2xl bg-destructive/10 p-3">
            <Text className="text-center font-poppins-medium text-destructive text-sm">
              {lk.error}
            </Text>
          </View>
        ) : null}

        <View className="gap-4 border-border/50 border-t bg-background-elevated px-6 py-6">
          <View className="items-center gap-1">
            <Text className="font-poppins-medium text-foreground-muted text-sm">
              {lk.isConnecting
                ? "Connecting..."
                : `Connected — ${lk.remoteParticipants.length} participant${lk.remoteParticipants.length === 1 ? "" : "s"}`}
            </Text>
            <Text className="text-foreground-muted text-micro">
              Session: {sessionId.slice(0, 8)}
              {isMock ? " (mock)" : ""}
            </Text>
          </View>

          <View className="flex-row justify-center gap-4">
            <Pressable
              className={`h-14 w-14 items-center justify-center rounded-full ${lk.isCameraEnabled ? "bg-accent/10" : "bg-destructive/10"}`}
              onPress={lk.toggleCamera}
            >
              {lk.isCameraEnabled ? (
                <Video className="text-accent" size={22} />
              ) : (
                <VideoOff className="text-destructive" size={22} />
              )}
            </Pressable>

            <Pressable
              className={`h-14 w-14 items-center justify-center rounded-full ${lk.isMicEnabled ? "bg-accent/10" : "bg-destructive/10"}`}
              onPress={lk.toggleMic}
            >
              {lk.isMicEnabled ? (
                <Mic className="text-accent" size={22} />
              ) : (
                <MicOff className="text-destructive" size={22} />
              )}
            </Pressable>

            <Pressable
              className="h-14 w-14 items-center justify-center rounded-full bg-destructive/20"
              onPress={onDisconnect}
            >
              <PhoneOff className="text-destructive" size={22} />
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

export default function TestSessionsScreen() {
  const [sessionId, setSessionId] = useState("");
  const [generatedSessionId, setGeneratedSessionId] = useState("");
  const [copied, setCopied] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role>("patient");
  const [isConnected, setIsConnected] = useState(false);
  const [isMock, setIsMock] = useState(false);

  const lk = useLiveKitRoom({
    onConnected: () => setIsConnected(true),
    onDisconnected: () => {
      setIsConnected(false);
      setIsMock(false);
    },
  });

  const createSession = useMutation(
    orpc.createTestSession.mutationOptions({
      onSuccess: (result) => {
        setGeneratedSessionId(result.sessionId);
        setSessionId(result.sessionId);
      },
    })
  );

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedSessionId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleJoin = async () => {
    if (!sessionId) {
      return;
    }

    try {
      const { token, serverUrl } = await orpc.getTestLiveKitToken.call({
        sessionId,
      });
      await lk.connect(serverUrl, token);
    } catch {
      // Token fetch or connection failed silently
    }
  };

  const handleDisconnect = async () => {
    await lk.disconnect();
    setIsConnected(false);
    setIsMock(false);
  };

  const handleMockSimulation = () => {
    setIsMock(true);
    setIsConnected(true);
  };

  if (isConnected) {
    return (
      <TestVideoRoom
        isMock={isMock}
        lk={lk}
        onDisconnect={handleDisconnect}
        sessionId={sessionId}
      />
    );
  }

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen options={{ headerShown: false }} />
      <Screen contentClassName="gap-6 px-6 py-8">
        {/* Header */}
        <View className="items-center gap-4 pt-4">
          <View className="rounded-full bg-accent/10 p-4">
            <Shield className="text-accent" size={28} />
          </View>
          <View className="items-center gap-1">
            <Text className="font-serif text-2xl text-primary">
              Test Sessions
            </Text>
            <Text className="max-w-xs text-center font-sans text-foreground-muted text-sm">
              Generate or enter a session ID to test 2-way video calling.
            </Text>
          </View>
        </View>

        {/* Role selector */}
        <View className="gap-2">
          <Text className="font-poppins-medium text-caption text-foreground-muted uppercase tracking-widest">
            Join as
          </Text>
          <ToggleGroup
            items={[
              { label: "Patient", value: "patient" },
              { label: "Doctor", value: "doctor" },
              { label: "Admin", value: "admin" },
            ]}
            onValueChange={setSelectedRole}
            value={selectedRole}
          />
        </View>

        {/* Generate session */}
        <View className="gap-3">
          <Text className="font-poppins-medium text-caption text-foreground-muted uppercase tracking-widest">
            Generate session
          </Text>
          <Button
            disabled={createSession.isPending}
            onPress={() => createSession.mutate()}
          >
            {createSession.isPending ? "Creating..." : "Generate Session ID"}
          </Button>
          {generatedSessionId ? (
            <View className="flex-row items-center gap-2 rounded-2xl border border-border/70 bg-background-elevated px-4 py-3">
              <Text className="flex-1 break-all font-mono text-foreground text-xs">
                {generatedSessionId}
              </Text>
              <Pressable
                className="rounded-full bg-foreground/5 p-2"
                onPress={handleCopy}
              >
                <Copy className="text-foreground-muted" size={16} />
              </Pressable>
              {copied ? (
                <Text className="font-poppins-medium text-emerald-600 text-xs">
                  Copied!
                </Text>
              ) : null}
            </View>
          ) : null}
        </View>

        {/* Join session */}
        <View className="gap-3">
          <Text className="font-poppins-medium text-caption text-foreground-muted uppercase tracking-widest">
            Join session
          </Text>
          <Input
            onChangeText={setSessionId}
            placeholder="Paste or type session ID..."
            value={sessionId}
          />
          <View className="gap-2">
            <Button
              disabled={!sessionId || lk.isConnecting}
              onPress={handleJoin}
            >
              {lk.isConnecting ? (
                <ActivityIndicator
                  className="text-primary-foreground"
                  size="small"
                />
              ) : (
                `Join as ${selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}`
              )}
            </Button>
            <Button onPress={handleMockSimulation} variant="secondary">
              Mock Simulation (Save Credits)
            </Button>
          </View>
        </View>
      </Screen>
    </View>
  );
}
