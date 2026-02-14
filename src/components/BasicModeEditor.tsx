

import React from 'react';
import { T9Keyboard } from './T9Keyboard';
import classNames from 'classnames';
import { HAND_SIGNS } from '../config/data';

interface T9InputState {
    committedText: string;
    currentSequence: string; // "435..."
    candidates: string[];
    candidateIndex: number;
    onTextChange?: (text: string) => void;
    fullSignSequence?: number[]; // New prop from engine
}

export const T9EditorDisplay: React.FC<T9InputState> = ({
    committedText,
    currentSequence,
    candidates,
    candidateIndex,
    onTextChange,
    fullSignSequence = []
}) => {
    return (
        <div className="bg-[#1e1e1e] border border-gray-700 rounded-lg overflow-hidden shadow-lg flex flex-col h-full min-h-[200px]">
            {/* Committed Text (Editable) */}
            <textarea
                className="flex-[2] p-4 font-mono text-gray-300 text-lg bg-transparent resize-none focus:outline-none focus:ring-1 focus:ring-konoha-orange/50 border-b border-gray-800"
                value={committedText}
                onChange={(e) => onTextChange?.(e.target.value)}
                placeholder="Type here or use hand signs..."
            />

            {/* Gesture Input List (Reverse Mapped) */}
            <div className="flex-1 bg-black/30 p-2 overflow-x-auto flex items-center gap-2 border-b border-[#333] min-h-[60px]">
                <span className="text-xs text-gray-600 font-mono shrink-0 uppercase tracking-widest mr-2">Seals:</span>
                {fullSignSequence.map((signId, i) => {
                    const sign = HAND_SIGNS.find(s => s.id === signId);
                    return (
                        <div key={i} className="flex flex-col items-center justify-center min-w-[30px]">
                            <span className="text-konoha-orange text-xl font-bold font-ninja drop-shadow-[0_0_2px_rgba(242,169,0,0.5)]">
                                {sign?.kanji || '?'}
                            </span>
                            <span className="text-[8px] text-gray-500 font-mono">
                                {signId === 11 ? 'SPC' : signId}
                            </span>
                        </div>
                    )
                })}
            </div>

            {/* Candidate Bar (Bottom of Editor) */}
            <div className="bg-[#2d2d2d] border-t border-[#333] p-2 flex items-center gap-3 overflow-x-auto shrink-0">
                <span className="text-xs text-gray-500 font-mono">INPUT:</span>
                <span className="text-konoha-orange font-bold font-mono tracking-widest min-w-[20px]">{currentSequence}</span>

                {/* Candidates */}
                <div className="flex-1 flex gap-2 overflow-hidden mask-linear-fade">
                    {candidates.length === 0 ? (
                        <span className="text-gray-600 italic text-sm">...</span>
                    ) : (
                        candidates.map((cand, idx) => (
                            <span
                                key={idx}
                                className={classNames(
                                    "px-2 py-0.5 rounded text-sm transition-all whitespace-nowrap",
                                    {
                                        "bg-konoha-orange text-black font-bold": idx === candidateIndex,
                                        "text-gray-400": idx !== candidateIndex
                                    }
                                )}
                            >
                                {cand}
                            </span>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

// Legacy/Wrapper if needed, but App.tsx will likely use T9EditorDisplay directly.
// Keeping this for backward compat if I missed an import update, but I'll update App.tsx next.
export const T9InputHUD: React.FC<T9InputState & { activeSignId?: number | null }> = (props) => {
    return (
        <div className="flex flex-col gap-4">
            <T9EditorDisplay {...props} />
            <T9Keyboard activeSignId={props.activeSignId} />
        </div>
    );
}

