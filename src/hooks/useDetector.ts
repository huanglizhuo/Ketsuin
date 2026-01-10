import { useEffect, useRef, useState, useCallback } from 'react';
import { YoloxDetector } from '../core/yolox';
import type { Detection } from '../core/yolox';

export function useDetector(modelPath: string) {
    const [loading, setLoading] = useState(true);
    const [isRunning, setIsRunning] = useState(false);
    const [detections, setDetections] = useState<Detection[]>([]);
    const detectorRef = useRef<YoloxDetector | null>(null);
    const animationFrameRef = useRef<number>(0);
    const videoRef = useRef<HTMLVideoElement | null>(null);

    useEffect(() => {
        const init = async () => {
            try {
                const detector = new YoloxDetector();
                await detector.load(modelPath);
                detectorRef.current = detector;
                setLoading(false);
            } catch (e) {
                console.error("Initialization failed", e);
                // Retry or state error?
            }
        };
        init();

        return () => {
            // Cleanup if needed
        };
    }, [modelPath]);

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

    const start = useCallback(() => {
        if (!videoRef.current) return;

        navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 640 }, height: { ideal: 480 } }
        }).then(stream => {
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play();
                setIsRunning(true);
            }
        }).catch(err => {
            console.error("Camera access denied", err);
        });
    }, []);

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

    return { loading, isRunning, start, stop, detections, videoRef };
}
