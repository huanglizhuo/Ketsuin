import * as ort from 'onnxruntime-web';
import { CONFIG } from '../config/data';

export interface Detection {
    classId: number;
    score: number;
    box: [number, number, number, number]; // x1, y1, x2, y2
}

export class YoloxDetector {
    private session: ort.InferenceSession | null = null;
    private inputShape = CONFIG.INPUT_SHAPE;

    // Performance Optimization: Cache these
    private preprocessCanvas: HTMLCanvasElement;
    private preprocessCtx: CanvasRenderingContext2D;
    private grids: number[][] | null = null;
    private expandedStrides: number[] | null = null;

    constructor() {
        this.preprocessCanvas = document.createElement('canvas');
        this.preprocessCanvas.width = this.inputShape;
        this.preprocessCanvas.height = this.inputShape;
        this.preprocessCtx = this.preprocessCanvas.getContext('2d', { willReadFrequently: true })!;
    }

    async load(modelPath: string) {
        try {
            // Configure WASM paths to serve from /onnx/ directory
            // Use window.location.origin to make it an absolute URL, bypassing Vite's "public file import" check
            ort.env.wasm.wasmPaths = window.location.origin + '/onnx/';

            // Set to use wasm
            this.session = await ort.InferenceSession.create(modelPath, {
                executionProviders: ['wasm'],
            });
            console.log('Model loaded successfully');

            // Precompute grids
            this.generateGrids();

        } catch (e) {
            console.error('Failed to load model', e);
            throw e;
        }
    }

    private generateGrids() {
        const stride = [8, 16, 32];
        this.grids = [];
        this.expandedStrides = [];

        const hsizes = stride.map(s => Math.floor(this.inputShape / s));
        const wsizes = stride.map(s => Math.floor(this.inputShape / s));

        for (let i = 0; i < stride.length; i++) {
            const s = stride[i];
            const h = hsizes[i];
            const w = wsizes[i];
            for (let y = 0; y < h; y++) {
                for (let x = 0; x < w; x++) {
                    this.grids.push([x, y]);
                    this.expandedStrides.push(s);
                }
            }
        }
    }

    async detect(imageSource: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement): Promise<Detection[]> {
        if (!this.session) return [];

        const { inputTensor, padParams } = await this.preprocess(imageSource);

        const feeds: Record<string, ort.Tensor> = {};
        feeds[this.session.inputNames[0]] = inputTensor;

        const results = await this.session.run(feeds);
        const output = results[this.session.outputNames[0]];

        const detections = this.postprocess(output, padParams);
        return detections;
    }

    private async preprocess(image: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement) {
        const ctx = this.preprocessCtx;
        if (!ctx) throw new Error('Could not get context');

        // Clear canvas
        ctx.clearRect(0, 0, this.inputShape, this.inputShape);

        // Letterbox logic
        const w = image instanceof HTMLVideoElement ? image.videoWidth : image.width;
        const h = image instanceof HTMLVideoElement ? image.videoHeight : image.height;

        const scale = Math.min(this.inputShape / w, this.inputShape / h);
        const nw = Math.floor(w * scale);
        const nh = Math.floor(h * scale);

        // Gray fill (114, 114, 114)
        ctx.fillStyle = 'rgb(114, 114, 114)';
        ctx.fillRect(0, 0, this.inputShape, this.inputShape);

        // Draw resized
        ctx.drawImage(image, 0, 0, nw, nh);

        const imageData = ctx.getImageData(0, 0, this.inputShape, this.inputShape);
        const { data } = imageData; // this is now optimized due to willReadFrequently: true

        const input = new Float32Array(3 * this.inputShape * this.inputShape);

        for (let i = 0; i < this.inputShape * this.inputShape; i++) {
            const r = data[i * 4];
            const g = data[i * 4 + 1];
            const b = data[i * 4 + 2];

            // CHW (BGR expected by model)
            input[i] = b;
            input[i + this.inputShape * this.inputShape] = g;
            input[i + 2 * this.inputShape * this.inputShape] = r;
        }

        const inputTensor = new ort.Tensor('float32', input, [1, 3, this.inputShape, this.inputShape]);
        return { inputTensor, padParams: { scale, nw, nh } };
    }

