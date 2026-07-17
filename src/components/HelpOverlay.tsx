import React, { useEffect, useId, useRef, useState } from 'react';
import { useI18n } from '../i18n/I18nContext';
import { LanguageSwitcher } from './LanguageSwitcher';

interface HelpOverlayProps {
    isOpen: boolean;
    onClose: () => void;
}

export const HelpOverlay: React.FC<HelpOverlayProps> = ({ isOpen, onClose }) => {
    const { t } = useI18n();
    const [activeTab, setActiveTab] = useState<'t9' | 'challenge'>('t9');
    const dialogRef = useRef<HTMLDivElement>(null);
    const previouslyFocusedRef = useRef<HTMLElement | null>(null);
    const t9TabRef = useRef<HTMLButtonElement>(null);
    const challengeTabRef = useRef<HTMLButtonElement>(null);
    const titleId = useId();
    const t9TabId = useId();
    const challengeTabId = useId();
    const t9PanelId = useId();
    const challengePanelId = useId();

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

    // Tablist arrow-key navigation — WAI-ARIA Authoring Practices pattern.
    const handleTabKeyDown = (e: React.KeyboardEvent) => {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft' && e.key !== 'Home' && e.key !== 'End') return;
        e.preventDefault();
        if (e.key === 'ArrowRight' || e.key === 'End') {
            setActiveTab('challenge');
            challengeTabRef.current?.focus();
        } else {
            setActiveTab('t9');
            t9TabRef.current?.focus();
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
            onClick={onClose}
            role="presentation"
        >
            <div
                ref={dialogRef}
                tabIndex={-1}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                className="bg-ninja-black border border-konoha-orange/30 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl relative"
                onClick={e => e.stopPropagation()}
            >

                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b border-white/10 bg-black/40">
                    <h2 id={titleId} className="text-xl md:text-2xl text-konoha-orange font-bold font-ninja tracking-wider">
                        {t('help.title')}
                    </h2>
                    <div className="flex items-center gap-3">
                        <LanguageSwitcher />
                        <button
                            onClick={onClose}
                            aria-label={t('help.close')}
                            className="text-gray-400 hover:text-white transition-colors p-2.5 rounded"
                        >
                            <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-white/10" role="tablist" aria-label={t('help.title')}>
                    <button
                        ref={t9TabRef}
                        id={t9TabId}
                        role="tab"
                        aria-selected={activeTab === 't9'}
                        aria-controls={t9PanelId}
                        tabIndex={activeTab === 't9' ? 0 : -1}
                        onClick={() => setActiveTab('t9')}
                        onKeyDown={handleTabKeyDown}
                        className={`flex-1 py-3 text-sm md:text-base font-bold uppercase tracking-wider transition-colors
                            ${activeTab === 't9'
                                ? 'bg-konoha-orange/10 text-konoha-orange border-b-2 border-konoha-orange'
                                : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'}`}
                    >
                        {t('help.tab.t9')}
                    </button>
                    <button
                        ref={challengeTabRef}
                        id={challengeTabId}
                        role="tab"
                        aria-selected={activeTab === 'challenge'}
                        aria-controls={challengePanelId}
                        tabIndex={activeTab === 'challenge' ? 0 : -1}
                        onClick={() => setActiveTab('challenge')}
                        onKeyDown={handleTabKeyDown}
                        className={`flex-1 py-3 text-sm md:text-base font-bold uppercase tracking-wider transition-colors
                            ${activeTab === 'challenge'
                                ? 'bg-konoha-orange/10 text-konoha-orange border-b-2 border-konoha-orange'
                                : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'}`}
                    >
                        {t('help.tab.challenge')}
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 text-gray-200">
                    {activeTab === 't9' ? (
                        <div
                            role="tabpanel"
                            id={t9PanelId}
                            aria-labelledby={t9TabId}
                            tabIndex={0}
                            className="space-y-6"
                        >
                            <div className="flex flex-col gap-2">
                                <h3 className="text-lg font-bold text-white">
                                    {t('help.t9.intro')}
                                </h3>
                                <p className="text-sm text-gray-300 leading-relaxed">
                                    {t('help.t9.desc')}
                                </p>
                            </div>

                            <div className="grid grid-cols-3 gap-2 md:gap-4">
                                {[
                                    { id: 1, sign: '子', key: '1' },
                                    { id: 2, sign: '丑', key: '2' },
                                    { id: 3, sign: '寅', key: '3' },
                                    { id: 4, sign: '卯', key: '4' },
                                    { id: 5, sign: '辰', key: '5' },
                                    { id: 6, sign: '巳', key: '6' },
                                    { id: 7, sign: '午', key: '7' },
                                    { id: 8, sign: '未', key: '8' },
                                    { id: 9, sign: '申', key: '9' },
                                    { id: 10, sign: '酉', key: '*' },
                                    { id: 11, sign: '戌', key: '0' },
                                    { id: 12, sign: '亥', key: '#' },
                                ].map((item) => (
                                    <div key={item.id} className="bg-white/5 rounded p-2 flex flex-col items-center border border-white/5 hover:border-konoha-orange/30 transition-colors">
                                        <img
                                            src={`${import.meta.env.BASE_URL}asset/${item.sign}.webp`}
                                            alt={item.sign}
                                            loading="lazy"
                                            decoding="async"
                                            className="w-8 h-8 md:w-12 md:h-12 object-contain mb-1"
                                        />
                                        <div className="text-xs font-mono text-gray-400">{item.sign}</div>
                                        <div className="text-xs font-bold text-konoha-orange mt-1">{t('help.key')} {item.key}</div>
                                    </div>
                                ))}
                            </div>

                            <div className="bg-chakra-blue/10 rounded p-4 text-sm">
                                <span className="text-konoha-orange font-bold">{t('help.tip_prefix')}</span>
                                {t('help.t9.tip')}
                            </div>
                        </div>
                    ) : (
                        <div
                            role="tabpanel"
                            id={challengePanelId}
                            aria-labelledby={challengeTabId}
                            tabIndex={0}
                            className="space-y-6"
                        >
                            <div className="flex flex-col gap-2">
                                <h3 className="text-lg font-bold text-white">
                                    {t('help.challenge.intro')}
                                </h3>
                                <p className="text-sm text-gray-300 leading-relaxed">
                                    {t('help.challenge.desc')}
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div className="flex gap-4 items-start">
                                    <div className="bg-konoha-orange/10 text-konoha-orange font-bold rounded-full w-8 h-8 flex items-center justify-center shrink-0 border border-konoha-orange/30">1</div>
                                    <div>
                                        <h4 className="font-bold text-gray-200">{t('help.challenge.step1.title')}</h4>
                                        <p className="text-xs text-gray-400 mt-1">{t('help.challenge.step1.desc')}</p>
                                    </div>
                                </div>
                                <div className="flex gap-4 items-start">
                                    <div className="bg-konoha-orange/10 text-konoha-orange font-bold rounded-full w-8 h-8 flex items-center justify-center shrink-0 border border-konoha-orange/30">2</div>
                                    <div>
                                        <h4 className="font-bold text-gray-200">{t('help.challenge.step2.title')}</h4>
                                        <p className="text-xs text-gray-400 mt-1">{t('help.challenge.step2.desc')}</p>
                                    </div>
                                </div>
                                <div className="flex gap-4 items-start">
                                    <div className="bg-konoha-orange/10 text-konoha-orange font-bold rounded-full w-8 h-8 flex items-center justify-center shrink-0 border border-konoha-orange/30">3</div>
                                    <div>
                                        <h4 className="font-bold text-gray-200">{t('help.challenge.step3.title')}</h4>
                                        <p className="text-xs text-gray-400 mt-1">{t('help.challenge.step3.desc')}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-akatsuki-red/15 rounded p-4 text-sm text-red-200">
                                <span className="font-bold">{t('help.warning_prefix')}</span>
                                {t('help.challenge.warning')}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-white/10 bg-black/40 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 bg-konoha-orange hover:bg-orange-500 text-black font-bold rounded transition-colors"
                    >
                        {t('help.close')}
                    </button>
                </div>
            </div>
        </div>
    );
};
