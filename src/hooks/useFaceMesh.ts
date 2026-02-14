import { useEffect, useRef, useState } from 'react';
import { FaceMesh } from '@mediapipe/face_mesh';
import type { Results } from '@mediapipe/face_mesh';
import { Camera } from '@mediapipe/camera_utils';

export interface FaceState {
    mouthOpen: boolean;
    isBlowing: boolean;
    mouthPosition: { x: number; y: number };
    faceDetected: boolean;
}

export const useFaceMesh = (
    videoRef: React.RefObject<HTMLVideoElement | null>,
    active: boolean // Optimization: Only run when needed
) => {
    const [faceState, setFaceState] = useState<FaceState>({
        mouthOpen: false,
        isBlowing: false,
        mouthPosition: { x: 0, y: 0 },
        faceDetected: false,
    });

    const faceMeshRef = useRef<FaceMesh | null>(null);
    const cameraRef = useRef<Camera | null>(null);

    useEffect(() => {
        if (!active) {
            if (cameraRef.current) {
                cameraRef.current.stop();
            }
            return;
        }

        const faceMesh = new FaceMesh({
            locateFile: (file) => {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
            },
        });

        faceMesh.setOptions({
            maxNumFaces: 1,
            refineLandmarks: true, // Needed for Iris/lip details
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5,
        });

        faceMesh.onResults(onResults);
        faceMeshRef.current = faceMesh;

        if (videoRef.current) {
            const camera = new Camera(videoRef.current, {
                onFrame: async () => {
                    if (videoRef.current && faceMeshRef.current) {
                        await faceMeshRef.current.send({ image: videoRef.current });
                    }
                },
                width: 640,
                height: 480
            });
            camera.start();
            cameraRef.current = camera;
        }

        return () => {
            if (cameraRef.current) {
                cameraRef.current.stop();
            }
            faceMesh.close();
        };
    }, [active, videoRef]);

    const onResults = (results: Results) => {
        if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
            setFaceState(prev => ({ ...prev, faceDetected: false }));
            return;
        }

        const landmarks = results.multiFaceLandmarks[0];

        // Calculate Mouth State
        // Lips landmarks: Upper: 13, Lower: 14. 
        // Mouth corners: Left: 61, Right: 291

        const upperLip = landmarks[13];
        const lowerLip = landmarks[14];
        const leftCorner = landmarks[61];
        const rightCorner = landmarks[291];

        // Vertical distance
        const vDist = Math.abs(upperLip.y - lowerLip.y);
        // Horizontal distance
        const hDist = Math.abs(leftCorner.x - rightCorner.x);

        // Ratio: High V/H ratio means "O" shape (blowing)
        const ratio = vDist / hDist;

        // Thresholds need tuning. 
        // Normal mouth ~ 0.1 - 0.3
        // Open mouth (Aaa) ~ 0.5+
        // Blowing (Ooo) ~ Higher ratio but smaller hDist? 
        // Actually strictly "Blowing" is hard. But "Mouth Open Circular" is a good proxy.

        // Heuristic for blowing: "Circular" shape.
        // Small width + Medium height.

        const isBlowing = ratio > 0.4 && hDist < 0.2; // Tuning needed
        const isOpen = vDist > 0.05;

        // Position (Center of mouth)
        const centerX = (leftCorner.x + rightCorner.x) / 2;
        const centerY = (upperLip.y + lowerLip.y) / 2;

        setFaceState({
            mouthOpen: isOpen,
            isBlowing: isBlowing,
            mouthPosition: { x: centerX, y: centerY },
            faceDetected: true,
        });
    };

    return faceState;
};
