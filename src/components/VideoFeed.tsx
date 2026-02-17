import { useRef, useEffect } from 'react';
import type { Detection } from '../core/yolox';
import { HAND_SIGNS } from '../config/data';
import { useI18n } from '../i18n/I18nContext';

interface VideoFeedProps {
    videoRef: React.RefObject<HTMLVideoElement | null>;
    detections: Detection[];
    srcObject?: MediaStream | null;
    isRunning?: boolean;
    isLoading?: boolean;
    error?: string | null;
    onStart?: () => void;
    onStop?: () => void;
    enableControls?: boolean;
}

export const VideoFeed: React.FC<VideoFeedProps> = ({
    videoRef,
    detections,
    srcObject,
    isRunning,
    isLoading,
    error,
    onStart,
    onStop,
    enableControls = false
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { t } = useI18n();

    // Re-attach stream when component remounts or stream changes
    useEffect(() => {
        if (videoRef.current && srcObject) {
            videoRef.current.srcObject = srcObject;
            // Need to ensure it plays if it was playing, or just call play()
            videoRef.current.play().catch(e => console.log('Video play error:', e));
        }
    }, [videoRef, srcObject]);

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

            ctx.strokeStyle = '#F2A900';
            ctx.shadowColor = '#F2A900';
            ctx.shadowBlur = 10;
            ctx.lineWidth = 2;
            ctx.strokeRect(x1, y1, w, h);

            const sign = HAND_SIGNS.find(s => s.id === det.classId + 1); // Mapping 0 -> 1 based on previous logic
            const label = sign ? `${sign.kanji} ${sign.name} (${det.score.toFixed(2)})` : `Unknown ${det.classId}`;

            ctx.fillStyle = '#F2A900'; // text bg
            ctx.font = '16px "AaJianMingShouShu-2"';
            ctx.fillText(label, x1, y1 - 5);
        });

    }, [detections, videoRef]);

    const containerStyle: React.CSSProperties = {
        position: 'relative',
        width: '100%',
        height: '100%',
        backgroundColor: 'black',
        // border: '2px solid #333', // Border handled by parent
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
        <div style={containerStyle} className="group relative">
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

            {/* Error Overlay */}
            {error && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-20">
                    <div className="text-red-500 font-mono p-4 border border-red-500 bg-black rounded text-center">
                        <div className="text-2xl mb-2">🚫</div>
                        {error}
                    </div>
                </div>
            )}

            {/* Controls Overlay */}
            {enableControls && !error && (
                <>
                    {/* Loading State */}
                    {isLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-20 backdrop-blur-sm">
                            <div className="flex flex-col items-center gap-3">
                                <div className="w-12 h-12 border-4 border-konoha-orange border-t-transparent rounded-full animate-spin"></div>
                                <span className="text-konoha-orange font-ninja tracking-widest animate-pulse">
                                    {t('header.loading')}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Start Button (Center) */}
                    {!isRunning && !isLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 hover:bg-black/20 transition-colors z-10 cursor-pointer" onClick={onStart}>
                            <button
                                className="px-8 py-3 bg-konoha-orange/90 hover:bg-konoha-orange text-black font-bold font-ninja text-xl tracking-[0.2em] rounded border-2 border-yellow-400 shadow-[0_0_20px_rgba(242,169,0,0.6)] hover:scale-105 active:scale-95 transition-all duration-200"
                            >
                                {t('header.start')}
                            </button>
                        </div>
                    )}

                    {/* Stop Button (Top Right) */}
                    {isRunning && (
                        <div className="absolute top-4 right-4 z-20 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300">
                            <button
                                onClick={onStop}
                                className="px-3 py-1 bg-red-900/80 hover:bg-red-600 text-white text-xs font-mono border border-red-500 rounded backdrop-blur-md shadow-lg transition-colors"
                            >
                                ■ {t('header.stop')}
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};
