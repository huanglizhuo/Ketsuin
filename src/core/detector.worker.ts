/// <reference lib="webworker" />
import { YoloxDetector } from './yolox';

// Runs YOLOX inference off the main thread so per-frame preprocessing +
// wasm inference never blocks UI rendering. Frames arrive as transferable
// ImageBitmaps; results go back as plain Detection arrays.

const detector = new YoloxDetector();

self.onmessage = async (e: MessageEvent) => {
    const msg = e.data;

    if (msg.type === 'init') {
        try {
            await detector.load(msg.modelPath);
            self.postMessage({ type: 'init-done' });
        } catch (err) {
            self.postMessage({ type: 'init-error', error: String(err) });
        }
        return;
    }

    if (msg.type === 'detect') {
        const bitmap = msg.bitmap as ImageBitmap;
        try {
            const detections = await detector.detect(bitmap);
            self.postMessage({ type: 'result', detections });
        } catch (err) {
            console.error('[detector.worker] detect failed', err);
            self.postMessage({ type: 'result', detections: [] });
        } finally {
            bitmap.close();
        }
    }
};
