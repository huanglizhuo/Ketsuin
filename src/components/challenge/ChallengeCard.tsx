import React from 'react';
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

    const jutsu = SUPPORTED_JUTSUS.find(j => j.id === jutsuId);
    const rank = NINJA_RANKS.find(r => r.id === rankId);

    if (!jutsu) return null;

    const time = (timeMs / 1000).toFixed(3);

    // Build localized strings with simple replacement
    const titleText = (t('share.challengeCard.title' as keyof typeof import('../../i18n/translations').translations.en) as string)
        .replace('{name}', challengerName);
    const beatText = (t('share.challengeCard.beat' as keyof typeof import('../../i18n/translations').translations.en) as string)
        .replace('{time}', time);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={onDismiss}
            />

            {/* Card */}
            <div
                className="relative w-full max-w-md bg-[#0a0a0a] border-2 border-konoha-orange/50 rounded-xl p-6
                           shadow-[0_0_40px_rgba(242,169,0,0.15)] animate-[card-enter_0.3s_ease-out]"
            >
                {/* Challenger Name */}
                <p className="text-center text-sm text-gray-400 font-mono mb-1">
                    {titleText}
                </p>

                {/* Rank Badge */}
                {rank && (
                    <div className="text-center mb-3">
                        <span className="text-4xl">{rank.emoji}</span>
                        <p className="text-konoha-orange font-ninja text-lg mt-1">
                            {rank.titleJp}
                        </p>
                    </div>
                )}

                {/* Jutsu Name */}
                <h3 className="text-center text-xl text-konoha-orange font-ninja-jp mb-1
                              drop-shadow-[0_0_10px_rgba(242,169,0,0.5)]">
                    {jutsu.name}
                </h3>
                <p className="text-center text-xs text-gray-500 font-mono mb-4">
                    {t(`jutsu.${jutsuId}.name` as keyof typeof import('../../i18n/translations').translations.en)}
                </p>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-black/50 border border-white/10 rounded-lg p-3 text-center">
                        <p className="text-2xl text-white font-mono font-bold">{time}s</p>
                        <p className="text-[10px] text-gray-500 font-mono uppercase">TIME</p>
                    </div>
                    <div className="bg-black/50 border border-white/10 rounded-lg p-3 text-center">
                        <p className="text-2xl text-white font-mono font-bold">{jutsu.sequence.length}</p>
                        <p className="text-[10px] text-gray-500 font-mono uppercase">SEALS</p>
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
                        className="flex-1 px-5 py-3 bg-konoha-orange text-black font-bold rounded-lg font-mono
                                   hover:bg-konoha-orange/80 transition-all duration-200 active:scale-[0.97]
                                   shadow-[0_0_20px_rgba(242,169,0,0.3)]"
                    >
                        {t('share.challengeCard.accept' as keyof typeof import('../../i18n/translations').translations.en)}
                    </button>
                    <button
                        onClick={onDismiss}
                        className="px-5 py-3 border border-white/20 text-gray-400 rounded-lg font-mono text-sm
                                   hover:border-white/40 hover:text-gray-200 transition-all duration-200"
                    >
                        {t('share.challengeCard.dismiss' as keyof typeof import('../../i18n/translations').translations.en)}
                    </button>
                </div>
            </div>

            {/* Keyframe for entrance */}
            <style>{`
                @keyframes card-enter {
                    from {
                        opacity: 0;
                        transform: scale(0.9) translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1) translateY(0);
                    }
                }
            `}</style>
        </div>
    );
};
