// Leaderboard API client — talks to Cloudflare Worker, falls back to localStorage

// --- Types ---

export interface LeaderboardEntry {
    id?: string | number;
    ninja_name: string;
    challenge_type: 'jutsu' | 'typing';
    challenge_id: string;
    time_ms: number;
    sign_count: number;
    rank_title: string;
    score?: number;
    accuracy?: number;
    created_at?: string;
}

interface ApiError extends Error {
    status?: number;
}

// --- Config ---

function getApiUrl(): string {
    return (import.meta.env.VITE_LEADERBOARD_API_URL || '').trim();
}

export function isLeaderboardApiConfigured(): boolean {
    const url = getApiUrl();
    if (!url) return false;
    try {
        const parsed = new URL(url);
        if (parsed.protocol === 'https:') return true;
        if (parsed.protocol === 'http:' && parsed.hostname === 'localhost') return true;
        return false;
    } catch {
        return false;
    }
}

function apiUrl(path: string): string {
    const base = getApiUrl().replace(/\/$/, '');
    return `${base}${path}`;
}

async function apiPost(path: string, body: unknown): Promise<void> {
    const res = await fetch(apiUrl(path), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        const err: ApiError = new Error(`Leaderboard API error: ${res.status}`);
        err.status = res.status;
        throw err;
    }
}

async function apiGet<T>(path: string): Promise<T> {
    const res = await fetch(apiUrl(path));
    if (!res.ok) {
        const err: ApiError = new Error(`Leaderboard API error: ${res.status}`);
        err.status = res.status;
        throw err;
    }
    return res.json() as Promise<T>;
}

// --- API Operations ---

export async function submitScore(entry: Omit<LeaderboardEntry, 'id' | 'created_at'>): Promise<boolean> {
    if (isLeaderboardApiConfigured()) {
        try {
            await apiPost('/api/leaderboard', entry);
            saveToLocalStorage(entry);
            return true;
        } catch (err) {
            console.error('Leaderboard API submit error:', err);
            saveToLocalStorage(entry);
            return false;
        }
    }

    saveToLocalStorage(entry);
    return false;
}

export async function fetchLeaderboard(
    challengeId: string,
    limit: number = 50
): Promise<LeaderboardEntry[]> {
    if (isLeaderboardApiConfigured()) {
        try {
            const { data } = await apiGet<{ data: LeaderboardEntry[] }>(
                `/api/leaderboard?challenge_id=${encodeURIComponent(challengeId)}&challenge_type=jutsu&limit=${limit}`
            );
            return data || [];
        } catch (err) {
            console.error('Leaderboard API fetch error:', err);
        }
    }

    return getFromLocalStorage(challengeId);
}

export async function fetchPlayerRank(
    challengeId: string,
    timeMs: number
): Promise<number> {
    if (isLeaderboardApiConfigured()) {
        try {
            const { rank } = await apiGet<{ rank: number }>(
                `/api/leaderboard/rank?challenge_id=${encodeURIComponent(challengeId)}&challenge_type=jutsu&time_ms=${timeMs}`
            );
            return rank;
        } catch (err) {
            console.error('Leaderboard API rank error:', err);
        }
    }

    const local = getFromLocalStorage(challengeId);
    return local.filter(e => e.time_ms < timeMs).length + 1;
}

// --- localStorage Fallback (unchanged behavior) ---

const LS_KEY = 'ketsuin_leaderboard';

function getAllLocal(): LeaderboardEntry[] {
    try {
        const raw = localStorage.getItem(LS_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

function saveToLocalStorage(entry: Omit<LeaderboardEntry, 'id' | 'created_at'>) {
    const all = getAllLocal();
    all.push({
        ...entry,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
    });
    if (all.length > 500) all.splice(0, all.length - 500);
    localStorage.setItem(LS_KEY, JSON.stringify(all));
}

function getFromLocalStorage(challengeId: string): LeaderboardEntry[] {
    return getAllLocal()
        .filter(e => e.challenge_id === challengeId)
        .sort((a, b) => a.time_ms - b.time_ms)
        .slice(0, 50);
}
