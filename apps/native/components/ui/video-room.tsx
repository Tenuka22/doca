import { User, Video, VideoOff } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLiveKitRoom } from "@/components/ui/use-livekit-room";
import {
  type SessionTimingRole,
  useSessionTiming,
} from "@/hooks/use-session-timing";
import { orpc } from "@/utils/orpc";
import { useThemeColor } from "@/utils/theme";

interface VideoRoomProps {
  endAt: string;
  onClose: () => void;
  role: SessionTimingRole;
  sessionId: string;
  startAt: string;
}

function useAttendanceTracker({
  isConnected,
  sessionId,
  endAt,
  role,
}: {
  isConnected: boolean;
  sessionId: string;
  endAt: string;
  role: SessionTimingRole;
}) {
  const hasRecordedJoin = useRef(false);
  const snapshotTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    if (isConnected && !hasRecordedJoin.current) {
      hasRecordedJoin.current = true;
      orpc.recordAttendanceEvent
        .call({ sessionId, event: "join" })
        .catch(() => undefined);
    }
  }, [isConnected, sessionId]);

  useEffect(() => {
    if (!isConnected && hasRecordedJoin.current) {
      hasRecordedJoin.current = false;
      orpc.recordAttendanceEvent
        .call({ sessionId, event: "leave" })
        .catch(() => undefined);
    }
  }, [isConnected, sessionId]);

  useEffect(() => {
    if (!isConnected || role !== "doctor") {
      return;
    }

    const endMs = new Date(endAt).getTime();
    const tenMinBeforeEnd = endMs - 10 * 60 * 1000 - Date.now();
    const atEnd = endMs - Date.now();

    if (tenMinBeforeEnd > 0) {
      const timer = setTimeout(() => {
        orpc.recordSnapshot
          .call({
            sessionId,
            imageData: "snapshot_10min_before_end",
            reason: "pre_end_check",
          })
          .catch(() => undefined);
      }, tenMinBeforeEnd);
      snapshotTimers.current.push(timer);
    }

    if (atEnd > 0) {
      const timer = setTimeout(() => {
        orpc.recordSnapshot
          .call({
            sessionId,
            imageData: "snapshot_at_end",
            reason: "end_check",
          })
          .catch(() => undefined);
        orpc.autoMarkAttendance.call({ sessionId }).catch(() => undefined);
      }, atEnd);
      snapshotTimers.current.push(timer);
    }

    return () => {
      for (const timer of snapshotTimers.current) {
        clearTimeout(timer);
      }
      snapshotTimers.current = [];
    };
  }, [isConnected, sessionId, endAt, role]);
}

