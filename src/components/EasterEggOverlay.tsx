import React, { useEffect, useState } from 'react';

interface EasterEggOverlayProps {
    show: boolean;
}

export const EasterEggOverlay: React.FC<EasterEggOverlayProps> = ({ show }) => {
    const [animate, setAnimate] = useState(false);

    useEffect(() => {
        if (show) {
            setAnimate(false);
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    setAnimate(true);
                });
            });
        } else {
            setAnimate(false);
        }
    }, [show]);

    if (!show) return null;

    return (
        <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center overflow-hidden">
            {/* Vignette */}
            <div
                className={`absolute inset-0 transition-opacity duration-500
                    ${animate ? 'opacity-100' : 'opacity-0'}`}
                style={{
                    background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.85) 100%)',
                }}
            />

            {/* Calendar Container */}
            <div className="relative w-64 h-80 bg-white rounded-lg shadow-2xl overflow-hidden transform scale-150 md:scale-100"
                style={{
                    boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                    opacity: animate ? 1 : 0,
                    transition: 'opacity 0.5s ease-out',
                }}>

                {/* 🐴 Horse Page (Bottom Layer - Revealed) */}
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#fdfbf7] text-[#d93025]">
                    <div className="text-xl font-bold mb-2 tracking-widest text-black/60">2026</div>
                    <div className="text-8xl font-bold mb-4" style={{ fontFamily: "'AaJianMingShouShu-2', serif" }}>午马</div>
                    <div className="text-2xl text-black/80 font-serif">丙午年</div>
                    <div className="absolute bottom-4 text-xs text-gray-400 tracking-widest">YEAR OF THE HORSE</div>
                </div>

                {/* 🐍 Snake Page (Top Layer - Tears Off) */}
                {animate && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#fdfbf7] text-[#2d5a27] origin-top-left"
                        style={{
                            animation: 'calendar-tear 1.8s ease-in-out forwards 0.5s',
                            boxShadow: '0 5px 15px rgba(0,0,0,0.2)',
                            zIndex: 10,
                        }}>
                        <div className="text-xl font-bold mb-2 tracking-widest text-black/60">2025</div>
                        <div className="text-8xl font-bold mb-4" style={{ fontFamily: "'AaJianMingShouShu-2', serif" }}>巳蛇</div>
                        <div className="text-2xl text-black/80 font-serif">乙巳年</div>
                        <div className="absolute bottom-4 text-xs text-gray-400 tracking-widest">YEAR OF THE SNAKE</div>
                        {/* Perforation line */}
                        <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-black/10 to-transparent"></div>
                    </div>
                )}
            </div>

            {/* Main Text - Appears after tear */}
            <div className="absolute bottom-[15%] md:bottom-[20%] flex flex-col items-center gap-3" style={{ zIndex: 20 }}>
                {/* 新年快乐 */}
                <div
                    style={{
                        fontFamily: "'AaJianMingShouShu-2', cursive, serif",
                        fontSize: 'clamp(2.5rem, 9vw, 5.5rem)',
                        color: '#F2A900',
                        textShadow: '0 0 40px rgba(255,120,0,0.8), 0 0 80px rgba(255,60,0,0.4), 0 2px 4px rgba(0,0,0,0.5)',
                        animation: animate ? 'fade-in-up 2s ease-out 1.5s forwards' : 'none',
                        opacity: 0,
                        whiteSpace: 'nowrap',
                        letterSpacing: '0.08em',
                    }}
                >
                    新年快乐
                </div>

                {/* 码上来福 */}
                <div
                    style={{
                        fontFamily: "'AaJianMingShouShu-2', cursive, serif",
                        fontSize: 'clamp(1.2rem, 4vw, 2.2rem)',
                        color: '#FFD700',
                        textShadow: '0 0 20px rgba(255,215,0,0.6), 0 0 40px rgba(255,160,0,0.3)',
                        animation: animate ? 'fade-in-up 2s ease-out 1.8s forwards' : 'none',
                        opacity: 0,
                        whiteSpace: 'nowrap',
                        letterSpacing: '0.25em',
                    }}
                >
                    码上来福
                </div>
            </div>

            <style>{`
                @keyframes calendar-tear {
                    0% { transform: rotate(0deg); opacity: 1; }
                    20% { transform: rotate(-5deg); } /* Wind up */
                    100% { transform: rotate(120deg) translate(-100px, 600px); opacity: 0; }
                }
                @keyframes fade-in-up {
                    0% { opacity: 0; transform: translateY(20px); }
                    100% { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};
