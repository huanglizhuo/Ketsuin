import React, { useEffect, useId, useRef } from 'react';
import { SUPPORTED_JUTSUS, NINJA_RANKS } from '../../config/data';
import { useI18n } from '../../i18n/I18nContext';

interface ChallengeCardProps {
    challengerName: string;
    jutsuId: string;
    timeMs: number;
    rankId: string;
    onAccept: () => void;
    onDismiss: () => void;
}

export const ChallengeCard: React.FC<ChallengeCardProps> = ({
    challengerName,
    jutsuId,
    timeMs,
    rankId,
    onAccept,
    onDismiss,
}) => {
    const { t } = useI18n();
    const dialogRef = useRef<HTMLDivElement>(null);
    const previouslyFocusedRef = useRef<HTMLElement | null>(null);
    const titleId = useId();

    const jutsu = SUPPORTED_JUTSUS.find(j => j.id === jutsuId);
    const rank = NINJA_RANKS.find(r => r.id === rankId);

    useEffect(() => {
        previouslyFocusedRef.current = document.activeElement as HTMLElement | null;

        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.stopPropagation();
                onDismiss();
                return;
            }
            if (e.key !== 'Tab') return;
            const root = dialogRef.current;
            if (!root) return;
            const focusables = root.querySelectorAll<HTMLElement>(
                'a, button, input, textarea, select, [tabindex]:not([tabindex="-1"])'
            );
            if (focusables.length === 0) return;
            const first = focusables[0];
            const last = focusables[focusables.length - 1];
            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        };

        document.addEventListener('keydown', handleKey);
        queueMicrotask(() => dialogRef.current?.focus());

        return () => {
            document.removeEventListener('keydown', handleKey);
            previouslyFocusedRef.current?.focus?.();
        };
    }, [onDismiss]);

    if (!jutsu) return null;

    const time = (timeMs / 1000).toFixed(3);

    const titleText = (t('share.challengeCard.title' as keyof typeof import('../../i18n/translations').translations.en) as string)
        .replace('{name}', challengerName);
    const beatText = (t('share.challengeCard.beat' as keyof typeof import('../../i18n/translations').translations.en) as string)
        .replace('{time}', time);

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            role="presentation"
        >
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={onDismiss}
            />

            {/* Card */}
            <div
                ref={dialogRef}
                tabIndex={-1}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                className="relative w-full max-w-md bg-ink border-2 border-konoha-orange/50 rounded-xl p-6 shadow-chakra-2xl animate-card-enter"
            >
                {/* Challenger Name */}
                <p className="text-center text-sm text-gray-300 font-mono mb-1">
                    {titleText}
                </p>

                {/* Rank Badge */}
                {rank && (
                    <div className="text-center mb-3">
                        <span className="text-4xl" aria-hidden="true">{rank.emoji}</span>
                        <p className="text-konoha-orange font-ninja text-lg mt-1">
                            {rank.titleJp}
                        </p>
                    </div>
                )}

                {/* Jutsu Name */}
                <h3 id={titleId} className="text-center text-xl text-konoha-orange font-ninja-jp mb-1 drop-shadow-chakra-sm">
                    {jutsu.name}
                </h3>
                <p className="text-center text-xs text-gray-400 font-mono mb-4">
                    {t(`jutsu.${jutsuId}.name` as keyof typeof import('../../i18n/translations').translations.en)}
                </p>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-black/50 border border-white/10 rounded-lg p-3 text-center">
                        <p className="text-2xl text-white font-mono font-bold tabular-nums">{time}s</p>
                        <p className="text-xs text-gray-400 font-mono uppercase tracking-wider">TIME</p>
                    </div>
                    <div className="bg-black/50 border border-white/10 rounded-lg p-3 text-center">
                        <p className="text-2xl text-white font-mono font-bold tabular-nums">{jutsu.sequence.length}</p>
                        <p className="text-xs text-gray-400 font-mono uppercase tracking-wider">SEALS</p>
                    </div>
                </div>

                {/* Challenge Text */}
                <p className="text-center text-lg text-white font-bold mb-5">
                    {beatText}
                </p>

                {/* Buttons */}
                <div className="flex gap-3">
                    <button
                        onClick={onAccept}
                        className="flex-1 px-5 py-3 bg-konoha-orange text-black font-bold rounded-lg font-mono hover:bg-konoha-orange/80 transition-all duration-200 active:scale-[0.97] shadow-chakra-md"
                    >
                        {t('share.challengeCard.accept' as keyof typeof import('../../i18n/translations').translations.en)}
                    </button>
                    <button
                        onClick={onDismiss}
                        className="px-5 py-3 border border-white/20 text-gray-300 rounded-lg font-mono text-sm hover:border-white/40 hover:text-white transition-all duration-200"
                    >
                        {t('share.challengeCard.dismiss' as keyof typeof import('../../i18n/translations').translations.en)}
                    </button>
                </div>
            </div>
        </div>
    );
};
