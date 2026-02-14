import React from 'react';
import { ModeSwitcher } from './ModeSwitcher';
import type { useJutsuGame } from '../hooks/useJutsuGame';

interface HeaderProps {
    mode: ReturnType<typeof useJutsuGame>['mode'];
    setMode: ReturnType<typeof useJutsuGame>['setMode'];
    loading: boolean;
    isRunning: boolean;
    start: () => void;
    stop: () => void;
}

export const Header: React.FC<HeaderProps> = ({ mode, setMode, loading, isRunning, start, stop }) => {
    return (
        <header className="px-6 py-4 bg-gray-900 border-b-2 border-akatsuki-red flex justify-between items-center shadow-lg z-10 relative">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-konoha-orange animate-pulse-fast hidden sm:block"></div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-konoha-orange to-red-600 font-ninja">
                    结印　Ketsuin
                </h1>
            </div>

            <div className="flex items-center gap-4">
                <ModeSwitcher currentMode={mode} onModeChange={setMode} />

                <button
                    onClick={isRunning ? stop : start}
                    disabled={loading}
                    className={`
                    px-6 py-2 bg-gray-800 border-2 rounded font-bold tracking-widest uppercase transition-all duration-300
                    ${loading ? 'cursor-wait opacity-50 border-gray-600' : ''}
                    ${!loading && isRunning
                            ? 'border-akatsuki-red text-akatsuki-red hover:bg-akatsuki-red hover:text-white shadow-[0_0_15px_#980000]'
                            : 'border-konoha-orange text-konoha-orange hover:bg-konoha-orange hover:text-black shadow-[0_0_15px_#F2A900]'}
                `}
                >
                    {loading ? 'Gathering Chakra...' : isRunning ? 'Release Jutsu' : 'Ketsuin Start'}
                </button>
            </div>
        </header>
    );
};
