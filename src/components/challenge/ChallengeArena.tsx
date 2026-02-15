import React, { useEffect, useState, useRef } from 'react';
import { HAND_SIGNS } from '../../config/data';
import type { ChallengeState } from '../../core/ChallengeEngine';
import { useI18n } from '../../i18n/I18nContext';

interface ChallengeArenaProps {
    state: ChallengeState;
    children?: React.ReactNode; // VideoFeed slot
}

export const ChallengeArena: React.FC<ChallengeArenaProps> = ({ state, children }) => {
    const { selectedJutsu, phase, currentSignIndex, totalSigns, lastError, countdownValue } = state;
    const [displayTime, setDisplayTime] = useState('0.000');
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const startRef = useRef(0);
    const { t } = useI18n();

    // Live timer during active phase
    useEffect(() => {
        if (phase === 'active') {
            startRef.current = Date.now() - state.elapsedMs;
            timerRef.current = setInterval(() => {
                const elapsed = (Date.now() - startRef.current) / 1000;
                setDisplayTime(elapsed.toFixed(3));
            }, 16); // ~60fps timer update
        } else {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
            if (phase === 'complete') {
                setDisplayTime((state.elapsedMs / 1000).toFixed(3));
            }
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [phase]);

    if (!selectedJutsu) return null;

    const sequence = selectedJutsu.sequence;

    // Current sign to perform
    const currentSign = phase === 'active' && currentSignIndex < sequence.length
        ? HAND_SIGNS.find(s => s.id === sequence[currentSignIndex])
        : null;

    // Next sign preview
    const nextSign = phase === 'active' && currentSignIndex + 1 < sequence.length
        ? HAND_SIGNS.find(s => s.id === sequence[currentSignIndex + 1])
        : null;

    return (
        <div className="flex flex-col gap-4 w-full max-w-4xl mx-auto relative">
            {/* Jutsu Title */}
            <div className="text-center">
                <h2 className="text-xl md:text-2xl text-konoha-orange font-ninja-jp drop-shadow-[0_0_8px_rgba(242,169,0,0.4)]">
                    {selectedJutsu.name}
                </h2>
                <p className="text-xs text-gray-500 font-mono">{t(`jutsu.${selectedJutsu.id}.name` as keyof typeof import('../../i18n/translations').translations.en)}</p>
            </div>

            {/* Countdown Overlay */}
            {phase === 'countdown' && (
                <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
                    <div
                        key={countdownValue}
                        className="text-[10rem] md:text-[15rem] text-konoha-orange font-ninja leading-none select-none
                       drop-shadow-[0_0_40px_rgba(242,169,0,0.8)]"
                        style={{ animation: 'sekiro-flash 1s ease-out forwards' }}
                    >
                        {countdownValue}
                    </div>
                </div>
            )}

            {/* Video Feed Area */}
            <div className="relative w-full max-w-2xl mx-auto z-0 shrink-0">
                <div className={`relative aspect-video bg-black rounded-lg overflow-hidden border-2 shadow-2xl transition-colors duration-300
          ${lastError ? 'border-red-500 shadow-[0_0_20px_#ff0000]' : 'border-gray-700 hover:border-konoha-orange'}`}
                >
                    {children}
                    {/* Scanline */}
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-transparent h-full w-full pointer-events-none animate-scan"></div>
                </div>
            </div>

            {/* Current Sign Display */}
            {phase === 'active' && currentSign && (
                <div className="flex items-center justify-center gap-6">
                    {/* Current sign - large */}
                    <div className={`flex flex-col items-center transition-all duration-200 ${lastError ? 'animate-[head-shake_0.5s]' : ''}`}>
                        <span className={`text-[6rem] md:text-[8rem] font-ninja-jp leading-none select-none
              ${lastError
                                ? 'text-red-500 drop-shadow-[0_0_20px_rgba(255,0,0,0.8)]'
                                : 'text-konoha-orange drop-shadow-[0_0_20px_rgba(242,169,0,0.6)]'
                            }`}
                        >
                            {currentSign.kanji}
                        </span>
                        <span className="text-sm text-gray-400 font-mono mt-1">
                            {currentSign.name}
                        </span>
                        {lastError && (
                            <span className="text-red-400 text-xs font-mono mt-1 animate-pulse">
                                {t('arena.retry')}
                            </span>
                        )}
                    </div>

                    {/* Arrow + Next sign preview */}
                    {nextSign && (
                        <>
                            <span className="text-3xl text-gray-600">→</span>
                            <div className="flex flex-col items-center opacity-40">
                                <span className="text-[3rem] md:text-[4rem] font-ninja-jp text-gray-400 leading-none">
                                    {nextSign.kanji}
                                </span>
                                <span className="text-xs text-gray-600 font-mono mt-1">
                                    {nextSign.name}
                                </span>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Progress Bar */}
            {(phase === 'active' || phase === 'complete') && (
                <div className="bg-black/30 backdrop-blur-sm border border-white/10 rounded-lg p-3">
                    {/* Timer */}
                    <div className="text-center mb-2">
                        <span className="text-3xl md:text-4xl text-konoha-orange font-mono font-bold tabular-nums tracking-wider
                           drop-shadow-[0_0_10px_rgba(242,169,0,0.4)]">
                            {displayTime}s
                        </span>
                    </div>

                    {/* Seal Progress */}
                    <div className="flex items-center justify-center gap-1 flex-wrap">
                        {sequence.map((signId, i) => {
                            const sign = HAND_SIGNS.find(s => s.id === signId);
                            const isCompleted = i < currentSignIndex;
                            const isCurrent = i === currentSignIndex && phase === 'active';

                            return (
                                <div
                                    key={i}
                                    className={`flex flex-col items-center min-w-[28px] px-1 py-0.5 rounded transition-all duration-200
                    ${isCompleted
                                            ? 'text-konoha-orange scale-100'
                                            : isCurrent
                                                ? 'text-white scale-110 bg-konoha-orange/20 ring-1 ring-konoha-orange/50'
                                                : 'text-gray-600 scale-90 opacity-50'
                                        }`}
                                >
                                    <span className="text-lg font-ninja-jp leading-none">
                                        {sign?.kanji || '?'}
                                    </span>
                                    <span className="text-[7px] font-mono">
                                        {i + 1}
                                    </span>
                                </div>
                            );
                        })}
                    </div>

                    {/* Count */}
                    <div className="text-center mt-1">
                        <span className="text-xs text-gray-500 font-mono">
                            {currentSignIndex} / {totalSigns} {t('jutsu.seals')}
                        </span>
                    </div>
                </div>
            )}

            {/* Inline keyframe for error shake */}
            <style>{`
        @keyframes head-shake {
          0% { transform: translateX(0); }
          25% { transform: translateX(-8px); }
          50% { transform: translateX(8px); }
          75% { transform: translateX(-4px); }
          100% { transform: translateX(0); }
        }
      `}</style>
        </div>
    );
};
