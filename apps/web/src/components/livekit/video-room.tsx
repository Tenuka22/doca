import { Button } from "@zen-doc/ui/components/button";
import { Card, CardContent } from "@zen-doc/ui/components/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@zen-doc/ui/components/dialog";
import { Video, VideoOff } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";

import { useLiveKitRoomWeb } from "@/hooks/use-livekit-room";
import { useSessionTiming } from "@/hooks/use-session-timing";
import { orpc } from "@/utils/orpc";

interface VideoRoomProps {
  endAt: string;
  onClose: () => void;
  open?: boolean;
  role: "doctor" | "patient" | "admin";
  sessionId: string;
  startAt: string;
  asDialog?: boolean;
}

function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
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
  role: string;
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

interface VideoRoomContentProps {
  fetchToken: () => Promise<void>;
  handleEndSession: () => Promise<void>;
  isFetchingToken: boolean;
  liveKit: ReturnType<typeof useLiveKitRoomWeb>;
  setShowEndConfirm: (v: boolean) => void;
  showEndConfirm: boolean;
  timing: ReturnType<typeof useSessionTiming>;
  tokenError: string | null;
}

function VideoRoomContent({
  fetchToken,
  handleEndSession,
  isFetchingToken,
  liveKit,
  setShowEndConfirm,
  showEndConfirm,
  timing,
  tokenError,
}: VideoRoomContentProps) {
  if (tokenError) {
    return (
      <div className="flex flex-col items-center gap-4 py-8">
        <VideoOff className="h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground text-sm">{tokenError}</p>
        <Button onClick={fetchToken} size="sm" variant="default">
          Retry
        </Button>
      </div>
    );
  }

  if (isFetchingToken || liveKit.isConnecting) {
    return (
      <div className="flex flex-col items-center gap-4 py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted-foreground border-t-primary" />
        <p className="text-muted-foreground text-sm">
          Connecting to session...
        </p>
      </div>
    );
  }

  if (timing.canJoin) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Remote Video */}
          <div className="relative aspect-video overflow-hidden rounded-lg border bg-black">
            {liveKit.isConnected ? (
              <>
                <video
                  autoPlay
                  className="h-full w-full object-cover"
                  playsInline
                  ref={liveKit.videoRef}
                />
                <div className="absolute top-3 left-3 rounded-full bg-black/60 px-2 py-1 text-[10px] text-white">
                  Remote
                </div>
                <div className="absolute right-3 bottom-3 flex items-center gap-2 rounded-full bg-black/60 px-3 py-1.5">
                  <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                  <span className="text-white text-xs">
                    {liveKit.participantCount} participant
                    {liveKit.participantCount === 1 ? "" : "s"}
                  </span>
                </div>
              </>
            ) : (
              <div className="flex h-full items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              </div>
            )}
          </div>

          {/* Local Video */}
          <div className="relative aspect-video overflow-hidden rounded-lg border bg-black">
            {liveKit.isConnected ? (
              <>
                <video
                  autoPlay
                  className="h-full w-full object-cover scale-x-[-1]"
                  muted
                  playsInline
                  ref={liveKit.localVideoRef}
                />
                <div className="absolute top-3 left-3 rounded-full bg-black/60 px-2 py-1 text-[10px] text-white">
                  You (Local)
                </div>
              </>
            ) : (
              <div className="flex h-full items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              </div>
            )}
          </div>
        </div>

        {timing.mustLeave && (
          <Card className="border-rose-500/30 bg-rose-500/5">
            <CardContent className="p-3">
              <p className="text-rose-600 text-sm dark:text-rose-400">
                Session time has ended. Please disconnect.
              </p>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-end gap-2">
          {showEndConfirm ? (
            <>
              <Button
                onClick={() => setShowEndConfirm(false)}
                size="sm"
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                disabled={liveKit.isConnecting}
                onClick={handleEndSession}
                size="sm"
                variant="destructive"
              >
                End Session
              </Button>
            </>
          ) : (
            <Button
              onClick={() => setShowEndConfirm(true)}
              size="sm"
              variant="outline"
            >
              <VideoOff className="mr-1 h-3 w-3" />
              End Session
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 py-8">
      <VideoOff className="h-12 w-12 text-muted-foreground" />
      <p className="text-muted-foreground text-sm">
        This session is not yet available for joining.
      </p>
    </div>
  );
}

export function VideoRoomWeb({
  onClose,
  open = true,
  sessionId,
  startAt,
  endAt,
  role,
  asDialog = false,
}: VideoRoomProps) {
  const liveKit = useLiveKitRoomWeb();
  const timing = useSessionTiming(startAt, endAt, role);
  const [tokenData, setTokenData] = useState<{
    token: string;
    serverUrl: string;
    roomName: string;
  } | null>(null);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [isFetchingToken, setIsFetchingToken] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);

  useAttendanceTracker({
    isConnected: liveKit.isConnected,
    sessionId,
    endAt,
    role,
  });

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
    if (open && timing.canJoin && !tokenData && !isFetchingToken) {
      fetchToken();
    }
  }, [open, timing.canJoin, tokenData, isFetchingToken, fetchToken]);

  useEffect(() => {
    if (open && tokenData && !liveKit.isConnected && !liveKit.isConnecting) {
      liveKit
        .connect(tokenData.serverUrl, tokenData.token)
        .catch(() => undefined);
    }
  }, [open, tokenData, liveKit]);

  const handleEndSession = useCallback(async () => {
    await orpc.recordAttendanceEvent
      .call({ sessionId, event: "leave" })
      .catch(() => undefined);
    await liveKit.disconnect();
    setTokenData(null);
    setTokenError(null);
    setShowEndConfirm(false);
    onClose();
  }, [liveKit, onClose, sessionId]);

  useEffect(() => {
    if (timing.mustLeave && liveKit.isConnected) {
      liveKit.disconnect().catch(() => undefined);
    }
  }, [timing.mustLeave, liveKit]);

  useEffect(() => {
    if (!open && liveKit.isConnected) {
      liveKit.disconnect().catch(() => undefined);
    }
  }, [open, liveKit]);

  const statusBadge = useMemo(() => {
    if (!timing.canJoin) {
      return null;
    }
    if (timing.mustLeave) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2.5 py-0.5 font-medium text-rose-600 text-xs dark:text-rose-400">
          <VideoOff className="h-3 w-3" />
          Must leave
        </span>
      );
    }
    if (timing.timeStatus === "grace") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 font-medium text-amber-600 text-xs dark:text-amber-400">
          Grace period ({timing.formattedRemaining})
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 font-medium text-emerald-600 text-xs dark:text-emerald-400">
        <Video className="h-3 w-3" />
        Live
      </span>
    );
  }, [timing]);

  const content = (
    <VideoRoomContent
      fetchToken={fetchToken}
      handleEndSession={handleEndSession}
      isFetchingToken={isFetchingToken}
      liveKit={liveKit}
      setShowEndConfirm={setShowEndConfirm}
      showEndConfirm={showEndConfirm}
      timing={timing}
      tokenError={tokenError}
    />
  );

  if (asDialog) {
    return (
      <Dialog onOpenChange={(o) => !o && onClose()} open={open}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Video className="h-5 w-5 text-emerald-500" />
              Video Session
              {statusBadge}
            </DialogTitle>
          </DialogHeader>
          {content}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Video className="h-5 w-5 text-emerald-500" />
          <span className="font-bold">Video Session</span>
        </div>
        {statusBadge}
      </div>
      {content}
    </div>
  );
}

interface SessionJoinButtonProps {
  endAt: string;
  label?: string;
  onJoin: (sessionId: string) => void;
  role?: "doctor" | "patient" | "admin";
  startAt: string;
  sessionId: string;
}

export function SessionJoinButton({
  endAt,
  label = "Join Session",
  onJoin,
  startAt,
  role = "doctor",
  sessionId,
}: SessionJoinButtonProps) {
  const timing = useSessionTiming(startAt, endAt, role);

  if (timing.canJoin) {
    return (
      <Button onClick={() => onJoin(sessionId)} size="sm" variant="default">
        <Video className="mr-1 h-3 w-3" />
        {label}
      </Button>
    );
  }

  if (timing.timeStatus === "before") {
    const startMs = new Date(startAt).getTime();
    const opensInMinutes = Math.max(
      0,
      Math.ceil((startMs - 30 * 60 * 1000 - Date.now()) / 60_000)
    );
    return (
      <span className="text-muted-foreground text-xs">
        Opens in {formatDuration(opensInMinutes)}
      </span>
    );
  }

  return null;
}