export function VideoRoom({
  onClose,
  sessionId,
  startAt,
  endAt,
  role,
}: VideoRoomProps) {
  const colors = useThemeColor();
  const timing = useSessionTiming(startAt, endAt, role);
  const liveKit = useLiveKitRoom();
  const [tokenData, setTokenData] = useState<{
    token: string;
    serverUrl: string;
    roomName: string;
  } | null>(null);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [isFetchingToken, setIsFetchingToken] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [isEnding, setIsEnding] = useState(false);

  useAttendanceTracker({
    isConnected: liveKit.isConnected,
    sessionId,
    endAt,
    role,
  });

  const roleLabel = useMemo(() => {
    const map: Record<SessionTimingRole, string> = {
      patient: "Patient",
      doctor: "Doctor",
      admin: "Admin",
    };
    return map[role];
  }, [role]);

  const fetchToken = useCallback(async () => {
    if (tokenData || isFetchingToken) {
      return;
    }
    setIsFetchingToken(true);
    setTokenError(null);
    try {
      const result = await orpc.getLiveKitToken.call({ sessionId });
      setTokenData(result);
    } catch (err) {
      setTokenError(
        err instanceof Error ? err.message : "Failed to get session token"
      );
    } finally {
      setIsFetchingToken(false);
    }
  }, [sessionId, tokenData, isFetchingToken]);

  useEffect(() => {
    if (timing.canJoin && !tokenData && !isFetchingToken) {
      fetchToken();
    }
  }, [timing.canJoin, tokenData, isFetchingToken, fetchToken]);

  useEffect(() => {
    if (tokenData && !liveKit.isConnected && !liveKit.isConnecting) {
      liveKit
        .connect(tokenData.serverUrl, tokenData.token)
        .catch(() => undefined);
    }
  }, [tokenData, liveKit]);

  const handleEndSession = useCallback(async () => {
    setIsEnding(true);
    await orpc.recordAttendanceEvent
      .call({ sessionId, event: "leave" })
      .catch(() => undefined);
    await liveKit.disconnect();
    onClose();
  }, [liveKit, onClose, sessionId]);

  if (!(timing.canJoin || liveKit.isConnected)) {
    const now = Date.now();
    const startMs = new Date(startAt).getTime();
    const opensIn = Math.max(
      0,
      Math.ceil((startMs - 30 * 60 * 1000 - now) / 60_000)
    );

    return (
      <Card className="gap-4">
        <View className="items-center gap-3 py-4">
          <VideoOff color={colors.mutedForeground} size={32} />
          <Text className="font-black font-sans text-foreground text-lg uppercase tracking-tight">
            Session Not Available
          </Text>
          <Text className="text-center font-medium font-sans text-muted-foreground text-sm">
            {opensIn > 0
              ? `The session opens in ${opensIn} minutes. You can join 30 minutes before the scheduled time.`
              : "This session has ended."}
          </Text>
        </View>
      </Card>
    );
  }

  if (tokenError) {
    return (
      <Card className="gap-4">
        <View className="items-center gap-3 py-4">
          <VideoOff color={colors.destructive} size={32} />
          <Text className="font-black font-sans text-foreground text-lg uppercase tracking-tight">
            Connection Failed
          </Text>
          <Text className="text-center font-medium font-sans text-muted-foreground text-sm">
            {tokenError}
          </Text>
          <Button onPress={fetchToken} size="sm" variant="primary">
            Retry
          </Button>
        </View>
      </Card>
    );
  }

  if (isFetchingToken || liveKit.isConnecting) {
    return (
      <Card className="gap-4">
        <View className="items-center gap-3 py-4">
          <ActivityIndicator color={colors.primary} size="large" />
          <Text className="font-black font-sans text-foreground text-sm uppercase tracking-wider">
            Connecting to session...
          </Text>
        </View>
      </Card>
    );
  }

  const statusBadgeColor = (() => {
    if (timing.mustLeave) {
      return "border-destructive bg-destructive/10 text-destructive";
    }
    if (timing.timeStatus === "grace") {
      return "border-warning bg-warning/10 text-warning";
    }
    return "border-success bg-success/10 text-success";
  })();

  const statusBadgeLabel = (() => {
    if (timing.mustLeave) {
      return "MUST LEAVE";
    }
    if (timing.timeStatus === "grace") {
      return "GRACE PERIOD";
    }
    return "LIVE";
  })();

  return (
    <Card className="gap-4 overflow-hidden">
      <View className="gap-2">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <Video color={colors.success} size={16} />
            <Text className="font-black font-sans text-success text-xs uppercase tracking-wider">
              Video Session ({roleLabel})
            </Text>
          </View>
          <View className={`rounded-chip border-2 px-2.5 py-1 ${statusBadgeColor}`}>
            <Text className="font-black font-sans text-[9px] uppercase tracking-wider">
              {statusBadgeLabel}
            </Text>
          </View>
        </View>

        <View className="gap-3">
          <View className="aspect-video items-center justify-center rounded-card border-2 border-border bg-black">
            {liveKit.isConnected ? (
              <View className="items-center gap-2">
                <Video color={colors.success} size={32} />
                <Text className="font-bold font-sans text-white text-xs uppercase tracking-wider">
                  Video Connected
                </Text>
                <Text className="font-medium font-sans text-white/60 text-[10px] uppercase tracking-wider">
                  {liveKit.participants.length} remote participant{liveKit.participants.length === 1 ? "" : "s"}
                </Text>
              </View>
            ) : (
              <ActivityIndicator color="#ffffff" size="large" />
            )}
          </View>

          {/* Track Status Grid */}
          {liveKit.isConnected && (
             <View className="flex-row flex-wrap gap-2">
                <View className="flex-1 min-w-[45%] rounded-lg border border-border/50 bg-muted/10 p-3 items-center gap-1">
                   <User color={colors.primary} size={16} />
                   <Text className="font-bold font-sans text-[10px] text-foreground uppercase">You (Local)</Text>
                   <Text className="text-[8px] text-success font-black uppercase">Publishing</Text>
                </View>
                {liveKit.tracks.map((track) => (
                   <View key={track.sid} className="flex-1 min-w-[45%] rounded-lg border border-border/50 bg-muted/10 p-3 items-center gap-1">
                      <User color={colors.foreground} size={16} />
                      <Text className="font-bold font-sans text-[10px] text-foreground uppercase truncate">Remote User</Text>
                      <Text className="text-[8px] text-success font-black uppercase">Subscribed</Text>
                   </View>
                ))}
             </View>
          )}
        </View>

        {timing.mustLeave && (
          <View className="rounded-card border-2 border-destructive bg-destructive/10 px-3 py-2">
            <Text className="font-bold font-sans text-destructive text-xs uppercase tracking-wider">
              Session time has ended. Please disconnect.
            </Text>
          </View>
        )}

        {timing.timeStatus === "grace" && (
          <View className="rounded-card border-2 border-warning bg-warning/10 px-3 py-2">
            <Text className="font-bold font-sans text-warning text-xs uppercase tracking-wider">
              Grace period:{" "}
              {timing.remainingMs > 0
                ? `${Math.ceil(timing.remainingMs / 60_000)} minutes remaining`
                : "ending soon"}
            </Text>
          </View>
        )}

        <View className="flex-row gap-2">
          {showEndConfirm ? (
            <>
              <Button
                className="flex-1"
                onPress={() => setShowEndConfirm(false)}
                size="sm"
                variant="secondary"
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                disabled={isEnding}
                onPress={handleEndSession}
                size="sm"
                variant="primary"
              >
                {isEnding ? "Ending..." : "End Session"}
              </Button>
            </>
          ) : (
            <Button
              className="flex-1"
              onPress={() => setShowEndConfirm(true)}
              size="sm"
              variant="secondary"
            >
              End Session
            </Button>
          )}
        </View>
      </View>
    </Card>
  );
}
