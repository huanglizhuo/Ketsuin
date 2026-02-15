import React, { useState } from 'react';
import { CHALLENGE_QUOTES } from '../../config/data';
import type { ChallengeResult as ChallengeResultType } from '../../core/ChallengeEngine';
import { submitScore, fetchPlayerRank } from '../../core/supabase';
import { useI18n } from '../../i18n/I18nContext';

interface ChallengeResultProps {
    result: ChallengeResultType;
    onRetry: () => void;
    onBackToSelect: () => void;
    onViewLeaderboard: () => void;
}

export const ChallengeResult: React.FC<ChallengeResultProps> = ({
    result,
    onRetry,
    onBackToSelect,
    onViewLeaderboard,
}) => {
    const [ninjaName, setNinjaName] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [playerRank, setPlayerRank] = useState<number | null>(null);
    const [error, setError] = useState('');
    const { t } = useI18n();

    // Random quote
    const quote = CHALLENGE_QUOTES[Math.floor(Math.random() * CHALLENGE_QUOTES.length)];

    const handleSubmit = async () => {
        const trimmed = ninjaName.trim();
        if (trimmed.length < 1 || trimmed.length > 12) {
            setError(t('result.nameError'));
            return;
        }

        setSubmitting(true);
        setError('');

        try {
            await submitScore({
                ninja_name: trimmed,
                challenge_type: 'jutsu',
                challenge_id: result.jutsu.id,
                time_ms: result.timeMs,
                sign_count: result.signCount,
                rank_title: result.rank.id,
            });

            const rank = await fetchPlayerRank(result.jutsu.id, result.timeMs);
            setPlayerRank(rank);
            setSubmitted(true);
        } catch (err) {
            setError(t('result.submitError'));
            setSubmitted(true);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col items-center gap-6 w-full max-w-lg mx-auto">
            {/* Result Card */}
            <div className="w-full bg-black/50 backdrop-blur-sm border border-konoha-orange/30 rounded-lg p-6 text-center
                      shadow-[0_0_30px_rgba(242,169,0,0.1)]">

                {/* Rank Badge */}
                <div
                    className="text-6xl mb-2"
                    style={{ animation: 'sekiro-flash 1.2s ease-out forwards' }}
                >
                    {result.rank.emoji}
                </div>
                <h2 className="text-3xl text-konoha-orange font-ninja mb-1
                       drop-shadow-[0_0_15px_rgba(242,169,0,0.6)]">
                    {result.rank.titleJp}
                </h2>
                <p className="text-sm text-gray-400 font-mono mb-4">{result.rank.title}</p>
                <p className="text-xs text-gray-500 italic">{result.rank.description}</p>

                {/* Divider */}
                <div className="border-t border-white/10 my-4"></div>

                {/* Stats */}
                <h3 className="text-lg text-konoha-orange font-ninja mb-2">
                    {result.jutsu.name}
                </h3>

                <div className="grid grid-cols-3 gap-4 mb-4">
                    <div>
                        <p className="text-2xl text-white font-mono font-bold">
                            {(result.timeMs / 1000).toFixed(3)}
                        </p>
                        <p className="text-[10px] text-gray-500 font-mono uppercase">{t('result.time')}</p>
                    </div>
                    <div>
                        <p className="text-2xl text-white font-mono font-bold">
                            {result.signCount}
                        </p>
                        <p className="text-[10px] text-gray-500 font-mono uppercase">{t('result.seals')}</p>
                    </div>
                    <div>
                        <p className="text-2xl text-white font-mono font-bold">
                            {result.secondsPerSign.toFixed(2)}
                        </p>
                        <p className="text-[10px] text-gray-500 font-mono uppercase">{t('result.sealSpeed')}</p>
                    </div>
                </div>

                {/* Quote */}
                <div className="bg-black/30 rounded p-3 mb-4 border border-white/5">
                    <p className="text-sm text-gray-300 italic">"{quote.text}"</p>
                    <p className="text-xs text-gray-500 mt-1">— {quote.character}</p>
                </div>

                {/* Rank position after submit */}
                {submitted && playerRank && (
                    <div className="bg-konoha-orange/10 border border-konoha-orange/30 rounded p-2 mb-4">
                        <p className="text-konoha-orange font-mono text-sm">
                            {t('result.globalRank')} <span className="text-lg font-bold">#{playerRank}</span>
                        </p>
                    </div>
                )}
            </div>

            {/* Ninja Name Input + Submit */}
            {!submitted ? (
                <div className="w-full bg-black/30 backdrop-blur-sm border border-white/10 rounded-lg p-4">
                    <label className="text-sm text-gray-400 font-mono block mb-2">
                        {t('result.ninjaNameLabel')}
                    </label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={ninjaName}
                            onChange={(e) => setNinjaName(e.target.value)}
                            maxLength={12}
                            placeholder="うずまきナルト"
                            className="flex-1 bg-black/50 border border-white/20 rounded px-3 py-2 text-white font-mono
                         focus:border-konoha-orange focus:outline-none focus:ring-1 focus:ring-konoha-orange/50
                         placeholder:text-gray-600"
                        />
                        <button
                            onClick={handleSubmit}
                            disabled={submitting || ninjaName.trim().length === 0}
                            className="px-4 py-2 bg-konoha-orange text-black font-bold rounded
                         hover:bg-konoha-orange/80 disabled:opacity-40 disabled:cursor-not-allowed
                         transition-all duration-200 font-mono text-sm"
                        >
                            {submitting ? t('result.submitting') : t('result.submit')}
                        </button>
                    </div>
                    {error && (
                        <p className="text-red-400 text-xs mt-2 font-mono">{error}</p>
                    )}
                    <p className="text-[10px] text-gray-600 mt-1 font-mono">
                        {t('result.ninjaNameHint')}
                    </p>
                </div>
            ) : (
                <p className="text-green-400 text-sm font-mono">{t('result.submitted')}</p>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 flex-wrap justify-center">
                <button
                    onClick={onRetry}
                    className="px-5 py-2 border border-konoha-orange text-konoha-orange rounded font-mono text-sm
                     hover:bg-konoha-orange hover:text-black transition-all duration-200"
                >
                    {t('result.retry')}
                </button>
                <button
                    onClick={onViewLeaderboard}
                    className="px-5 py-2 border border-white/20 text-gray-300 rounded font-mono text-sm
                     hover:border-white/40 hover:text-white transition-all duration-200"
                >
                    {t('result.leaderboard')}
                </button>
                <button
                    onClick={onBackToSelect}
                    className="px-5 py-2 border border-white/10 text-gray-500 rounded font-mono text-sm
                     hover:border-white/20 hover:text-gray-300 transition-all duration-200"
                >
                    {t('result.backToSelect')}
                </button>
            </div>
        </div>
    );
};
