import React from 'react';
import { useI18n } from '../../i18n/I18nContext';
import { NINJA_RANKS } from '../../config/data';

interface RankInfoModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const RankInfoModal: React.FC<RankInfoModalProps> = ({ isOpen, onClose }) => {
    const { t } = useI18n();

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in" onClick={onClose}>
            <div className="bg-ninja-black border border-konoha-orange/50 rounded-lg max-w-sm w-full overflow-hidden shadow-[0_0_50px_rgba(242,169,0,0.2)]" onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div className="bg-black/40 p-4 border-b border-white/10 flex justify-between items-center">
                    <h3 className="text-xl font-bold text-konoha-orange font-ninja tracking-wider">
                        {t('rankInfo.title')}
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
                </div>

                {/* Content */}
                <div className="p-4 space-y-3">
                    <div className="flex justify-between text-xs text-gray-500 font-mono uppercase border-b border-white/5 pb-2 mb-2">
                        <span>Rank</span>
                        <span>{t('rankInfo.criteria')}</span>
                    </div>

                    {NINJA_RANKS.map((rank) => (
                        <div key={rank.id} className="flex justify-between items-center p-2 rounded hover:bg-white/5 transition-colors">
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">{rank.emoji}</span>
                                <div>
                                    <div className="font-bold text-gray-200">
                                        {t(`rank.${rank.id}` as any)}
                                    </div>
                                    <div className="text-[10px] text-gray-500">{t(`rank.${rank.id}.desc` as any)}</div>
                                </div>
                            </div>
                            <div className="text-right">
                                {rank.maxSecondsPerSign === Infinity ? (
                                    <span className="text-gray-500 font-mono text-sm">&gt; 2.5s</span>
                                ) : (
                                    <span className="text-konoha-orange font-mono font-bold text-sm">
                                        &lt; {rank.maxSecondsPerSign}s
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="p-3 bg-black/40 text-center border-t border-white/10">
                    <p className="text-[10px] text-gray-500 font-mono">
                        Speed is the essence of a ninja.
                    </p>
                </div>
            </div>
        </div>
    );
};
