import { useRef, useEffect } from 'react';
import type { Detection } from '../core/yolox';
import { HAND_SIGNS } from '../config/data';

interface VideoFeedProps {
    videoRef: React.RefObject<HTMLVideoElement | null>;
    detections: Detection[];
}

export const VideoFeed: React.FC<VideoFeedProps> = ({ videoRef, detections }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const video = videoRef.current;
        if (!canvas || !video) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Ensure canvas matches video size if video is playing
        if (video.videoWidth) {
            if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
            }
        }

        // Draw detections
        detections.forEach(det => {
            const [x1, y1, x2, y2] = det.box;
            const w = x2 - x1;
            const h = y2 - y1;

            ctx.strokeStyle = '#00ff00';
            ctx.lineWidth = 2;
            ctx.strokeRect(x1, y1, w, h);

            const sign = HAND_SIGNS.find(s => s.id === det.classId + 1); // Mapping 0 -> 1 based on previous logic
            const label = sign ? `${sign.name} (${det.score.toFixed(2)})` : `Unknown ${det.classId}`;

            ctx.fillStyle = '#00ff00'; // text bg
            ctx.font = '16px Arial';
            ctx.fillText(label, x1, y1 - 5);
        });

    }, [detections, videoRef]);

    const containerStyle: React.CSSProperties = {
        position: 'relative',
        width: '640px',
        height: '480px',
        backgroundColor: 'black',
        border: '2px solid #333',
    };

    const absStyle: React.CSSProperties = {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        objectFit: 'contain'
    };

    return (
        <div style={containerStyle}>
            <video
                ref={videoRef}
                style={absStyle}
                muted
                playsInline
            />
            <canvas
                ref={canvasRef}
                style={absStyle}
            />
        </div>
    );
};
