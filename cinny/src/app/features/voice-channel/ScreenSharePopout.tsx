/**
 * Standalone screen-share viewer for the "Pop out" window.
 * Reads token and serverUrl from the URL hash (set by opener), connects to LiveKit, and shows only the screen share track.
 * Uses room-based screen share detection + manual video element (no useTracks/VideoTrack) to avoid SDK issues and improve reconnection behavior.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { LiveKitRoom, useRoomContext, useConnectionState } from '@livekit/components-react';
import { ConnectionState, RoomEvent, Track } from 'livekit-client';
import type { RemoteTrackPublication } from 'livekit-client';
import { Box, Text, IconButton, Icon, Icons } from 'folds';
import { VOICE_SCREEN_SHARE_POPOUT_PATH } from '../../pages/paths';
import {
  voiceChannelRoomOptions,
  validateScreenShareCodecSupport,
  setScreenShareJitterBufferTarget,
} from './voiceChannelRoomOptions';

function parsePopoutAuthFromHash(): { token: string; serverUrl: string } | null {
  const hash = typeof window !== 'undefined' ? window.location.hash : '';
  const secondHash = hash.indexOf('#', 1);
  const encoded = secondHash >= 0 ? hash.slice(secondHash + 1) : '';
  if (!encoded) return null;
  try {
    const decoded = atob(decodeURIComponent(encoded));
    const data = JSON.parse(decoded) as { token?: string; serverUrl?: string };
    if (data?.token && data?.serverUrl) return { token: data.token, serverUrl: data.serverUrl };
  } catch {
    // ignore
  }
  return null;
}

type ScreenShareRef = {
  publication: { track?: { mediaStreamTrack?: MediaStreamTrack } | unknown };
  participant: { identity: string; name?: string };
};

function getScreenShareFromRoom(room: ReturnType<typeof useRoomContext> | undefined): ScreenShareRef | null {
  if (!room) return null;
  for (const p of room.remoteParticipants?.values() ?? []) {
    const pub = p.getTrackPublication(Track.Source.ScreenShare) as { track?: unknown } | undefined;
    if (pub) return { publication: pub, participant: p as ScreenShareRef['participant'] };
  }
  return null;
}

function subscribeToScreenShare(room: ReturnType<typeof useRoomContext>): void {
  room.remoteParticipants?.forEach((p) => {
    const pub = p.getTrackPublication(Track.Source.ScreenShare) as RemoteTrackPublication | undefined;
    if (pub && !pub.isSubscribed) pub.setSubscribed(true);
  });
}

function getMediaStreamTrackFromRef(ref: ScreenShareRef | null): MediaStreamTrack | null {
  if (!ref) return null;
  const pub = ref.publication as { track?: { mediaStreamTrack?: MediaStreamTrack } };
  return pub?.track?.mediaStreamTrack ?? null;
}

function PopoutVideo({ trackRef }: { trackRef: ScreenShareRef | null }) {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    if (!trackRef) {
      setStream(null);
      return;
    }
    const mt = getMediaStreamTrackFromRef(trackRef);
    if (mt) {
      setStream(new MediaStream([mt]));
      return;
    }
    let count = 0;
    const maxTries = 50;
    const id = setInterval(() => {
      count += 1;
      const t = getMediaStreamTrackFromRef(trackRef);
      if (t) {
        setStream(new MediaStream([t]));
        clearInterval(id);
      } else if (count >= maxTries) clearInterval(id);
    }, 100);
    return () => {
      clearInterval(id);
      setStream(null);
    };
  }, [trackRef]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.srcObject = stream;
    if (stream) video.play().catch(() => {});
    return () => {
      video.srcObject = null;
    };
  }, [stream]);

  if (!trackRef) return null;
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: '#000' }}>
      <video ref={videoRef} style={{ width: '100%', height: '100%', objectFit: 'contain' }} playsInline muted autoPlay />
      {!stream && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#888',
            fontSize: 14,
          }}
        >
          Loading video…
        </div>
      )}
    </div>
  );
}

function ScreenSharePopoutContent() {
  const room = useRoomContext();
  const connectionState = useConnectionState();
  const [screenShareRef, setScreenShareRef] = useState<ScreenShareRef | null>(null);
  const keyframeRequestWorkerRef = React.useRef<Worker | null>(null);
  const screenShareReceiverRef = React.useRef<RTCRtpReceiver | null>(null);
  const keyframePortRef = React.useRef<MessagePort | null>(null);
  const viewerStatsRef = React.useRef<{ framesDropped: number } | null>(null);
  const [viewerAdaptationTrigger, setViewerAdaptationTrigger] = useState(0);

  const update = useCallback(() => {
    setScreenShareRef((prev) => {
      const next = getScreenShareFromRoom(room);
      return next ?? null;
    });
  }, [room]);

  useEffect(() => {
    if (!room) {
      setScreenShareRef(null);
      return;
    }
    subscribeToScreenShare(room);
    update();
    const t1 = setTimeout(update, 0);
    const t2 = setTimeout(update, 100);
    const onPublished = () => {
      subscribeToScreenShare(room);
      update();
    };
    const onTrackSubscribed = (
      track: { mediaStreamTrack?: MediaStreamTrack },
      publication: { source?: Track.Source }
    ) => {
      update();
      if (publication?.source === Track.Source.ScreenShare) {
        const mt = track?.mediaStreamTrack ?? (track as { track?: MediaStreamTrack })?.track;
        if (!keyframeRequestWorkerRef.current) {
          try {
            keyframeRequestWorkerRef.current = new Worker(
              new URL('./screenShareKeyframeRequest.worker.ts', import.meta.url),
              { type: 'module' }
            );
          } catch {
            // Encoded transforms not supported
          }
        }
        const channel = new MessageChannel();
        keyframePortRef.current = channel.port1;
        channel.port1.start();
        const receiver = setScreenShareJitterBufferTarget(room as Parameters<typeof setScreenShareJitterBufferTarget>[0], mt, {
          keyframeRequestWorker: keyframeRequestWorkerRef.current ?? undefined,
          keyframeRequestPort: channel.port2,
        });
        screenShareReceiverRef.current = receiver ?? null;
        viewerStatsRef.current = null;
        setViewerAdaptationTrigger((n) => n + 1);
      }
    };
    room.on(RoomEvent.TrackPublished, onPublished);
    room.on(RoomEvent.TrackUnpublished, update);
    room.on(RoomEvent.TrackSubscribed, onTrackSubscribed as (track: unknown, publication: unknown, participant: unknown) => void);
    room.on(RoomEvent.TrackUnsubscribed, update);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      room.off(RoomEvent.TrackPublished, onPublished);
      room.off(RoomEvent.TrackUnpublished, update);
      room.off(RoomEvent.TrackSubscribed, onTrackSubscribed as (track: unknown, publication: unknown, participant: unknown) => void);
      room.off(RoomEvent.TrackUnsubscribed, update);
    };
  }, [room, update]);

  // Viewer: poll receiver stats and send dynamic keyframe interval to worker
  useEffect(() => {
    const receiver = screenShareReceiverRef.current;
    const port = keyframePortRef.current;
    if (!receiver?.getStats || !port) return;
    const id = setInterval(async () => {
      try {
        const report = await receiver.getStats();
        let framesDropped: number | undefined;
        let jitterBufferDelay: number | undefined;
        report.forEach((s) => {
          if (s.type === 'inbound-rtp' && (s as { kind?: string }).kind === 'video') {
            const v = s as { framesDropped?: number; jitterBufferDelay?: number };
            framesDropped = v.framesDropped;
            jitterBufferDelay = v.jitterBufferDelay;
          }
        });
        if (framesDropped === undefined) return;
        const prev = viewerStatsRef.current;
        viewerStatsRef.current = { framesDropped };
        const dropsDelta = prev ? framesDropped - prev.framesDropped : 0;
        const demanding = dropsDelta >= 1 || (jitterBufferDelay ?? 0) < 2;
        port.postMessage({ keyframeIntervalMs: demanding ? 400 : 2000 });
      } catch {
        // ignore
      }
    }, 2000);
    return () => clearInterval(id);
  }, [room, viewerAdaptationTrigger]);

  const handleClose = () => window.close();

  useEffect(() => {
    if (connectionState === ConnectionState.Connected) validateScreenShareCodecSupport();
  }, [connectionState]);

  const disconnected = connectionState === ConnectionState.Disconnected;

  if (disconnected) {
    return (
      <Box
        direction="Column"
        alignItems="Center"
        justifyContent="Center"
        gap="200"
        style={{ padding: 24, height: '100%' }}
      >
        <Text size="T300">Connection lost</Text>
        <Text size="T200" priority="400" style={{ textAlign: 'center' }}>
          Close this window and click &quot;Pop out&quot; again in the voice call to reopen the screen share.
        </Text>
        <IconButton onClick={handleClose} variant="Secondary" size="300" radii="Pill" aria-label="Close">
          <Icon size="200" src={Icons.Cross} />
        </IconButton>
      </Box>
    );
  }

  if (!screenShareRef) {
    return (
      <Box
        direction="Column"
        alignItems="Center"
        justifyContent="Center"
        gap="200"
        style={{ padding: 24, height: '100%' }}
      >
        <Text size="T300">Waiting for screen share…</Text>
        <Text size="T200" priority="400">
          No one is sharing yet, or the stream hasn&apos;t loaded.
        </Text>
        <IconButton onClick={handleClose} variant="Secondary" size="300" radii="Pill" aria-label="Close">
          <Icon size="200" src={Icons.Cross} />
        </IconButton>
      </Box>
    );
  }

  return (
    <Box direction="Column" style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Box
        style={{
          position: 'absolute',
          top: 8,
          left: 8,
          right: 8,
          zIndex: 10,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Text size="T300" style={{ color: '#fff', textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>
          Screen share
        </Text>
        <IconButton
          onClick={handleClose}
          variant="Secondary"
          size="300"
          radii="Pill"
          aria-label="Close window"
        >
          <Icon size="200" src={Icons.Cross} />
        </IconButton>
      </Box>
      <Box grow="Yes" style={{ minHeight: 0 }}>
        <PopoutVideo trackRef={screenShareRef} />
      </Box>
    </Box>
  );
}

export function ScreenSharePopout() {
  const [auth, setAuth] = useState<{ token: string; serverUrl: string } | null>(() =>
    parsePopoutAuthFromHash()
  );

  const content = useMemo(() => {
    if (!auth) {
      return (
        <Box
          direction="Column"
          alignItems="Center"
          justifyContent="Center"
          gap="200"
          style={{ padding: 24, height: '100vh' }}
        >
          <Text size="T300">Invalid or expired link</Text>
          <Text size="T200" priority="400">
            Close this window and use &quot;Pop out&quot; again from the voice call.
          </Text>
          <IconButton
            onClick={() => window.close()}
            variant="Secondary"
            size="300"
            radii="Pill"
            aria-label="Close"
          >
            <Icon size="200" src={Icons.Cross} />
          </IconButton>
        </Box>
      );
    }

    return (
      <LiveKitRoom
        serverUrl={auth.serverUrl}
        token={auth.token}
        connect={true}
        audio={false}
        video={false}
        options={voiceChannelRoomOptions}
        style={{ width: '100%', height: '100vh', background: '#000' }}
      >
        <ScreenSharePopoutContent />
      </LiveKitRoom>
    );
  }, [auth]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        backgroundColor: '#000',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {content}
    </div>
  );
}

/** Build URL for the pop-out window (call from opener with token + serverUrl). */
export function getScreenSharePopoutUrl(token: string, serverUrl: string): string {
  const base = `${window.location.origin}${(window.location.pathname || '/').replace(/\/$/, '')}`;
  const encoded = encodeURIComponent(btoa(JSON.stringify({ token, serverUrl })));
  return `${base}#${VOICE_SCREEN_SHARE_POPOUT_PATH}#${encoded}`;
}
