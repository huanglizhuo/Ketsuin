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

            {/* Fire Particles — rising embers */}
            {animate && (
                <div className="absolute inset-0">
                    {Array.from({ length: 24 }).map((_, i) => (
                        <div
                            key={i}
                            className="absolute rounded-full"
                            style={{
                                width: `${3 + Math.random() * 6}px`,
                                height: `${3 + Math.random() * 6}px`,
                                left: `${5 + Math.random() * 90}%`,
                                bottom: `-5%`,
                                background: `radial-gradient(circle, rgba(255,${150 + Math.random() * 80},0,0.9), rgba(255,60,0,0))`,
                                animation: `fire-particle ${2.5 + Math.random() * 2}s ease-out ${Math.random() * 1.5}s forwards`,
                            }}
                        />
                    ))}
                </div>
            )}

            {/* 🐴 Fire Horse — galloping across screen */}
            {animate && (
                <div
                    className="absolute"
                    style={{
                        bottom: '12%',
                        animation: 'horse-gallop 3s ease-in-out 0.2s forwards',
                        opacity: 0,
                    }}
                >
                    {/* Horse body */}
                    <div style={{ position: 'relative', fontSize: '5rem', lineHeight: 1 }}>
                        <span style={{
                            filter: 'drop-shadow(0 0 20px rgba(255,100,0,0.9)) drop-shadow(0 0 40px rgba(255,60,0,0.6))',
                        }}>
                            🐎
                        </span>
                        {/* Flame trail particles behind the horse */}
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div
                                key={`trail-${i}`}
                                className="absolute"
                                style={{
                                    right: `${20 + i * 18}px`,
                                    top: `${10 + Math.random() * 30}px`,
                                    width: `${12 - i}px`,
                                    height: `${12 - i}px`,
                                    borderRadius: '50%',
                                    background: `radial-gradient(circle, rgba(255,${180 - i * 15},0,${0.8 - i * 0.08}), transparent)`,
                                    animation: `flame-flicker ${0.3 + Math.random() * 0.4}s ease-in-out infinite alternate`,
                                    animationDelay: `${i * 0.05}s`,
                                }}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Main Text */}
            <div className="flex flex-col items-center gap-3" style={{ zIndex: 1 }}>
                {/* 新年快乐 */}
                <div
                    style={{
                        fontFamily: "'Reggae One', cursive, serif",
                        fontSize: 'clamp(2.5rem, 9vw, 5.5rem)',
                        color: '#F2A900',
                        textShadow: '0 0 40px rgba(255,120,0,0.8), 0 0 80px rgba(255,60,0,0.4), 0 2px 4px rgba(0,0,0,0.5)',
                        animation: animate ? 'egg-flash 4s ease-out forwards' : 'none',
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
                        fontFamily: "'Reggae One', cursive, serif",
                        fontSize: 'clamp(1.2rem, 4vw, 2.2rem)',
                        color: '#FFD700',
                        textShadow: '0 0 20px rgba(255,215,0,0.6), 0 0 40px rgba(255,160,0,0.3)',
                        animation: animate ? 'egg-sub-text 4s ease-out 0.25s forwards' : 'none',
                        opacity: 0,
                        whiteSpace: 'nowrap',
                        letterSpacing: '0.25em',
                    }}
                >
                    码上来福
                </div>

                {/* 丙午年 2026 */}
                <div
                    style={{
                        fontFamily: "'Courier New', monospace",
                        fontSize: 'clamp(0.8rem, 2vw, 1.1rem)',
                        color: 'rgba(255,255,255,0.5)',
                        letterSpacing: '0.3em',
                        animation: animate ? 'egg-year 4s ease-out 0.5s forwards' : 'none',
                        opacity: 0,
                    }}
                >
                    🐴 丙午年 2026 🔥
                </div>
            </div>

            <style>{`
                @keyframes egg-flash {
                    0% { opacity: 0; transform: scale(0.3); }
                    10% { opacity: 1; transform: scale(1.08); filter: drop-shadow(0 0 60px rgba(255,120,0,1)); }
                    15% { transform: scale(1.0); }
                    65% { opacity: 1; transform: scale(1.0); }
                    100% { opacity: 0; transform: scale(1.15); }
                }
                @keyframes egg-sub-text {
                    0% { opacity: 0; transform: translateY(8px) scale(0.9); }
                    15% { opacity: 1; transform: translateY(0) scale(1.0); }
                    65% { opacity: 1; }
                    100% { opacity: 0; transform: translateY(-5px); }
                }
                @keyframes egg-year {
                    0% { opacity: 0; transform: translateY(10px); }
                    18% { opacity: 0.5; transform: translateY(0); }
                    65% { opacity: 0.5; }
                    100% { opacity: 0; }
                }
                @keyframes horse-gallop {
                    0% {
                        opacity: 0;
                        transform: translateX(-50vw) translateY(20px) scaleX(-1);
                    }
                    8% {
                        opacity: 1;
                        transform: translateX(-30vw) translateY(0) scaleX(-1);
                    }
                    25% {
                        transform: translateX(-5vw) translateY(-15px) scaleX(-1);
                    }
                    50% {
                        transform: translateX(15vw) translateY(0) scaleX(-1);
                        opacity: 1;
                    }
                    75% {
                        transform: translateX(35vw) translateY(-10px) scaleX(-1);
                        opacity: 0.8;
                    }
                    100% {
                        opacity: 0;
                        transform: translateX(55vw) translateY(5px) scaleX(-1);
                    }
                }
                @keyframes fire-particle {
                    0% { opacity: 0; transform: translateY(0) scale(1); }
                    10% { opacity: 1; }
                    100% { opacity: 0; transform: translateY(-70vh) scale(0.2); }
                }
                @keyframes flame-flicker {
                    0% { opacity: 0.4; transform: scale(0.8); }
                    100% { opacity: 1; transform: scale(1.3); }
                }
            `}</style>
        </div>
    );
};
