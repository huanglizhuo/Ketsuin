import { memo, useEffect, useState } from 'react';
import { HAND_SIGNS } from '../config/data';

interface SignOverlayProps {
    currentSign: number | null; // 1-based Sign ID
}

export const SignOverlay = memo(function SignOverlay({ currentSign }: SignOverlayProps) {
    const [animate, setAnimate] = useState(false);
    const [displaySign, setDisplaySign] = useState<number | null>(null);

    useEffect(() => {
        if (currentSign !== null) {
            setDisplaySign(currentSign);
            setAnimate(false);
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    setAnimate(true);
                });
            });
        }
    }, [currentSign]);

    if (!displaySign) return null;

    const signData = HAND_SIGNS.find(s => s.id === displaySign);
    if (!signData) return null;

    return (
        <div aria-hidden="true" className="absolute inset-0 z-40 pointer-events-none flex items-center justify-center overflow-hidden">
            <div className={`absolute inset-0 bg-black/30 transition-opacity duration-300 ${animate ? 'opacity-100' : 'opacity-0'}`}></div>

            <div
                key={displaySign}
                className={`text-[15rem] md:text-[25rem] font-calligraphy text-konoha-orange leading-none select-none filter drop-shadow-chakra-xl transform origin-center ${animate ? 'animate-sekiro-flash' : 'opacity-0 scale-50'}`}
            >
                {signData.kanji}
            </div>
        </div>
    );
});
