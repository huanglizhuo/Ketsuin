import type { VFXEffect, VFXContext, Particle } from './types';

export class FireballVFX implements VFXEffect {
    private particles: Particle[] = [];
    private isEmitting: boolean = false;
    private startTime: number = 0;

    start(timestamp: number): void {
        this.startTime = timestamp;
        this.particles = [];
        this.isEmitting = true;
    }

    update(context: VFXContext): boolean {
        const { ctx, faceState, bBox } = context;

        // Check blowing state (or if we just want to emit for a duration)
        // Requirement: "Stream from mouth".
        // If not blowing or no face, maybe stop emitting but keep existing particles?
        // Let's assume as long as this effect is active (app tells us), we try to emit if prerequisites met.

        if (this.isEmitting && faceState.faceDetected && faceState.isBlowing) {
            // Emit new particles
            const mouthX = faceState.mouthPosition.x * bBox.width;
            const mouthY = faceState.mouthPosition.y * bBox.height;

            for (let i = 0; i < 5; i++) {
                const angle = Math.random() * Math.PI / 4 - Math.PI / 8; // Spread +/- 22.5 deg
                // Direction: Away from face? or just Down/Forward? 
                // 2D video: usually "Forward" means towards camera (scale up) or Down relative to screen?
                // "Fireball Jutsu" usually goes forward. In 2D overlay, we expand them?
                // Let's make them flow OUTWARDS from mouth. 
                // Simple: Flow down-right relative to camera? No, flows towards center?
                // Let's sim flow towards z-index (scale up) + randomness.
                // For 2D canvas, let's just make it look like a cone spewing out.
                // Let's aim DOWN-CENTER.

                const speed = Math.random() * 5 + 2;
                this.particles.push({
                    x: mouthX,
                    y: mouthY,
                    vx: (Math.random() - 0.5) * 5,
                    vy: speed, // Falling/Specwing down
                    life: 1.0,
                    maxLife: 1.0,
                    size: Math.random() * 20 + 10,
                    color: `rgba(255, ${Math.floor(Math.random() * 100)}, 0, 1)`,
                    alpha: 1
                });
            }
        }

        // Update and Draw Particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life -= 0.02;
            p.size += 1; // Grow as they move "closer"
            p.alpha = p.life;

            if (p.life <= 0) {
                this.particles.splice(i, 1);
                continue;
            }

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
            gradient.addColorStop(0, `rgba(255, 255, 0, ${p.alpha})`);
            gradient.addColorStop(0.5, `rgba(255, 100, 0, ${p.alpha * 0.8})`);
            gradient.addColorStop(1, `rgba(255, 0, 0, 0)`);
            ctx.fillStyle = gradient;
            ctx.fill();
        }

        // Condition to end?
        // If user stops blowing, particles fade out.
        // Effect stays alive until App clears 'activeJutsu'.
        return true;
    }

    stop(): void {
        this.isEmitting = false;
    }
}
