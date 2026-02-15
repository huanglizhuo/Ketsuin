import React, { useEffect, useState } from 'react';
import { SUPPORTED_JUTSUS, NINJA_RANKS } from '../../config/data';
import type { NinjaRank } from '../../config/data';
import { fetchLeaderboard, isSupabaseConfigured } from '../../core/supabase';
import type { LeaderboardEntry } from '../../core/supabase';
import { useI18n } from '../../i18n/I18nContext';

interface LeaderboardProps {
    initialJutsuId?: string;
    playerTimeMs?: number; // Highlight player's approximate position
    onBack: () => void;
}

function getRankBadge(rankId: string): NinjaRank | undefined {
    return NINJA_RANKS.find(r => r.id === rankId);
}

export const Leaderboard: React.FC<LeaderboardProps> = ({
    initialJutsuId,
    playerTimeMs,
    onBack,
}) => {
    const [selectedJutsuId, setSelectedJutsuId] = useState(initialJutsuId || SUPPORTED_JUTSUS[0].id);
    const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { t } = useI18n();

    useEffect(() => {
        loadLeaderboard(selectedJutsuId);
    }, [selectedJutsuId]);

    const loadLeaderboard = async (jutsuId: string) => {
        setLoading(true);
        setError(null);
        try {
            const data = await fetchLeaderboard(jutsuId, 50);
            setEntries(data);
        } catch (err) {
            setError(t('leaderboard.loadError'));
        } finally {
            setLoading(false);
        }
    };

    const selectedJutsu = SUPPORTED_JUTSUS.find(j => j.id === selectedJutsuId);

    return (
        <div className="flex flex-col gap-4 w-full max-w-2xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-2xl text-konoha-orange font-ninja drop-shadow-[0_0_8px_rgba(242,169,0,0.4)]">
                    {t('leaderboard.title')}
                </h2>
                <button
                    onClick={onBack}
                    className="text-sm text-gray-400 hover:text-white font-mono transition-colors"
                >
                    {t('leaderboard.back')}
                </button>
            </div>

            {/* Data source indicator */}
            <p className="text-[10px] text-gray-600 font-mono">
                {isSupabaseConfigured() ? t('leaderboard.global') : t('leaderboard.local')}
            </p>

            {/* Jutsu Tabs */}
            <div className="flex gap-1 overflow-x-auto pb-1">
                {SUPPORTED_JUTSUS.map(jutsu => (
                    <button
                        key={jutsu.id}
                        onClick={() => setSelectedJutsuId(jutsu.id)}
                        className={`px-3 py-1.5 rounded text-xs font-mono whitespace-nowrap transition-all duration-200
              ${jutsu.id === selectedJutsuId
                                ? 'bg-konoha-orange text-black font-bold'
                                : 'bg-black/30 text-gray-400 hover:text-white border border-white/10'
                            }`}
                    >
                        {jutsu.name}
                    </button>
                ))}
            </div>

            {/* Jutsu Info */}
            {selectedJutsu && (
                <div className="text-center text-xs text-gray-500 font-mono">
                    {selectedJutsu.nameEn} · {selectedJutsu.sequence.length} {t('jutsu.seals')} · {'⭐'.repeat(selectedJutsu.difficulty)}
                </div>
            )}

            {/* Leaderboard Table */}
            <div className="bg-black/40 backdrop-blur-sm border border-white/10 rounded-lg overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-gray-500 font-mono animate-pulse">
                        {t('leaderboard.loading')}
                    </div>
                ) : error ? (
                    <div className="p-8 text-center text-red-400 font-mono">{error}</div>
                ) : entries.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 font-mono">
                        <p className="text-lg mb-1">{t('leaderboard.empty')}</p>
                        <p className="text-xs">{t('leaderboard.emptyHint')}</p>
                    </div>
                ) : (
                    <div className="divide-y divide-white/5">
                        {/* Header Row */}
                        <div className="grid grid-cols-[50px_1fr_80px_80px] px-4 py-2 text-[10px] text-gray-600 font-mono uppercase">
                            <span>{t('leaderboard.rank')}</span>
                            <span>{t('leaderboard.ninja')}</span>
                            <span className="text-right">{t('leaderboard.time')}</span>
                            <span className="text-right">{t('leaderboard.level')}</span>
                        </div>

                        {/* Entries */}
                        {entries.map((entry, i) => {
                            const rank = getRankBadge(entry.rank_title);
                            const isPlayer = playerTimeMs !== undefined && entry.time_ms === playerTimeMs;

                            return (
                                <div
                                    key={entry.id || i}
                                    className={`grid grid-cols-[50px_1fr_80px_80px] px-4 py-2.5 items-center transition-all
                    ${isPlayer
                                            ? 'bg-konoha-orange/10 border-l-2 border-l-konoha-orange'
                                            : i < 3
                                                ? 'bg-white/[0.02]'
                                                : ''
                                        }`}
                                >
                                    {/* Rank Number */}
                                    <span className={`font-mono font-bold text-sm
                    ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-amber-600' : 'text-gray-500'}`}
                                    >
                                        #{i + 1}
                                    </span>

                                    {/* Ninja Name */}
                                    <div className="flex items-center gap-2 min-w-0">
                                        <span className="text-sm text-gray-200 truncate">
                                            {entry.ninja_name}
                                        </span>
                                        {isPlayer && (
                                            <span className="text-[10px] text-konoha-orange font-mono shrink-0">← You</span>
                                        )}
                                    </div>

                                    {/* Time */}
                                    <span className="text-sm text-white font-mono text-right tabular-nums">
                                        {(entry.time_ms / 1000).toFixed(3)}s
                                    </span>

                                    {/* Rank Badge */}
                                    <span className="text-xs text-right">
                                        {rank ? `${rank.emoji} ${rank.titleJp}` : entry.rank_title}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};
