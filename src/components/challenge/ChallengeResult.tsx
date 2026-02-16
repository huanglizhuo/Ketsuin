import React, { useState, useRef } from 'react';
import type { ChallengeResult as ChallengeResultType } from '../../core/ChallengeEngine';
import { submitScore, fetchPlayerRank } from '../../core/supabase';
import { buildShareText, buildShareUrl, shareToTwitter, copyToClipboard, copyImageToClipboard } from '../../core/share';
import { captureElementAsImage } from './ShareCardRenderer';
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
    const [copied, setCopied] = useState(false);
    const [imageCopied, setImageCopied] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);
    const { t, locale } = useI18n();

    // Random quote index (stable per render)
    const QUOTE_COUNT = 8;
    const [quoteIndex] = useState(() => Math.floor(Math.random() * QUOTE_COUNT));
    const quoteText = t(`quote.${quoteIndex}.text` as keyof typeof import('../../i18n/translations').translations.en);
    const quoteCharacter = t(`quote.${quoteIndex}.character` as keyof typeof import('../../i18n/translations').translations.en);

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

    // --- Share Handlers ---

    const translatedJutsuName = t(`jutsu.${result.jutsu.id}.name` as keyof typeof import('../../i18n/translations').translations.en);

    const captureCard = async (): Promise<Blob | null> => {
        if (!cardRef.current) return null;
        try {
            return await captureElementAsImage(cardRef.current);
        } catch {
            return null;
        }
    };

    const handleShareTwitter = async () => {
        // Capture live card and copy to clipboard, then open tweet compose
        const blob = await captureCard();
        if (blob) {
            try {
                await copyImageToClipboard(blob);
                setImageCopied(true);
                setTimeout(() => setImageCopied(false), 4000);
            } catch { /* ignore */ }
        }
        const text = buildShareText(result, locale, translatedJutsuName, ninjaName || undefined, submitted ? playerRank : null);
        shareToTwitter(text);
    };


    const handleCopyLink = async () => {
        const url = buildShareUrl(result, ninjaName || undefined);
        const ok = await copyToClipboard(url);
        if (ok) {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };



    return (
        <div className="flex flex-col items-center gap-6 w-full max-w-lg mx-auto">
            {/* Result Card — captured for screenshot */}
            <div
                ref={cardRef}
                className="w-full bg-black/50 backdrop-blur-sm border border-konoha-orange/30 rounded-lg p-6 text-center
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
                <p className="text-sm text-gray-400 font-mono mb-4">{t(`rank.${result.rank.id}` as keyof typeof import('../../i18n/translations').translations.en)}</p>
                <p className="text-xs text-gray-500 italic">{t(`rank.${result.rank.id}.desc` as keyof typeof import('../../i18n/translations').translations.en)}</p>

                {/* Divider */}
                <div className="border-t border-white/10 my-4"></div>

                {/* Stats */}
                <h3 className="text-lg text-konoha-orange font-ninja-jp mb-2">
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
                    <p className="text-sm text-gray-300 italic">"{quoteText}"</p>
                    <p className="text-xs text-gray-500 mt-1">— {quoteCharacter}</p>
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

            {/* Share Buttons */}
            <div className="w-full bg-black/30 backdrop-blur-sm border border-white/10 rounded-lg p-3">
                <p className="text-xs text-gray-500 font-mono text-center mb-2 uppercase tracking-wider">
                    {t('share.title' as keyof typeof import('../../i18n/translations').translations.en)}
                </p>

                {/* Image copied toast */}
                {imageCopied && (
                    <div className="bg-sky-500/10 border border-sky-500/30 rounded px-3 py-1.5 mb-2 text-center">
                        <p className="text-sky-400 text-xs font-mono">
                            {t('share.imageCopied' as keyof typeof import('../../i18n/translations').translations.en)}
                        </p>
                    </div>
                )}

                <div className="flex gap-2 flex-wrap justify-center">
                    <button
                        onClick={handleShareTwitter}
                        className="px-4 py-2 bg-black border border-white/20 text-gray-200 rounded font-mono text-sm
                         hover:border-sky-400 hover:text-sky-400 transition-all duration-200 flex items-center gap-1.5"
                    >
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                        {t('share.twitter' as keyof typeof import('../../i18n/translations').translations.en)}
                    </button>
                    <button
                        onClick={handleCopyLink}
                        className={`px-4 py-2 bg-black border rounded font-mono text-sm transition-all duration-200 flex items-center gap-1.5
                         ${copied
                                ? 'border-green-500 text-green-400'
                                : 'border-white/20 text-gray-200 hover:border-white/40 hover:text-white'
                            }`}
                    >
                        {copied
                            ? `✓ ${t('share.copied' as keyof typeof import('../../i18n/translations').translations.en)}`
                            : t('share.copy' as keyof typeof import('../../i18n/translations').translations.en)
                        }
                    </button>

                </div>
            </div>
        </div>
    );
};
