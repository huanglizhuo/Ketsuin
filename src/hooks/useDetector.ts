import { useEffect, useRef, useState, useCallback } from 'react';
import type { Detection } from '../core/yolox';
import type { YoloxDetector } from '../core/yolox';

export type { Detection };

const DEFAULT_MODEL_PATH = 'https://ketsuin.clothpath.com/model/yolox_nano.onnx';

// Inference runs in a module worker when OffscreenCanvas is available, so
// per-frame preprocessing + wasm inference never blocks the UI. Older
// browsers (Safari < 16.4) fall back to main-thread inference.
const supportsWorkerInference = typeof Worker !== 'undefined' && typeof OffscreenCanvas !== 'undefined';

// Best-effort warm-up during idle time: pulls the yolox/ort chunk and warms
// the 3.6MB model into Cache Storage, so pressing Start feels instant.
export function warmupDetector(modelPath: string = DEFAULT_MODEL_PATH) {
    const conn = (navigator as { connection?: { saveData?: boolean } }).connection;
    if (conn?.saveData) return;
    void (async () => {
        try {
            const { preloadModel } = await import('../core/yolox');
            await preloadModel(modelPath);
        } catch {
            // Warm-up is best-effort — start() loads everything for real.
        }
    })();
}

// Updated implementation
export function useDetector(
    modelPath: string = DEFAULT_MODEL_PATH
) {
    const DETECTION_INTERVAL_MS = 100;
    const [loading, setLoading] = useState(false); // Not loading initially
    const [isRunning, setIsRunning] = useState(false);
    const [detections, setDetections] = useState<Detection[]>([]);
    const [error, setError] = useState<string | null>(null);
    const detectorRef = useRef<YoloxDetector | null>(null);
    const workerRef = useRef<Worker | null>(null);
    const workerPendingRef = useRef<{ resolve: (d: Detection[]) => void } | null>(null);
    const animationFrameRef = useRef<number>(0);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const waitingForVideoRefRef = useRef(false);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const lastDetectionAtRef = useRef(0);
    const detectInFlightRef = useRef(false);

    const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);

    const log = useCallback((message: string, details?: Record<string, unknown>) => {
        if (details) {
            console.log('[useDetector]', message, details);
            return;
        }
        console.log('[useDetector]', message);
    }, []);

    // Sends one frame to the inference worker when available, otherwise runs
    // the detector on the main thread (fallback for browsers without OffscreenCanvas).
    const detectWith = useCallback(async (video: HTMLVideoElement): Promise<Detection[]> => {
        if (workerRef.current) {
            const worker = workerRef.current;
            const bitmap = await createImageBitmap(video);
            return new Promise<Detection[]>((resolve) => {
                workerPendingRef.current = { resolve };
                worker.postMessage({ type: 'detect', bitmap }, [bitmap]);
            });
        }
        if (!detectorRef.current) return [];
        return detectorRef.current.detect(video);
    }, []);

    // loop function remains the same
    const loop = useCallback(async function runLoop() {
        if (!detectorRef.current && !workerRef.current) return;
        if (!isRunning) return;

        if (!videoRef.current) {
            if (!waitingForVideoRefRef.current) {
                waitingForVideoRefRef.current = true;
                log('Detection loop is waiting for video element mount');
            }
            animationFrameRef.current = requestAnimationFrame(() => {
                void runLoop();
            });
            return;
        }

        if (waitingForVideoRefRef.current) {
            waitingForVideoRefRef.current = false;
            log('Video element mounted, detection loop resumed');
        }

        const now = performance.now();

        // Only detect if video has data, one inference at a time, and at a capped rate.
        if (
            videoRef.current.readyState === 4 &&
            !detectInFlightRef.current &&
            now - lastDetectionAtRef.current >= DETECTION_INTERVAL_MS
        ) {
            try {
                detectInFlightRef.current = true;
                const dets = await detectWith(videoRef.current);
                lastDetectionAtRef.current = performance.now();
                setDetections(dets);
            } catch (e) {
                console.error("Detection error", e);
            } finally {
                detectInFlightRef.current = false;
            }
        }

        if (isRunning) {
            animationFrameRef.current = requestAnimationFrame(() => {
                void runLoop();
            });
        }
    }, [isRunning, log, detectWith]);

    const start = useCallback(async () => {
        setError(null);
        log('Start requested', {
            hasVideoElement: Boolean(videoRef.current),
            hasDetector: Boolean(detectorRef.current),
            hasStream: Boolean(mediaStreamRef.current),
        });

        // 1. Lazy Load Model if not loaded
        if (!detectorRef.current && !workerRef.current) {
            setLoading(true);
            try {
                if (supportsWorkerInference) {
                    const worker = new Worker(
                        new URL('../core/detector.worker.ts', import.meta.url),
                        { type: 'module' }
                    );
                    await new Promise<void>((resolve, reject) => {
                        worker.onmessage = (e: MessageEvent) => {
                            if (e.data.type === 'init-done') resolve();
                            else if (e.data.type === 'init-error') reject(new Error(e.data.error));
                        };
                        worker.postMessage({ type: 'init', modelPath });
                    });
                    // Switch to the steady-state handler for detection results
                    worker.onmessage = (e: MessageEvent) => {
                        if (e.data.type === 'result') {
                            workerPendingRef.current?.resolve(e.data.detections);
                            workerPendingRef.current = null;
                        }
                    };
                    workerRef.current = worker;
                } else {
                    const { YoloxDetector } = await import('../core/yolox');
                    const detector = new YoloxDetector();
                    await detector.load(modelPath);
                    detectorRef.current = detector;
                }
            } catch (e) {
                console.error("Initialization failed", e);
                setError("Failed to load AI Model. Please refresh.");
                setLoading(false);
                return;
            }
            setLoading(false);
            log('Detector loaded', { worker: supportsWorkerInference });
        }

        // 2. Start Camera
        navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 640 }, height: { ideal: 480 } }
        }).then(stream => {
            log('Camera stream acquired', {
                trackCount: stream.getTracks().length,
                hasVideoElement: Boolean(videoRef.current),
            });
            mediaStreamRef.current = stream;
            setMediaStream(stream); // Save stream
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play().catch(e => console.log('[useDetector] Video play error during start', e));
                log('Attached stream to mounted video element during start');
            } else {
                log('Camera started before video element mount; stream will attach later');
            }
            setIsRunning(true);
        }).catch((err: unknown) => {
            console.error("Camera access denied/failed", err);
            const errName = typeof err === 'object' && err !== null && 'name' in err
                ? String((err as { name?: unknown }).name)
                : undefined;
            const errMessage = err instanceof Error ? err.message : String(err);

            if (errName === 'NotAllowedError' || errName === 'PermissionDeniedError') {
                setError("🚫 Permission Denied. Please allow camera access.");
            } else if (errName === 'NotFoundError' || errName === 'DevicesNotFoundError') {
                setError("📷 No Camera Found. Please connect a webcam.");
            } else if (errName === 'NotReadableError' || errName === 'TrackStartError') {
                setError("⚠️ Camera In Use. Please close other apps.");
            } else {
                setError(`⚠️ Camera Error: ${errName || errMessage || 'Unknown'}`);
            }
        });
    }, [log, modelPath]);

    const stop = useCallback(() => {
        log('Stop requested', {
            hasVideoElement: Boolean(videoRef.current),
            hasStream: Boolean(mediaStreamRef.current),
        });
        setIsRunning(false);
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        waitingForVideoRefRef.current = false;
        detectInFlightRef.current = false;
        lastDetectionAtRef.current = 0;
        // Unblock a detect promise still waiting on the worker
        workerPendingRef.current?.resolve([]);
        workerPendingRef.current = null;

        const streamsToStop = new Set<MediaStream>();
        if (mediaStreamRef.current) {
            streamsToStop.add(mediaStreamRef.current);
        }
        if (videoRef.current && videoRef.current.srcObject) {
            streamsToStop.add(videoRef.current.srcObject as MediaStream);
        }

        streamsToStop.forEach(stream => {
            stream.getTracks().forEach(t => t.stop());
        });

        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        setDetections([]);
        mediaStreamRef.current = null;
        setMediaStream(null);
    }, [log]);

    useEffect(() => {
        if (!mediaStream || !videoRef.current) return;

        log('Reattaching existing stream to current video element', {
            isRunning,
            readyState: videoRef.current.readyState,
        });
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play().catch(e => console.log('[useDetector] Video play error during reattach', e));
    }, [isRunning, log, mediaStream]);

    useEffect(() => {
        if (isRunning) {
            loop();
        } else {
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        }
    }, [isRunning, loop]);

    return { loading, isRunning, start, stop, detections, videoRef, error, mediaStream };
}
