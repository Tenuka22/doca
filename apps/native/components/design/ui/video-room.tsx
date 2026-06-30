"use client";

import { useRef } from "react";
import { StyleSheet } from "react-native";

import {
  VideoRoomBase,
  type VideoRoomProps,
} from "@/components/design/ui/video-room-base";
import { streamRegistry } from "@/hooks/use-livekit-room";

export function VideoRoom(props: VideoRoomProps) {
  const videoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());

  return (
    <VideoRoomBase
      {...props}
      renderStream={(streamURL, mirror) => {
        const isLocal = streamURL === "__local__";
        const stream = isLocal
          ? streamRegistry.localStream
          : streamRegistry.remoteStreams.get(streamURL) ?? null;

        return (
          <video
            autoPlay
            muted={isLocal}
            playsInline
            ref={(el) => {
              if (el && el.srcObject !== stream) {
                el.srcObject = stream;
                videoRefs.current.set(streamURL, el);
              }
            }}
            style={{
              ...StyleSheet.absoluteFillObject,
              objectFit: "cover",
              transform: mirror ? "scaleX(-1)" : undefined,
            }}
          />
        );
      }}
    />
  );
}
