// Supabase client for leaderboard
// Falls back to localStorage if Supabase is unavailable

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// --- Types ---

export interface LeaderboardEntry {
    id?: string;
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

// --- Supabase Client ---

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

let supabase: SupabaseClient | null = null;

function getClient(): SupabaseClient | null {
    if (supabase) return supabase;
    if (SUPABASE_URL && SUPABASE_ANON_KEY) {
        supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        return supabase;
    }
    return null;
}

export function isSupabaseConfigured(): boolean {
    return !!(SUPABASE_URL && SUPABASE_ANON_KEY);
}

// --- Supabase Operations ---

export async function submitScore(entry: Omit<LeaderboardEntry, 'id' | 'created_at'>): Promise<boolean> {
    const client = getClient();

    if (client) {
        try {
            const { error } = await client.from('leaderboard').insert([entry]);
            if (error) {
                console.error('Supabase insert error:', error);
                // Fall back to localStorage
                saveToLocalStorage(entry);
                return false;
            }
            // Also save locally as cache
            saveToLocalStorage(entry);
            return true;
        } catch (err) {
            console.error('Supabase network error:', err);
            saveToLocalStorage(entry);
            return false;
        }
    }

    // No Supabase — localStorage only
    saveToLocalStorage(entry);
    return false;
}

export async function fetchLeaderboard(
    challengeId: string,
    limit: number = 50
): Promise<LeaderboardEntry[]> {
    const client = getClient();

    if (client) {
        try {
            const { data, error } = await client
                .from('leaderboard')
                .select('*')
                .eq('challenge_id', challengeId)
                .eq('challenge_type', 'jutsu')
                .order('time_ms', { ascending: true })
                .limit(limit);

            if (!error && data) {
                return data as LeaderboardEntry[];
            }
        } catch (err) {
            console.error('Supabase fetch error:', err);
        }
    }

    // Fallback to localStorage
    return getFromLocalStorage(challengeId);
}

export async function fetchPlayerRank(
    challengeId: string,
    timeMs: number
): Promise<number> {
    const client = getClient();

    if (client) {
        try {
            const { count, error } = await client
                .from('leaderboard')
                .select('*', { count: 'exact', head: true })
                .eq('challenge_id', challengeId)
                .eq('challenge_type', 'jutsu')
                .lt('time_ms', timeMs);

            if (!error && count !== null) {
                return count + 1; // 1-based rank
            }
        } catch (err) {
            console.error('Supabase rank error:', err);
        }
    }

    // Fallback: count from localStorage
    const local = getFromLocalStorage(challengeId);
    const rank = local.filter(e => e.time_ms < timeMs).length + 1;
    return rank;
}

// --- localStorage Fallback ---

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
    // Keep max 500 entries
    if (all.length > 500) all.splice(0, all.length - 500);
    localStorage.setItem(LS_KEY, JSON.stringify(all));
}

function getFromLocalStorage(challengeId: string): LeaderboardEntry[] {
    return getAllLocal()
        .filter(e => e.challenge_id === challengeId)
        .sort((a, b) => a.time_ms - b.time_ms)
        .slice(0, 50);
}
