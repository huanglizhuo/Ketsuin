import React, { useEffect, useId, useRef } from 'react';
import { useI18n } from '../../i18n/I18nContext';
import { NINJA_RANKS } from '../../config/data';

interface RankInfoModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const RankInfoModal: React.FC<RankInfoModalProps> = ({ isOpen, onClose }) => {
    const { t } = useI18n();
    const dialogRef = useRef<HTMLDivElement>(null);
    const previouslyFocusedRef = useRef<HTMLElement | null>(null);
    const titleId = useId();

    useEffect(() => {
        if (!isOpen) return;
        previouslyFocusedRef.current = document.activeElement as HTMLElement | null;

        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.stopPropagation();
                onClose();
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
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
            onClick={onClose}
            role="presentation"
        >
            <div
                ref={dialogRef}
                tabIndex={-1}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                className="bg-ninja-black border border-konoha-orange/50 rounded-lg max-w-sm w-full overflow-hidden shadow-chakra-xl"
                onClick={e => e.stopPropagation()}
            >

                {/* Header */}
                <div className="bg-black/40 p-4 border-b border-white/10 flex justify-between items-center">
                    <h3 id={titleId} className="text-xl font-bold text-konoha-orange font-ninja tracking-wider">
                        {t('rankInfo.title')}
                    </h3>
                    <button
                        onClick={onClose}
                        aria-label="Close"
                        className="text-gray-400 hover:text-white p-2.5 rounded transition-colors"
                    >
                        <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 space-y-3">
                    <div className="flex justify-between text-xs text-gray-400 font-mono uppercase border-b border-white/5 pb-2 mb-2">
                        <span>Rank</span>
                        <span>{t('rankInfo.criteria')}</span>
                    </div>

                    {NINJA_RANKS.map((rank) => (
                        <div key={rank.id} className="flex justify-between items-center p-2 rounded hover:bg-white/5 transition-colors">
                            <div className="flex items-center gap-3">
                                <span className="text-2xl" aria-hidden="true">{rank.emoji}</span>
                                <div>
                                    <div className="font-bold text-gray-200">
                                        {t(`rank.${rank.id}` as any)}
                                    </div>
                                    <div className="text-xs text-gray-400">{t(`rank.${rank.id}.desc` as any)}</div>
                                </div>
                            </div>
                            <div className="text-right">
                                {rank.maxSecondsPerSign === Infinity ? (
                                    <span className="text-gray-400 font-mono text-sm">&gt; 2.5s</span>
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
                    <p className="text-xs text-gray-400 font-mono">
                        Speed is the essence of a ninja.
                    </p>
                </div>
            </div>
        </div>
    );
};
