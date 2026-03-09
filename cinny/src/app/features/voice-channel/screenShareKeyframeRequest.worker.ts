/**
 * Receiver encoded transform: pass through screen share video frames and periodically
 * request keyframes (PLI). Interval can be updated from main thread via options.port
 * so we can go "demanding" (faster recovery) when viewer stats show stress.
 */
const DEFAULT_KEYFRAME_REQUEST_INTERVAL_MS = 2000;

addEventListener('rtctransform', (event: RTCTransformEvent) => {
  const transformer = event.transformer;
  const options = transformer.options as { port?: MessagePort };
  let keyframeIntervalMs = DEFAULT_KEYFRAME_REQUEST_INTERVAL_MS;
  let lastRequest = 0;

  if (options?.port) {
    options.port.onmessage = (e: MessageEvent<{ keyframeIntervalMs?: number }>) => {
      const ms = e.data?.keyframeIntervalMs;
      if (typeof ms === 'number' && ms > 0) keyframeIntervalMs = ms;
    };
  }

  const transform = new TransformStream({
    transform(encodedFrame: RTCEncodedVideoFrame | RTCEncodedAudioFrame, controller: TransformStreamDefaultController) {
      controller.enqueue(encodedFrame);
      if (typeof (transformer as RTCRtpScriptTransformer & { sendKeyFrameRequest?: () => Promise<void> }).sendKeyFrameRequest !== 'function') return;
      const now = Date.now();
      if (now - lastRequest >= keyframeIntervalMs) {
        lastRequest = now;
        (transformer as RTCRtpScriptTransformer & { sendKeyFrameRequest: () => Promise<void> }).sendKeyFrameRequest().catch(() => {});
      }
    },
  });

  transformer.readable.pipeThrough(transform).pipeTo(transformer.writable);
});
