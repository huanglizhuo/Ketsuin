import React from 'react';

interface HeaderProps {
    loading: boolean;
    isRunning: boolean;
    start: () => void;
    stop: () => void;
}

export const Header: React.FC<HeaderProps> = ({ loading, isRunning, start, stop }) => {
    return (
        <header className="px-6 py-4 bg-transparent flex justify-between items-center z-10 relative">
            <div className="flex items-center gap-3">
                <h1 className="text-2xl md:text-3xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-konoha-orange to-red-600 font-ninja">
                    结印 T9 keyboard
                </h1>
            </div>

            <div className="flex items-center gap-4">
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
