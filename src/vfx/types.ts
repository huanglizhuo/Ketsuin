import type { FaceState } from '../hooks/useFaceMesh';

export interface VFXContext {
    ctx: CanvasRenderingContext2D;
    bBox: DOMRect; // Dimensions of the canvas/video container
    timestamp: number;
    faceState: FaceState;
    activeHand?: { x: number; y: number }; // Normalized (0-1) coordinates of the active hand center
}

export interface VFXEffect {
    start(timestamp: number): void;
    update(context: VFXContext): boolean; // Returns false if effect is finished
    stop(): void;
}

export type Particle = {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    maxLife: number;
    size: number;
    color: string;
    alpha: number;
};
