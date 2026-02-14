import type { VFXEffect, VFXContext, Particle } from './types';

export class SummoningVFX implements VFXEffect {
    private particles: Particle[] = [];
    private startTime: number = 0;
    private hasPoofed: boolean = false;

    // TODO: Load image assets dynamically? For now, we simulate smoke.

    start(timestamp: number): void {
        this.startTime = timestamp;
        this.hasPoofed = false;
        this.particles = [];

        // Initial Explosion of Smoke
        this.emitSmoke();
    }

    emitSmoke() {
        for (let i = 0; i < 50; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 10;
            this.particles.push({
                x: 0.5, // Center relative (will scale in update)
                y: 0.5,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1.0,
                maxLife: 1.0 + Math.random(),
                size: 20 + Math.random() * 30,
                color: '#dddddd',
                alpha: 1
            });
        }
        this.hasPoofed = true;
    }

    update(context: VFXContext): boolean {
        const { ctx, bBox, timestamp } = context;
        const elapsed = timestamp - this.startTime;

        const centerX = bBox.width / 2;
        const centerY = bBox.height / 2;

        // Draw Particles (Smoke)
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];

            // Use normalized coords for origin, but velocity is pixels? 
            // Let's treat p.x/y as normalized 0.5 initially, then add velocity/width ratio?
            // Actually simpler: store pixels.

            if (elapsed < 100) { // Fix initial position on first frame?
                // Hack: Reset positions on first update to avoid passing bBox in emitSmoke
                if (p.x === 0.5) {
                    p.x = centerX;
                    p.y = centerY;
                }
            }

            p.x += p.vx;
            p.y += p.vy;
            p.vx *= 0.95; // Friction
            p.vy *= 0.95;
            p.size += 0.5;
            p.life -= 0.01;
            p.alpha = p.life;

            if (p.life <= 0) {
                this.particles.splice(i, 1);
                continue;
            }

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(200, 200, 200, ${p.alpha * 0.5})`;
            ctx.fill();
        }

        // Draw Summoned Text/Symbol if smoke clears a bit
        if (elapsed > 500) {
            ctx.save();
            ctx.globalAlpha = Math.min(1, (elapsed - 500) / 1000);
            ctx.translate(centerX, centerY);
            ctx.font = '100px "AaJianMingShouShu-2"';
            ctx.textAlign = 'center';
            ctx.fillStyle = 'red';
            ctx.fillText('🐸', 0, 0); // Frog
            ctx.restore();
        }

        // Stop after 3 seconds
        if (elapsed > 3000) return false;

        return true;
    }

    stop(): void { }
}
