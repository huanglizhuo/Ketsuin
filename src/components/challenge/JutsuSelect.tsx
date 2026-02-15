import React from 'react';
import { HAND_SIGNS, SUPPORTED_JUTSUS } from '../../config/data';
import type { Jutsu } from '../../config/data';

interface JutsuSelectProps {
    onSelect: (jutsu: Jutsu) => void;
}

const difficultyStars = (d: number) => '⭐'.repeat(d);

export const JutsuSelect: React.FC<JutsuSelectProps> = ({ onSelect }) => {
    return (
        <div className="flex flex-col gap-4 w-full max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-3xl text-konoha-orange font-ninja text-center drop-shadow-[0_0_10px_rgba(242,169,0,0.5)]">
                忍術を選べ — 選擇忍術
            </h2>
            <p className="text-gray-400 text-center text-sm font-mono">
                Select a jutsu to challenge your seal speed
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-2">
                {SUPPORTED_JUTSUS.map((jutsu) => (
                    <button
                        key={jutsu.id}
                        onClick={() => onSelect(jutsu)}
                        className="group relative bg-black/40 backdrop-blur-sm border border-white/10 rounded-lg p-4 text-left
                       hover:border-konoha-orange/60 hover:bg-black/60 hover:shadow-[0_0_20px_rgba(242,169,0,0.15)]
                       transition-all duration-300 cursor-pointer active:scale-[0.98]"
                    >
                        {/* Difficulty badge */}
                        <div className="absolute top-3 right-3 text-xs">
                            {difficultyStars(jutsu.difficulty)}
                        </div>

                        {/* Jutsu name */}
                        <h3 className="text-lg text-konoha-orange font-ninja mb-1 pr-12">
                            {jutsu.name}
                        </h3>
                        <p className="text-xs text-gray-400 font-mono mb-2">
                            {jutsu.nameEn}
                        </p>

                        {/* Character */}
                        {jutsu.character && (
                            <p className="text-xs text-gray-500 mb-2 italic">
                                — {jutsu.character}
                            </p>
                        )}

                        {/* Description */}
                        <p className="text-sm text-gray-300 mb-3">
                            {jutsu.description}
                        </p>

                        {/* Seal sequence preview */}
                        <div className="flex flex-wrap gap-1 mb-2">
                            {jutsu.sequence.map((signId, i) => {
                                const sign = HAND_SIGNS.find(s => s.id === signId);
                                return (
                                    <span
                                        key={i}
                                        className="text-konoha-orange/70 text-sm font-ninja group-hover:text-konoha-orange transition-colors"
                                    >
                                        {sign?.kanji || '?'}
                                        {i < jutsu.sequence.length - 1 && (
                                            <span className="text-gray-600 mx-0.5">→</span>
                                        )}
                                    </span>
                                );
                            })}
                        </div>

                        {/* Seal count */}
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
                            <span className="text-xs text-gray-500 font-mono">
                                {jutsu.sequence.length} SEALS
                            </span>
                            <span className="text-xs text-konoha-orange/50 font-mono uppercase tracking-wider group-hover:text-konoha-orange transition-colors">
                                Challenge →
                            </span>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
};
