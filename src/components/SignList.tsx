import React from 'react';
import { HAND_SIGNS } from '../config/data';

interface SignListProps {
    signs: typeof HAND_SIGNS;
    title?: string;
    className?: string;
    mobile?: boolean;
}

export const SignList: React.FC<SignListProps> = ({ signs, title, className, mobile = false }) => {
    if (mobile) {
        return (
            <div className={`p-4 grid grid-cols-4 gap-2 border-t border-gray-800 bg-gray-900/50 ${className}`}>
                {signs.map(sign => (
                    <div key={sign.id} className="flex flex-col items-center">
                        <span className="text-konoha-orange text-xs">{sign.kanji}</span>
                        <span className="text-[10px] text-gray-500 truncate w-full text-center">{sign.name}</span>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className={`hidden md:flex flex-col gap-4 p-4 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 ${className}`}>
            {title && (
                <h3 className="text-center text-gray-500 font-mono text-xs uppercase tracking-widest mb-2 border-b border-gray-800 pb-2">
                    {title}
                </h3>
            )}
            {signs.map(sign => (
                <div
                    key={sign.id}
                    className="flex flex-col items-center bg-gray-900 border border-gray-700 hover:border-konoha-orange rounded-lg p-2 transition-all duration-300 hover:scale-105 hover:shadow-[0_0_10px_rgba(242,169,0,0.5)] group"
                >
                    <div className="w-16 h-16 md:w-24 md:h-24 flex items-center justify-center overflow-hidden mb-2">
                        <img
                            src={`asset/${sign.kanji}.png`}
                            alt={sign.name}
                            className="w-full h-full object-contain filter group-hover:brightness-125 transition-all"
                            onError={(e) => e.currentTarget.style.display = 'none'}
                        />
                    </div>
                    <span className="text-gray-400 group-hover:text-konoha-orange font-mono text-xl md:text-2xl">{sign.name}</span>
                    <span className="text-3xl text-konoha-orange font-bold drop-shadow-[0_0_5px_rgba(242,169,0,0.8)]">{sign.kanji}</span>
                </div>
            ))}
        </div>
    );
};
