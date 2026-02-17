import { useEffect, useRef } from 'react';
import { useParticipants } from '@livekit/components-react';
import { playJoinSound, playLeaveSound } from './voiceSounds';

/**
 * Plays a short audio cue when a remote participant joins or leaves the voice call.
 * Must be rendered inside a <LiveKitRoom>.
 *
 * Skips sounds on first mount (initial participant list load) so you don't get
 * a burst of bloops when you join an existing call.
 */
export function useParticipantSounds() {
  const participants = useParticipants();
  const prevIdentitiesRef = useRef<Set<string> | null>(null);

  useEffect(() => {
    const currentIdentities = new Set(participants.map((p) => p.identity));

    if (prevIdentitiesRef.current === null) {
      // First render — seed the set, don't play anything
      prevIdentitiesRef.current = currentIdentities;
      return;
    }

    const prev = prevIdentitiesRef.current;

    // Detect joins (identity in current but not in prev)
    for (const id of currentIdentities) {
      if (!prev.has(id)) {
        playJoinSound();
        break; // One sound per batch even if multiple join simultaneously
      }
    }

    // Detect leaves (identity in prev but not in current)
    for (const id of prev) {
      if (!currentIdentities.has(id)) {
        playLeaveSound();
        break;
      }
    }

    prevIdentitiesRef.current = currentIdentities;
  }, [participants]);
}
