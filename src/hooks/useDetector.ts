import { useEffect, useRef, useState, useCallback } from 'react';
import { YoloxDetector } from '../core/yolox';
import type { Detection } from '../core/yolox';

export type { Detection };

// Updated implementation
export function useDetector(
    // Default to GitHub Pages CDN to save Vercel bandwidth
    modelPath: string = 'https://huanglizhuo.github.io/Ketsuin/model/yolox_nano.onnx'
) {
    const [loading, setLoading] = useState(false); // Not loading initially
    const [isRunning, setIsRunning] = useState(false);
    const [detections, setDetections] = useState<Detection[]>([]);
    const [error, setError] = useState<string | null>(null);
    const detectorRef = useRef<YoloxDetector | null>(null);
    const animationFrameRef = useRef<number>(0);
    const videoRef = useRef<HTMLVideoElement | null>(null);

    // loop function remains the same
    const loop = useCallback(async () => {
        if (!videoRef.current || !detectorRef.current || !isRunning) return;

        // Only detect if video has data
        if (videoRef.current.readyState === 4) {
            try {
                const dets = await detectorRef.current.detect(videoRef.current);
                setDetections(dets);
            } catch (e) {
                console.error("Detection error", e);
            }
        }

        if (isRunning) {
            animationFrameRef.current = requestAnimationFrame(loop);
        }
    }, [isRunning]);

    const start = useCallback(async () => {
        if (!videoRef.current) return;
        setError(null);

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
        }

        // 2. Start Camera
        navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 640 }, height: { ideal: 480 } }
        }).then(stream => {
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play();
                setIsRunning(true);
            }
        }).catch((err: any) => {
            console.error("Camera access denied/failed", err);
            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                setError("🚫 Permission Denied. Please allow camera access.");
            } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
                setError("📷 No Camera Found. Please connect a webcam.");
            } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
                setError("⚠️ Camera In Use. Please close other apps.");
            } else {
                setError(`⚠️ Camera Error: ${err.name || err.message || 'Unknown'}`);
            }
        });
    }, [modelPath]);

    const stop = useCallback(() => {
        setIsRunning(false);
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);

        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(t => t.stop());
            videoRef.current.srcObject = null;
        }
    }, []);

    useEffect(() => {
        if (isRunning) {
            loop();
        } else {
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        }
    }, [isRunning, loop]);

    return { loading, isRunning, start, stop, detections, videoRef, error };
}
