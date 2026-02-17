import React from 'react';
import { VideoFeed } from '../components/VideoFeed';
import { T9Keyboard } from '../components/T9Keyboard';
import { T9EditorDisplay } from '../components/T9EditorDisplay';
import { useI18n } from '../i18n/I18nContext';
import type { Detection } from '../core/yolox';
import { T9Engine } from '../core/T9Engine';

interface T9ViewProps {
    videoRef: React.RefObject<HTMLVideoElement | null>;
    detections: Detection[];
    isRunning: boolean;
    t9State: ReturnType<T9Engine['getState']>;
    onTextChange: (text: string) => void;
    activeSignId: number | null;
    mediaStream?: MediaStream | null;
    loading: boolean;
    error: string | null;
    onStart: () => void;
    onStop: () => void;
}

export const T9View: React.FC<T9ViewProps> = ({
    videoRef,
    detections,
    isRunning,
    t9State,
    onTextChange,
    activeSignId,
    mediaStream,
    loading,
    error,
    onStart,
    onStop
}) => {
    const { t } = useI18n();

    return (
        <div className="flex-1 flex flex-col gap-4 p-4 min-w-0 overflow-visible md:overflow-y-auto relative order-1 md:order-2">

            {/* Video Feed */}
            <div className="relative w-full max-w-2xl mx-auto z-0 shrink-0">
                <div className={`relative aspect-video bg-black rounded-lg overflow-hidden border-2 shadow-2xl group transition-colors duration-500 border-gray-700 hover:border-konoha-orange`}>

                    <VideoFeed
                        videoRef={videoRef}
                        detections={detections}
                        srcObject={mediaStream}
                        isRunning={isRunning}
                        isLoading={loading}
                        error={error}
                        onStart={onStart}
                        onStop={onStop}
                        enableControls={true}
                    />

                    {/* Scanline effect */}
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-transparent h-full w-full pointer-events-none animate-scan"></div>
                </div>

                {/* Status Indicator */}
                <div className="absolute top-4 left-4 px-2 py-1 bg-black/80 border border-green-500 text-green-500 text-xs font-mono rounded backdrop-blur-sm shadow flex flex-col gap-1">
                    <span>SYS: {isRunning ? t('t9.status.active') : t('t9.status.standby')}</span>
                </div>
            </div>

            {/* Basic Mode UI: T9 Ninja Input Split Layout */}
            <div className="flex-1 flex flex-col md:flex-row gap-4 min-h-0 shrink-0">
                {/* Left Col: T9 Keyboard Reference */}
                <div className="flex-1 flex flex-col gap-2 min-w-0 justify-center order-2 md:order-1">
                    <div className="rounded-lg p-2 flex-1 flex flex-col justify-center backdrop-blur-sm bg-black/30 border border-white/10">
                        <h3 className="text-x text-gray-400 font-mono text-center mb-2 uppercase tracking-widest text-shadow">{t('t9.keypad')}</h3>
                        <T9Keyboard activeSignId={activeSignId} />
                        <div className="text-center text-gray-400 text-[20px] font-mono mt-2 text-shadow">
                            {t('t9.hint')}
                        </div>
                    </div>
                </div>

                {/* Right Col: Editor Result */}
                <div className="flex-[1.5] min-w-0 order-1 md:order-2">
                    <T9EditorDisplay
                        {...t9State}
                        onTextChange={onTextChange}
                    />
                </div>
            </div>
        </div>
    );
};
