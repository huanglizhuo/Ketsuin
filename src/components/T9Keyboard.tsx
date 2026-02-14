import React from 'react';
import classNames from 'classnames';
import { HAND_SIGNS } from '../config/data';

interface T9KeyboardProps {
    activeSignId?: number | null; // The currently detected sign (1-12) to highlight
}

// 12-key mapping based on STRICT T9 design
const KEYS = [
    { id: 1, label: '.,?!', signId: 1 },    // Rat
    { id: 2, label: 'ABC', signId: 2 },     // Ox
    { id: 3, label: 'DEF', signId: 3 },     // Tiger
    { id: 4, label: 'GHI', signId: 4 },     // Hare
    { id: 5, label: 'JKL', signId: 5 },     // Dragon
    { id: 6, label: 'MNO', signId: 6 },     // Snake
    { id: 7, label: 'PQRS', signId: 7 },    // Horse
    { id: 8, label: 'TUV', signId: 8 },     // Ram
    { id: 9, label: 'WXYZ', signId: 9 },    // Monkey
    { id: 10, label: 'DEL', signId: 10, isFunc: true }, // Bird (*)
    { id: 11, label: 'SPC', signId: 11, isFunc: true }, // Dog (0)
    { id: 12, label: 'NEXT', signId: 12, isFunc: true }, // Boar (#)
];

export const T9Keyboard: React.FC<T9KeyboardProps & { className?: string }> = ({ activeSignId, className }) => {

    const getKeyLabel = (signId: number) => {
        const sign = HAND_SIGNS.find(s => s.id === signId);
        return sign ? sign.kanji : '?';
    };

    return (
        <div className={classNames("grid grid-cols-3 grid-rows-4 gap-2 w-full h-full min-h-0", className)}>
            {KEYS.map(key => {
                const isActive = activeSignId === key.signId;
                const signKanji = getKeyLabel(key.signId);

                return (
                    <div
                        key={key.id}
                        className={classNames(
                            'relative w-full h-full rounded-md flex flex-col justify-start items-start p-1 md:p-2 transition-all duration-200 border min-h-0 overflow-hidden group',
                            {
                                'bg-konoha-orange border-konoha-orange text-black scale-105 z-10 shadow-[0_0_15px_#F2A900]': isActive,
                                'bg-gray-800 border-gray-600 text-gray-400 hover:bg-gray-750': !isActive
                            }
                        )}
                    >
                        {/* Background Hand Sign Image */}
                        <div className={classNames("absolute inset-0 z-0 flex items-center justify-center pointer-events-none transition-opacity duration-300", {
                            "opacity-40": isActive,
                            "opacity-40 group-hover:opacity-40": !isActive
                        })}>
                            <img
                                src={`asset/${signKanji}.png`}
                                alt=""
                                className="w-full h-full object-cover"
                                onError={(e) => e.currentTarget.style.display = 'none'}
                            />
                        </div>

                        {/* Top Left: Number/Sign ID */}
                        <span className="text-[10px] md:text-lg text-konoha-orange font-mono opacity-100 z-10 mb-0.5">
                            {key.signId === 10 ? '*' : key.signId === 11 ? '0' : key.signId === 12 ? '#' : key.id}
                        </span>
                        {/* Letters/Func (Below Number) */}
                        <span className={classNames(
                            "font-bold text-konoha-orange tracking-widest text-left w-full break-words z-10 leading-none",
                            {
                                "text-lg md:text-2xl": !key.isFunc,
                                "text-sm md:text-lg": key.isFunc
                            }
                        )}>
                            {key.label}
                        </span>
                    </div>
                );
            })}
        </div>
    );
};