    private postprocess(output: ort.Tensor, padParams: { scale: number, nw: number, nh: number }): Detection[] {
        const predictions = output.data as Float32Array;

        if (!this.grids || !this.expandedStrides) {
            console.error("Grids not initialized, running generateGrids fallback");
            this.generateGrids();
        }

        const grids = this.grids!;
        const expandedStrides = this.expandedStrides!;

        // Output shape: [1, N, 5 + NumClasses]
        const numAnchors = grids.length; // Should be 3549
        const numCols = predictions.length / numAnchors;
        const detections: Detection[] = [];

        for (let i = 0; i < numAnchors; i++) {
            const offset = i * numCols;

            let x = predictions[offset + 0];
            let y = predictions[offset + 1];
            let w = predictions[offset + 2];
            let h = predictions[offset + 3];
            const boxScore = predictions[offset + 4];

            // Decode
            const grid = grids[i];
            const currentStride = expandedStrides[i];

            x = (x + grid[0]) * currentStride;
            y = (y + grid[1]) * currentStride;
            w = Math.exp(w) * currentStride; // exp
            h = Math.exp(h) * currentStride; // exp

            if (boxScore < CONFIG.CONFIDENCE_THRESHOLD) continue;

            // Find max class score
            let maxClassScore = 0;
            let classId = -1;

            for (let j = 5; j < numCols; j++) {
                const score = predictions[offset + j];
                if (score > maxClassScore) {
                    maxClassScore = score;
                    classId = j - 5;
                }
            }

            // Final score
            const finalScore = boxScore * maxClassScore;

            if (finalScore >= CONFIG.CONFIDENCE_THRESHOLD) {
                // Convert cx,cy,w,h to x1,y1,x2,y2
                const x1 = x - w / 2;
                const y1 = y - h / 2;
                const x2 = x + w / 2;
                const y2 = y + h / 2;

                detections.push({
                    classId: classId, // 0-indexed
                    score: finalScore,
                    box: [x1 / padParams.scale, y1 / padParams.scale, x2 / padParams.scale, y2 / padParams.scale]
                });
            }
        }

        // NMS
        return this.nms(detections);
    }

    private nms(detections: Detection[]): Detection[] {
        // Sort by score
        detections.sort((a, b) => b.score - a.score);

        const kept: Detection[] = [];
        const isSuppressed = new Array(detections.length).fill(false);

        for (let i = 0; i < detections.length; i++) {
            if (isSuppressed[i]) continue;

            const current = detections[i];
            kept.push(current);

            for (let j = i + 1; j < detections.length; j++) {
                if (isSuppressed[j]) continue;

                const other = detections[j];

                // IoU
                const iou = this.calculateIoU(current.box, other.box);
                if (iou > CONFIG.NMS_THRESH) {
                    isSuppressed[j] = true;
                }
            }
        }

        return kept;
    }

    private calculateIoU(boxA: number[], boxB: number[]): number {
        const xA = Math.max(boxA[0], boxB[0]);
        const yA = Math.max(boxA[1], boxB[1]);
        const xB = Math.min(boxA[2], boxB[2]);
        const yB = Math.min(boxA[3], boxB[3]);

        const interArea = Math.max(0, xB - xA) * Math.max(0, yB - yA);

        const boxAArea = (boxA[2] - boxA[0]) * (boxA[3] - boxA[1]);
        const boxBArea = (boxB[2] - boxB[0]) * (boxB[3] - boxB[1]);

        const iou = interArea / (boxAArea + boxBArea - interArea);
        return iou;
    }
}
