import { Hono, Context } from 'hono';
import { corsHeaders, isAllowedOrigin, preflightResponse } from './cors';

interface LeaderboardRow {
    id: number;
    ninja_name: string;
    challenge_type: 'jutsu' | 'typing';
    challenge_id: string;
    time_ms: number;
    sign_count: number;
    rank_title: string;
    score: number | null;
    accuracy: number | null;
    created_at: string;
}

type Bindings = {
    DB: D1Database;
    ALLOWED_ORIGINS: string;
};

const app = new Hono<{ Bindings: Bindings }>();

function getOrigin(c: Context<{ Bindings: Bindings }>): string | null {
    const requested = c.req.header('Origin');
    const allowed = (c.env.ALLOWED_ORIGINS || '').split(',').map((s: string) => s.trim());
    return isAllowedOrigin(requested ?? null, { allowedOrigins: allowed });
}

app.use('*', async (c, next) => {
    const origin = getOrigin(c);
    if (c.req.method === 'OPTIONS') {
        if (!origin) return c.text('Forbidden', 403);
        return preflightResponse(origin);
    }
    await next();
    if (origin) {
        const headers = corsHeaders(origin);
        Object.entries(headers).forEach(([key, value]) => {
            c.res.headers.set(key, value);
        });
    }
});

app.post('/api/leaderboard', async (c) => {
    const body = await c.req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
        return c.json({ error: 'Invalid JSON body' }, 400);
    }

    const timeMs = Number(body.time_ms);
    const signCount = Number(body.sign_count);

    const entry = {
        ninja_name: String(body.ninja_name || '').trim(),
        challenge_type: body.challenge_type === 'typing' ? 'typing' : 'jutsu',
        challenge_id: String(body.challenge_id || '').trim(),
        time_ms: Number.isSafeInteger(timeMs) && timeMs > 0 ? timeMs : NaN,
        sign_count: Number.isSafeInteger(signCount) && signCount > 0 ? signCount : NaN,
        rank_title: String(body.rank_title || '').trim(),
        score: body.score === undefined || body.score === null ? null : Number(body.score),
        accuracy: body.accuracy === undefined || body.accuracy === null ? null : Number(body.accuracy),
    };

    entry.score = entry.score !== null && Number.isFinite(entry.score) ? entry.score : null;
    entry.accuracy = entry.accuracy !== null && Number.isFinite(entry.accuracy) ? entry.accuracy : null;

    const MAX_NAME_LENGTH = 50;
    const MAX_CHALLENGE_ID_LENGTH = 50;
    const MAX_RANK_TITLE_LENGTH = 50;

    if (
        !entry.ninja_name ||
        entry.ninja_name.length > MAX_NAME_LENGTH ||
        !entry.challenge_id ||
        entry.challenge_id.length > MAX_CHALLENGE_ID_LENGTH ||
        !entry.rank_title ||
        entry.rank_title.length > MAX_RANK_TITLE_LENGTH ||
        Number.isNaN(entry.time_ms) ||
        Number.isNaN(entry.sign_count)
    ) {
        return c.json({ error: 'Missing required fields' }, 400);
    }

    try {
        await c.env.DB.prepare(
            `INSERT INTO leaderboard
             (ninja_name, challenge_type, challenge_id, time_ms, sign_count, rank_title, score, accuracy)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
        )
            .bind(
                entry.ninja_name,
                entry.challenge_type,
                entry.challenge_id,
                entry.time_ms,
                entry.sign_count,
                entry.rank_title,
                entry.score,
                entry.accuracy
            )
            .run();
    } catch (err) {
        console.error(err);
        return c.json({ error: 'Internal server error' }, 500);
    }

    return c.json({ ok: true }, 201);
});

app.get('/api/leaderboard', async (c) => {
    const challengeId = c.req.query('challenge_id') || '';
    const challengeType = c.req.query('challenge_type') || 'jutsu';
    let limit = parseInt(c.req.query('limit') || '50', 10);
    if (Number.isNaN(limit) || limit <= 0) {
        limit = 50;
    }
    limit = Math.min(limit, 100);

    if (!challengeId) {
        return c.json({ error: 'challenge_id is required' }, 400);
    }

    try {
        const { results } = await c.env.DB.prepare(
            `SELECT id, ninja_name, challenge_type, challenge_id, time_ms, sign_count, rank_title, score, accuracy, created_at
             FROM leaderboard
             WHERE challenge_id = ? AND challenge_type = ?
             ORDER BY time_ms ASC
             LIMIT ?`
        )
            .bind(challengeId, challengeType, limit)
            .all<LeaderboardRow>();

        return c.json({ data: results || [] });
    } catch (err) {
        console.error(err);
        return c.json({ error: 'Internal server error' }, 500);
    }
});

app.get('/api/leaderboard/rank', async (c) => {
    const challengeId = c.req.query('challenge_id') || '';
    const challengeType = c.req.query('challenge_type') || 'jutsu';
    const timeMs = parseInt(c.req.query('time_ms') || '0', 10);

    if (!challengeId || Number.isNaN(timeMs) || timeMs <= 0) {
        return c.json({ error: 'challenge_id and time_ms are required' }, 400);
    }

    try {
        const row = await c.env.DB.prepare(
            `SELECT COUNT(*) as count
             FROM leaderboard
             WHERE challenge_id = ? AND challenge_type = ? AND time_ms < ?`
        )
            .bind(challengeId, challengeType, timeMs)
            .first<{ count: number }>();

        const count = row?.count ?? 0;
        return c.json({ rank: count + 1 });
    } catch (err) {
        console.error(err);
        return c.json({ error: 'Internal server error' }, 500);
    }
});

app.notFound((c) => c.json({ error: 'Not found' }, 404));

export default app;
