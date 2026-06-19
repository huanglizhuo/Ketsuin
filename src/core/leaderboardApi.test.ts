import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    fetchLeaderboard,
    fetchPlayerRank,
    isLeaderboardApiConfigured,
    submitScore,
} from './leaderboardApi';

const LS_KEY = 'ketsuin_leaderboard';

describe('leaderboardApi', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.stubGlobal('crypto', { randomUUID: () => 'test-uuid' });
        vi.stubEnv('VITE_LEADERBOARD_API_URL', undefined);
    });

    afterEach(() => {
        vi.unstubAllEnvs();
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
    });

    it('reports unconfigured when API URL is missing', () => {
        expect(isLeaderboardApiConfigured()).toBe(false);
    });

    it('reports configured for HTTPS worker URL', () => {
        vi.stubEnv('VITE_LEADERBOARD_API_URL', 'https://worker.example.com');
        expect(isLeaderboardApiConfigured()).toBe(true);
    });

    it('submits score to localStorage when API is unconfigured', async () => {
        const ok = await submitScore({
            ninja_name: 'Kakashi',
            challenge_type: 'jutsu',
            challenge_id: 'chidori',
            time_ms: 12345,
            sign_count: 4,
            rank_title: 'jonin',
        });
        expect(ok).toBe(false);

        const raw = localStorage.getItem(LS_KEY);
        expect(raw).not.toBeNull();
        const parsed = JSON.parse(raw!);
        expect(parsed).toHaveLength(1);
        expect(parsed[0].ninja_name).toBe('Kakashi');
    });

    it('fetches localStorage entries sorted by time', async () => {
        localStorage.setItem(
            LS_KEY,
            JSON.stringify([
                { id: '1', challenge_id: 'chidori', time_ms: 2000, ninja_name: 'A', challenge_type: 'jutsu', sign_count: 4, rank_title: 'genin' },
                { id: '2', challenge_id: 'chidori', time_ms: 1000, ninja_name: 'B', challenge_type: 'jutsu', sign_count: 4, rank_title: 'genin' },
            ])
        );

        const entries = await fetchLeaderboard('chidori');
        expect(entries[0].time_ms).toBe(1000);
        expect(entries[1].time_ms).toBe(2000);
    });

    it('calculates rank from localStorage fallback', async () => {
        localStorage.setItem(
            LS_KEY,
            JSON.stringify([
                { id: '1', challenge_id: 'chidori', time_ms: 2000, ninja_name: 'A', challenge_type: 'jutsu', sign_count: 4, rank_title: 'genin' },
                { id: '2', challenge_id: 'chidori', time_ms: 1000, ninja_name: 'B', challenge_type: 'jutsu', sign_count: 4, rank_title: 'genin' },
            ])
        );

        const rank = await fetchPlayerRank('chidori', 1500);
        expect(rank).toBe(2);
    });

    it('calls worker API when configured', async () => {
        vi.stubEnv('VITE_LEADERBOARD_API_URL', 'https://worker.example.com');
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({ data: [{ id: 1, ninja_name: 'Itachi', time_ms: 500 }] }),
        } as Response);

        const entries = await fetchLeaderboard('chidori');
        expect(entries).toHaveLength(1);
        expect(entries[0].ninja_name).toBe('Itachi');
        expect(global.fetch).toHaveBeenCalledWith(
            'https://worker.example.com/api/leaderboard?challenge_id=chidori&challenge_type=jutsu&limit=50'
        );
    });
});
