// Share utilities for challenge results
// Stateless, no React dependency

import type { ChallengeResult } from './ChallengeEngine';
import type { Locale } from '../i18n/translations';

// --- Types ---

export interface ShareParams {
    jutsuId: string;
    timeMs: number;
    rankId: string;
    ninjaName: string;
}

// --- URL Building ---

export function buildShareUrl(result: ChallengeResult, ninjaName?: string): string {
    const base = window.location.origin + window.location.pathname;
    const params = new URLSearchParams({
        c: result.jutsu.id,
        t: String(result.timeMs),
        r: result.rank.id,
    });
    if (ninjaName) params.set('n', ninjaName);
    return `${base}?${params.toString()}`;
}

export function parseShareParams(search: string): ShareParams | null {
    const params = new URLSearchParams(search);
    const jutsuId = params.get('c');
    const timeMs = params.get('t');
    const rankId = params.get('r');
    const ninjaName = params.get('n');

    if (!jutsuId || !timeMs || !rankId) return null;

    const timeParsed = parseInt(timeMs, 10);
    if (isNaN(timeParsed) || timeParsed <= 0) return null;

    return {
        jutsuId,
        timeMs: timeParsed,
        rankId,
        ninjaName: ninjaName || 'Unknown Ninja',
    };
}

export function clearShareParams(): void {
    const url = window.location.origin + window.location.pathname;
    window.history.replaceState({}, '', url);
}

// --- Share Text ---

const SHARE_TEMPLATES: Record<Locale, string> = {
    en: 'I weaved {jutsu} in {time}s and achieved {rank}! Can you beat me?\n{url}\n#Ketsuin #Naruto #NinjaHandSigns',
    zh: '我用{time}秒完成了{jutsu}的结印！达到了{rank}！你能超越我吗？\n{url}\n#Ketsuin #火影忍者 #結印',
    ja: '{jutsu}を{time}秒で結印！{rank}達成！挑戦してみろ！\n{url}\n#Ketsuin #NARUTO #結印',
};

const SHARE_TEMPLATES_RANKED: Record<Locale, string> = {
    en: 'I weaved {jutsu} in {time}s and achieved {rank}! Global #{rankNum}\nCan you beat me?\n{url}\n#Ketsuin #Naruto #NinjaHandSigns',
    zh: '我用{time}秒完成了{jutsu}的结印！{rank}！全球排名 #{rankNum}\n你能超越我吗？\n{url}\n#Ketsuin #火影忍者 #結印',
    ja: '{jutsu}を{time}秒で結印！{rank}！世界ランク #{rankNum}\n挑戦してみろ！\n{url}\n#Ketsuin #NARUTO #結印',
};

/**
 * Build localized share text.
 * Jutsu name always shows as "Japanese name (translated name)",
 * except when locale is 'ja' where only the Japanese name is used.
 */
export function buildShareText(
    result: ChallengeResult,
    locale: Locale,
    translatedJutsuName: string,
    ninjaName?: string,
    globalRank?: number | null,
): string {
    const url = buildShareUrl(result, ninjaName);
    const time = (result.timeMs / 1000).toFixed(3);
    const rank = result.rank.titleJp;

    // Always Japanese name; add translated name in parentheses for non-ja locales
    const jutsuDisplay = locale === 'ja'
        ? result.jutsu.name
        : `${result.jutsu.name} (${translatedJutsuName})`;

    const template = globalRank
        ? SHARE_TEMPLATES_RANKED[locale] || SHARE_TEMPLATES_RANKED.en
        : SHARE_TEMPLATES[locale] || SHARE_TEMPLATES.en;

    return template
        .replace('{jutsu}', jutsuDisplay)
        .replace('{time}', time)
        .replace('{rank}', rank)
        .replace('{rankNum}', String(globalRank || ''))
        .replace('{url}', url);
}

// --- Share Actions ---

export function shareToTwitter(text: string): void {
    const encoded = encodeURIComponent(text);
    window.open(
        `https://twitter.com/intent/tweet?text=${encoded}`,
        '_blank',
        'noopener,noreferrer,width=550,height=420',
    );
}

export async function shareViaWebShareAPI(
    title: string,
    text: string,
    url: string,
): Promise<boolean> {
    if (!navigator.share) return false;
    try {
        await navigator.share({ title, text, url });
        return true;
    } catch {
        // User cancelled or API error
        return false;
    }
}

export function isWebShareSupported(): boolean {
    return typeof navigator.share === 'function';
}

export async function copyToClipboard(text: string): Promise<boolean> {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch {
        // Fallback for older browsers
        try {
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            return true;
        } catch {
            return false;
        }
    }
}

// --- Image Share Actions ---

/**
 * Share via Web Share API with image file attached.
 * Returns false if not supported or user cancelled.
 */
export async function shareWithImage(
    title: string,
    text: string,
    imageBlob: Blob,
): Promise<boolean> {
    if (!navigator.share || !navigator.canShare) return false;

    const file = new File([imageBlob], 'ketsuin-result.png', { type: 'image/png' });
    const shareData = { title, text, files: [file] };

    if (!navigator.canShare(shareData)) return false;

    try {
        await navigator.share(shareData);
        return true;
    } catch {
        return false;
    }
}

/**
 * Copy image blob to clipboard (for desktop Twitter workaround).
 * Returns false if clipboard API doesn't support image writing.
 */
export async function copyImageToClipboard(imageBlob: Blob): Promise<boolean> {
    try {
        const item = new ClipboardItem({ 'image/png': imageBlob });
        await navigator.clipboard.write([item]);
        return true;
    } catch {
        return false;
    }
}

/**
 * Download image blob as a file to the user's device.
 */
export function downloadImage(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
