import React from 'react';
import type { AppMode } from '../App';
import { useI18n } from '../i18n/I18nContext';
import { LanguageSwitcher } from './LanguageSwitcher';

interface HeaderProps {
    loading: boolean;
    isRunning: boolean;
    error: string | null;
    start: () => void;
    stop: () => void;
    appMode: AppMode;
    onModeChange: (mode: AppMode) => void;
    onOpenHelp: () => void;
}

export const Header: React.FC<HeaderProps> = ({ loading, isRunning, error, start, stop, appMode, onModeChange, onOpenHelp }) => {
    const [showTooltip, setShowTooltip] = React.useState(false);
    const { t } = useI18n();

    React.useEffect(() => {
        const hasStarted = localStorage.getItem('ketsuin_started');
        if (!hasStarted) {
            setShowTooltip(true);
        }
    }, []);

    const handleStart = () => {
        localStorage.setItem('ketsuin_started', 'true');
        setShowTooltip(false);
        start();
    };

    return (
        <header className="px-6 py-3 bg-transparent flex flex-col z-10 relative">
            {/* Fullscreen Backdrop for First Time Tooltip */}
            {showTooltip && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-all duration-500 pointer-events-none" />
            )}

            <div className="flex justify-between items-center relative">
                <div className="flex items-center gap-3">
                    <img src={`${import.meta.env.BASE_URL}asset/ketsuin.png`} alt="Ketsuin Logo" className="w-10 h-10 object-contain drop-shadow-md" />
                    <h1 className="text-2xl md:text-3xl text-konoha-orange font-bold tracking-wider text-gray-100 font-ninja drop-shadow-md">
                        结印-KeTsuIn
                    </h1>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={isRunning ? stop : handleStart}
                        disabled={loading}
                        className={`
                        px-6 py-2 bg-gray-800 border-2 rounded font-bold tracking-widest uppercase transition-all duration-300 relative
                        ${showTooltip ? 'z-50 shadow-[0_0_30px_rgba(242,169,0,0.6)] scale-110' : ''}
                        ${error
                                ? 'border-red-500 text-red-500 hover:bg-red-500/10 cursor-pointer shadow-[0_0_15px_#ff0000]'
                                : loading
                                    ? 'cursor-wait opacity-50 border-gray-600'
                                    : isRunning
                                        ? 'border-akatsuki-red text-akatsuki-red hover:bg-akatsuki-red hover:text-white shadow-[0_0_15px_#980000]'
                                        : 'border-konoha-orange text-konoha-orange hover:bg-konoha-orange hover:text-black shadow-[0_0_15px_#F2A900]'}
                    `}
                    >
                        {error ? (
                            <span className="flex items-center gap-2 text-xs md:text-sm whitespace-nowrap">
                                <span className="text-lg">🚫</span> {error}
                            </span>
                        ) : loading ? t('header.loading') : isRunning ? t('header.stop') : t('header.start')}

                        {/* Tooltip for first-time users */}
                        {showTooltip && !loading && !isRunning && (
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-4 w-40 p-2 bg-konoha-orange text-black font-bold text-xs rounded text-center shadow-[0_0_10px_#F2A900] animate-bounce pointer-events-none z-50">
                                <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 rotate-45 w-2 h-2 bg-konoha-orange"></div>
                                {t('header.tooltip')}
                            </div>
                        )}
                    </button>

                    {/* Language Switcher */}
                    <LanguageSwitcher />

                    <button
                        onClick={onOpenHelp}
                        className="text-gray-400 hover:text-konoha-orange transition-colors p-2 hover:scale-110 active:scale-95 duration-200"
                        title="Help / Guide"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><path d="M12 17h.01" /></svg>
                    </button>

                    <a
                        href="https://github.com/huanglizhuo/Ketsuin"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-white transition-colors p-2 hover:scale-110 active:scale-95 duration-200"
                        title="View Source on GitHub"
                    >
                        <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor">
                            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                        </svg>
                    </a>
                </div>
            </div>

            {/* Mode Tabs */}
            <div className="flex gap-1 mt-2 relative z-50">
                <button
                    onClick={() => onModeChange('t9')}
                    className={`px-4 py-1.5 rounded-t text-xs font-mono uppercase tracking-wider transition-all duration-200
                        ${appMode === 't9'
                            ? 'bg-konoha-orange/20 text-konoha-orange border border-konoha-orange/40 border-b-0 font-bold'
                            : 'text-gray-500 hover:text-gray-300 border border-transparent'
                        }`}
                >
                    {t('header.tab.t9')}
                </button>
                <button
                    onClick={() => onModeChange('challenge')}
                    className={`px-4 py-1.5 rounded-t text-xs font-mono uppercase tracking-wider transition-all duration-200
                        ${appMode === 'challenge'
                            ? 'bg-konoha-orange/20 text-konoha-orange border border-konoha-orange/40 border-b-0 font-bold'
                            : 'text-gray-500 hover:text-gray-300 border border-transparent'
                        }`}
                >
                    {t('header.tab.challenge')}
                </button>
                <button
                    onClick={() => onModeChange('ranking')}
                    className={`px-4 py-1.5 rounded-t text-xs font-mono uppercase tracking-wider transition-all duration-200
                        ${appMode === 'ranking'
                            ? 'bg-konoha-orange/20 text-konoha-orange border border-konoha-orange/40 border-b-0 font-bold'
                            : 'text-gray-500 hover:text-gray-300 border border-transparent'
                        }`}
                >
                    {t('header.tab.ranking')}
                </button>
            </div>

        </header>
    );
};
