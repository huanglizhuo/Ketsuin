import { useEffect, useRef } from 'react';
import type { FaceState } from '../hooks/useFaceMesh';
import type { Detection } from '../hooks/useDetector';
import type { VFXEffect } from '../vfx/types';
import type { Jutsu } from '../config/data';

import { FireballVFX } from '../vfx/Fireball';
import { ChidoriVFX } from '../vfx/Chidori';
import { SummoningVFX } from '../vfx/Summoning';

interface VFXCanvasProps {
    activeJutsu: Jutsu | null;
    faceState: FaceState;
    detections: Detection[];
    width: number;
    height: number;
}

export const VFXCanvas: React.FC<VFXCanvasProps> = ({
    activeJutsu,
    faceState,
    detections,
    width,
    height
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const requestRef = useRef<number | undefined>(undefined);
    const currentEffectRef = useRef<VFXEffect | null>(null);
    const lastJutsuId = useRef<string | null>(null);
    const lastHandRef = useRef<{ x: number, y: number } | undefined>(undefined);

    // Effect Factory
    const createEffect = (jutsu: Jutsu): VFXEffect | null => {
        switch (jutsu.id) {
            case 'fireball': return new FireballVFX();
            case 'chidori': return new ChidoriVFX();
            case 'summoning': return new SummoningVFX();
            default: return null;
        }
    };

    const animate = (time: number) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // Find active hand (largest detection or specific logic)
        let activeHand = undefined;
        if (detections.length > 0) {
            const d = detections[0];
            // Center of box. box is [x, y, w, h] normalized
            activeHand = {
                x: d.box[0] + d.box[2] / 2,
                y: d.box[1] + d.box[3] / 2
            };
            lastHandRef.current = activeHand;
        } else {
            // Fallback to last known position
            activeHand = lastHandRef.current;
        }

        // If still no hand (e.g. debug start without any input), default to center-right?
        // Or just let the effect handle undefined (Chidori hides).
        // Let's force a default for debug purposes if we have an active Chidori but no hand ever seen.
        if (!activeHand && activeJutsu?.id === 'chidori') {
            activeHand = { x: 0.7, y: 0.6 }; // Default to right sideish
        }

        if (currentEffectRef.current) {
            const isStillActive = currentEffectRef.current.update({
                ctx,
                bBox: canvas.getBoundingClientRect(),
                timestamp: time,
                faceState,
                activeHand
            });

            if (!isStillActive) {
                currentEffectRef.current = null;
            }
        }

        requestRef.current = requestAnimationFrame(animate);
    };

    // Start Loop
    useEffect(() => {
        requestRef.current = requestAnimationFrame(animate);
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [width, height, faceState, detections]); // Dependencies might trigger restart, but Animation loop uses refs

    // Handle Jutsu Change
    useEffect(() => {
        if (activeJutsu?.id !== lastJutsuId.current) {
            lastJutsuId.current = activeJutsu?.id || null;

            if (currentEffectRef.current) {
                currentEffectRef.current.stop();
                currentEffectRef.current = null;
            }

            if (activeJutsu) {
                const effect = createEffect(activeJutsu);
                if (effect) {
                    // We can't pass timestamp here accurately without the loop, 
                    // but start() usually sets initial state.
                    effect.start(Date.now());
                    currentEffectRef.current = effect;
                }
            }
        }
    }, [activeJutsu]);

    return (
        <canvas
            ref={canvasRef}
            width={width}
            height={height}
            className="absolute inset-0 z-30 pointer-events-none"
        />
    );
};
