import React from 'react';
import { useI18n } from '../i18n/I18nContext';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useNavigate, useLocation } from 'react-router-dom';

interface HeaderProps {
    onOpenHelp: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenHelp }) => {
    const { t } = useI18n();
    const navigate = useNavigate();
    const location = useLocation();

    const currentPath = location.pathname;

    // Helper to determine active tab
    const getActiveTab = () => {
        if (currentPath === '/challenge') return 'challenge';
        if (currentPath === '/ranking') return 'ranking';
        return 't9';
    };

    const activeTab = getActiveTab();

    return (
        <header className="px-6 py-3 bg-transparent flex flex-col z-10 relative">
            <div className="flex flex-col md:flex-row justify-between items-center relative gap-4 md:gap-0">
                <div className="flex items-center gap-3">
                    <img src={`${import.meta.env.BASE_URL}asset/ketsuin.png`} alt="Ketsuin Logo" className="w-10 h-10 object-contain drop-shadow-md" />
                    <h1 className="text-2xl md:text-3xl text-konoha-orange font-bold tracking-wider text-gray-100 font-ninja drop-shadow-md">
                        结印-KeTsuIn
                    </h1>
                </div>

                <div className="flex items-center gap-4">
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
                    onClick={() => navigate('/')}
                    className={`px-4 py-1.5 rounded-t text-xs font-mono uppercase tracking-wider transition-all duration-200
                        ${activeTab === 't9'
                            ? 'bg-konoha-orange/20 text-konoha-orange border border-konoha-orange/40 border-b-0 font-bold'
                            : 'text-gray-500 hover:text-gray-300 border border-transparent'
                        }`}
                >
                    {t('header.tab.t9')}
                </button>
                <button
                    onClick={() => navigate('/challenge')}
                    className={`px-4 py-1.5 rounded-t text-xs font-mono uppercase tracking-wider transition-all duration-200
                        ${activeTab === 'challenge'
                            ? 'bg-konoha-orange/20 text-konoha-orange border border-konoha-orange/40 border-b-0 font-bold'
                            : 'text-gray-500 hover:text-gray-300 border border-transparent'
                        }`}
                >
                    {t('header.tab.challenge')}
                </button>
                <button
                    onClick={() => navigate('/ranking')}
                    className={`px-4 py-1.5 rounded-t text-xs font-mono uppercase tracking-wider transition-all duration-200
                        ${activeTab === 'ranking'
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
