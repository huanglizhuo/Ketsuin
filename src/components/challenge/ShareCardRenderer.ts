// Captures a DOM element as a PNG blob using html2canvas
// Used by ChallengeResult to screenshot the live report card UI

import html2canvas from 'html2canvas';

/**
 * Capture an HTML element as a PNG blob.
 * Renders with a solid black background and 2x scale for crisp output.
 */
export async function captureElementAsImage(
  element: HTMLElement,
  options?: { width?: number; height?: number },
): Promise<Blob> {
  const canvas = await html2canvas(element, {
    backgroundColor: '#0a0a0a',
    scale: 2,
    useCORS: true,
    logging: false,
    ...options,
  });

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Canvas toBlob failed'))),
      'image/png',
    );
  });
}
