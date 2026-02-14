import type { VFXEffect, VFXContext } from './types';

export class ChidoriVFX implements VFXEffect {
    private startTime: number = 0;

    start(timestamp: number): void {
        this.startTime = timestamp;
    }

    update(context: VFXContext): boolean {
        const { ctx, activeHand, bBox, timestamp } = context;

        if (!activeHand) return true; // Keep running, waiting for hand

        const cx = activeHand.x * bBox.width;
        const cy = activeHand.y * bBox.height;

        // Draw Core Ball
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#00ffff';
        ctx.fillStyle = '#e0ffff';
        ctx.beginPath();
        ctx.arc(cx, cy, 20 + Math.sin(timestamp / 50) * 5, 0, Math.PI * 2);
        ctx.fill();

        // Draw Lightning Arcs
        ctx.strokeStyle = '#add8e6';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';

        for (let i = 0; i < 5; i++) {
            const angle = (Math.PI * 2 * i) / 5 + timestamp / 200;
            const length = 50 + Math.random() * 50;

            ctx.beginPath();
            ctx.moveTo(cx, cy);

            // Jagged line
            let currX = cx;
            let currY = cy;
            const segments = 5;
            for (let j = 0; j < segments; j++) {
                currX += Math.cos(angle) * (length / segments) + (Math.random() - 0.5) * 20;
                currY += Math.sin(angle) * (length / segments) + (Math.random() - 0.5) * 20;
                ctx.lineTo(currX, currY);
            }
            ctx.stroke();
        }

        ctx.shadowBlur = 0;
        return true;
    }

    stop(): void { }
}
