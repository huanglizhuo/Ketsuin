
import React, { useEffect, useState } from 'react';
import { HAND_SIGNS } from '../config/data';

interface SignOverlayProps {
    currentSign: number | null; // 1-based Sign ID
}

export const SignOverlay: React.FC<SignOverlayProps> = ({ currentSign }) => {
    const [animate, setAnimate] = useState(false);
    const [displaySign, setDisplaySign] = useState<number | null>(null);

    useEffect(() => {
        if (currentSign !== null) {
            setDisplaySign(currentSign);
            // Reset animation
            setAnimate(false);

            // Trigger animation in next frame
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    setAnimate(true);
                });
            });

            // Optional: You could play a sound here
        }
    }, [currentSign]);

    if (!displaySign) return null;

    const signData = HAND_SIGNS.find(s => s.id === displaySign);
    if (!signData) return null;

    return (
        <div className="absolute inset-0 z-40 pointer-events-none flex items-center justify-center overflow-hidden">
            {/* Vignette Background during animation */}
            <div
                className={`absolute inset-0 bg-black/30 transition-opacity duration-300 ${animate ? 'opacity-100' : 'opacity-0'}`}
            ></div>

            {/* Kanji Character */}
            <div
                key={displaySign} // Key change ensures re-render even if same sign
                className={`
                    text-[15rem] md:text-[25rem] font-calligraphy text-konoha-orange leading-none select-none
                    filter drop-shadow-[0_0_30px_rgba(242,169,0,0.8)]
                    transform origin-center
                    transition-all duration-700 ease-out
                    ${animate
                        ? 'opacity-0 scale-[1.5] translate-z-0' // End state (fading out, large)
                        : 'opacity-100 scale-50' // Start state (visible, small)
                    }
                `}
                style={{
                    // Custom animation logic to mimic "Danger" flash:
                    // 1. Instant appear at scale 0.5 (handled by !animate state?)
                    // Actually, let's use CSS keyframes for better control if possible, 
                    // or simple transition:
                    // Start: Opacity 0, Scale 0.5
                    // Active: Opacity 1 -> 0, Scale 0.5 -> 1.5
                    animation: animate ? 'sekiro-flash 1s ease-out forwards' : 'none'
                }}
            >
                {signData.kanji}
            </div>

            <style>{`
                @keyframes sekiro-flash {
                    0% {
                        opacity: 0;
                        transform: scale(0.5);
                    }
                    15% {
                        opacity: 1;
                        transform: scale(1.0);
                        filter: drop-shadow(0 0 50px rgba(242,169,0,1));
                    }
                    20% {
                        transform: scale(1.05);
                    }
                    25% {
                        transform: scale(1.0);
                    }
                    100% {
                        opacity: 0;
                        transform: scale(1.4);
                        filter: drop-shadow(0 0 10px rgba(242,169,0,0));
                    }
                }
            `}</style>
        </div>
    );
};
