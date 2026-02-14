import { useEffect, useState } from 'react';
import classNames from 'classnames';
import type { Jutsu } from '../config/data';
import { SUPPORTED_JUTSUS, HAND_SIGNS } from '../config/data';

interface JutsuHUDProps {
    inputBuffer: number[];
    lastInputTime: number;
    highlightJutsu?: Jutsu | null;
}

export const JutsuHUD: React.FC<JutsuHUDProps> = ({ inputBuffer, lastInputTime, highlightJutsu }) => {
    const [timeLeft, setTimeLeft] = useState(0);

    // Timer logic for 5s window
    useEffect(() => {
        if (inputBuffer.length === 0) {
            setTimeLeft(0);
            return;
        }

        // Simple interval update for visual bar
        const interval = setInterval(() => {
            const elapsed = Date.now() - lastInputTime;
            const remaining = Math.max(0, 5000 - elapsed);
            setTimeLeft(remaining);
        }, 100);
        return () => clearInterval(interval);
    }, [inputBuffer, lastInputTime]);

    const renderJutsuCard = (jutsu: Jutsu) => {
        // Logic to check how much of the sequence matches the END of the inputBuffer
        // This is for visual feedback: "You have done Snake... Ram..."
        // But wait, user might have done random stuff before. 
        // We essentially want to highlight the SIGNS in the jutsu card that match the CURRENT progress.

        // Let's simplified heuristic: if the inputBuffer ENDS with a prefix of this jutsu, we highlight.
        // E.g. Jutsu: A, B, C. Buffer: ... X, A, B. We highlight A, B.

        let matchCount = 0;
        for (let len = Math.min(inputBuffer.length, jutsu.sequence.length); len > 0; len--) {
            const suffix = inputBuffer.slice(-len);
            const prefix = jutsu.sequence.slice(0, len);
            if (suffix.every((val, idx) => val === prefix[idx])) {
                matchCount = len;
                break;
            }
        }

        // Special Case: If this card is explicitly 'highlightJutsu' (matched just now), show full?
        // Or maybe highlightJutsu is handled by parent UI animations.

        return (
            <div
                key={jutsu.id}
                className={classNames(
                    "relative bg-gray-900/80 border rounded p-3 transition-all duration-300 backdrop-blur-sm",
                    {
                        'border-konoha-orange shadow-[0_0_15px_rgba(242,169,0,0.3)] bg-gray-800/90': matchCount > 0,
                        'border-gray-700 opacity-70': matchCount === 0
                    }
                )}
            >
                <h4 className="text-konoha-orange font-bold text-sm mb-1">{jutsu.name}</h4>
                <p className="text-gray-500 text-[10px] mb-2">{jutsu.nameEn}</p>

                <div className="flex gap-1 flex-wrap">
                    {jutsu.sequence.map((signId, idx) => {
                        const sign = HAND_SIGNS.find(s => s.id === signId);
                        const isMatched = idx < matchCount;
                        return (
                            <div
                                key={idx}
                                className={classNames(
                                    "w-6 h-6 flex items-center justify-center rounded border text-[10px] font-mono transition-all",
                                    {
                                        'bg-konoha-orange text-black border-konoha-orange scale-110': isMatched,
                                        'bg-gray-800 text-gray-500 border-gray-600': !isMatched
                                    }
                                )}
                            >
                                {sign?.kanji}
                            </div>
                        );
                    })}
                </div>

                {/* Trigger Hint */}
                {matchCount === jutsu.sequence.length && (
                    <div className="absolute top-2 right-2 text-xs text-red-500 font-bold animate-pulse">
                        {jutsu.trigger === 'mouth_blow' ? '💨 BLOW!' : jutsu.trigger === 'hand_hold' ? '✋ HOLD!' : '✨ KA!'}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="absolute left-4 top-20 bottom-20 w-64 flex flex-col gap-2 pointer-events-none">
            {/* Timer Bar */}
            {inputBuffer.length > 0 && (
                <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden border border-gray-600 mb-2">
                    <div
                        className={classNames("h-full transition-all duration-100 linear", {
                            'bg-konoha-orange': timeLeft > 2000,
                            'bg-red-500': timeLeft <= 2000
                        })}
                        style={{ width: `${(timeLeft / 5000) * 100}%` }}
                    />
                </div>
            )}

            {/* Jutsu List */}
            <div className="flex flex-col gap-3 overflow-y-auto pr-1">
                {SUPPORTED_JUTSUS.map(renderJutsuCard)}
            </div>
        </div>
    );
};
