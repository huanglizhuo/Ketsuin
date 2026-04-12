import { useEffect, useRef, useState, useCallback } from 'react';
import { YoloxDetector } from '../core/yolox';
import type { Detection } from '../core/yolox';

export type { Detection };

// Updated implementation
export function useDetector(
    // Default to GitHub Pages CDN to save Vercel bandwidth
    modelPath: string = 'https://huanglizhuo.github.io/Ketsuin/model/yolox_nano.onnx'
) {
    const DETECTION_INTERVAL_MS = 100;
    const [loading, setLoading] = useState(false); // Not loading initially
    const [isRunning, setIsRunning] = useState(false);
    const [detections, setDetections] = useState<Detection[]>([]);
    const [error, setError] = useState<string | null>(null);
    const detectorRef = useRef<YoloxDetector | null>(null);
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

    // loop function remains the same
    const loop = useCallback(async function runLoop() {
        if (!detectorRef.current || !isRunning) return;

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
                const dets = await detectorRef.current.detect(videoRef.current);
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
    }, [isRunning, log]);

    const start = useCallback(async () => {
        setError(null);
        log('Start requested', {
            hasVideoElement: Boolean(videoRef.current),
            hasDetector: Boolean(detectorRef.current),
            hasStream: Boolean(mediaStreamRef.current),
        });

        // 1. Lazy Load Model if not loaded
        if (!detectorRef.current) {
            setLoading(true);
            try {
                const detector = new YoloxDetector();
                await detector.load(modelPath);
                detectorRef.current = detector;
            } catch (e) {
                console.error("Initialization failed", e);
                setError("Failed to load AI Model. Please refresh.");
                setLoading(false);
                return;
            }
            setLoading(false);
            log('Detector loaded');
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
