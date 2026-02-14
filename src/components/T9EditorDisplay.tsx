

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
    const textareaRef = React.useRef<HTMLTextAreaElement>(null);
    const mirrorRef = React.useRef<HTMLDivElement>(null);
    const [selectionEnd, setSelectionEnd] = React.useState(0);

    // Sync Scroll
    const handleScroll = () => {
        if (textareaRef.current && mirrorRef.current) {
            mirrorRef.current.scrollTop = textareaRef.current.scrollTop;
        }
    };

    // Update cursor position on select/click/keyup
    const updateCursor = () => {
        if (textareaRef.current) {
            setSelectionEnd(textareaRef.current.selectionEnd);
        }
    };

    // Auto-scroll to bottom if text changes (optional, but good for T9)
    React.useEffect(() => {
        if (textareaRef.current) {
            setSelectionEnd(textareaRef.current.textLength); // Keep cursor at end for T9 usually
            // If we want to strictly follow user interactions, we might not want this.
            // But for manual typing, updateCursor handles it.
        }
    }, [committedText]); // dependency on text

    // Cursor Element
    const Cursor = () => (
        <span className="inline-block w-[2px] h-[1.2em] bg-konoha-orange align-text-bottom animate-pulse -mb-[2px]"></span>
    );

    return (
        <div className="bg-black/30 backdrop-blur-sm border border-white/10 rounded-lg overflow-hidden shadow-lg flex flex-col h-full min-h-[200px]">
            {/* Editor Container */}
            <div className="relative flex-[2] w-full h-full overflow-hidden">

                {/* Mirror Display (Background) */}
                <div
                    ref={mirrorRef}
                    className="absolute inset-0 p-4 font-mono text-lg bg-transparent break-words whitespace-pre-wrap overflow-y-auto pointer-events-none"
                    style={{ fontFamily: 'var(--font-mono)' }} // Ensure exact match
                >
                    {/* Render text with cursor */}
                    <span className="text-gray-200">{committedText.slice(0, selectionEnd)}</span>
                    <Cursor />
                    <span className="text-gray-200">{committedText.slice(selectionEnd)}</span>
                    {/* Extra newline to ensure cursor shows at end of line */}
                    {committedText.endsWith('\n') && <br />}
                </div>

                {/* Actual Input (Foreground, Invisible Text) */}
                <textarea
                    ref={textareaRef}
                    className="absolute inset-0 w-full h-full p-4 font-mono text-lg bg-transparent resize-none border-none outline-none text-transparent caret-transparent overflow-y-auto"
                    value={committedText}
                    onChange={(e) => {
                        onTextChange?.(e.target.value);
                        updateCursor();
                    }}
                    onSelect={updateCursor}
                    onClick={updateCursor}
                    onKeyUp={updateCursor}
                    onScroll={handleScroll}
                    placeholder=""
                    spellCheck={false}
                    style={{ fontFamily: 'var(--font-mono)' }}
                />

                {/* Placeholder (Only if empty) */}
                {committedText.length === 0 && (
                    <div className="absolute inset-0 p-4 font-mono text-lg text-gray-500 pointer-events-none">
                        Type here or use hand signs...
                    </div>
                )}
            </div>

            {/* Gesture Input List (Reverse Mapped) */}
            <div className="flex-1 bg-black/20 p-2 overflow-x-auto flex items-center gap-2 border-b border-t border-white/10 min-h-[60px] shrink-0">
                <span className="text-xs text-gray-500 font-mono shrink-0 uppercase tracking-widest mr-2">Seals:</span>
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
            <div className="bg-black/40 border-t border-white/10 p-2 flex items-center gap-3 overflow-x-auto shrink-0">
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

