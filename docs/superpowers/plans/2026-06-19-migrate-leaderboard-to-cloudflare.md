# Migrate Leaderboard from Supabase to Cloudflare Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Supabase-backed global leaderboard with a Cloudflare Worker + D1 SQLite backend while preserving the existing localStorage fallback and component behavior.

**Architecture:** A single Cloudflare Worker exposes three CORS-enabled REST endpoints backed by a D1 `leaderboard` table. The frontend gains a thin API client (`src/core/leaderboardApi.ts`) that mirrors the old Supabase operation signatures, so `Leaderboard.tsx` and `ChallengeResult.tsx` only change their import paths. The static frontend deploys to Cloudflare Pages (or keeps GitHub Pages) and reads the Worker URL from a Vite env var.

**Tech Stack:** Cloudflare Workers, D1 (SQLite), Wrangler, TypeScript, Vite, Vitest (new), localStorage fallback.

---

## File Structure

| File | Responsibility |
|------|----------------|
| `worker/wrangler.toml` | Worker/D1 bindings, routes, env vars for local dev. |
| `worker/schema.sql` | D1 table schema for the leaderboard. |
| `worker/src/index.ts` | Cloudflare Worker request router with CORS + three API endpoints. |
| `worker/src/cors.ts` | Reusable CORS preflight/origin handling. |
| `src/core/leaderboardApi.ts` | Frontend API client: submit, fetch, rank. Keeps localStorage fallback. |
| `src/core/supabase.ts` | **Deleted** after migration. |
| `src/components/challenge/Leaderboard.tsx` | Update import to use `leaderboardApi.ts`. |
| `src/components/challenge/ChallengeResult.tsx` | Update import to use `leaderboardApi.ts`. |
| `src/views/AboutView.tsx` | Update tech stack mention from Supabase to Cloudflare. |
| `.env.example` | Replace Supabase vars with `VITE_LEADERBOARD_API_URL`. |
| `.github/workflows/deploy.yml` | Replace Supabase secrets with `VITE_LEADERBOARD_API_URL`. |
| `vitest.config.ts` | New Vitest config for frontend unit tests. |
| `src/core/leaderboardApi.test.ts` | Unit tests for the API client and localStorage fallback. |
| `public/llms.txt` | Update tech stack mention from Supabase to Cloudflare. |

---

## Task 1: Scaffold Cloudflare Worker Project

**Files:**
- Create: `worker/package.json`
- Create: `worker/wrangler.toml`
- Create: `worker/tsconfig.json`
- Create: `worker/schema.sql`

- [ ] **Step 1: Create Worker package manifest**

```json
{
  "name": "ketsuin-leaderboard-worker",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "wrangler dev",
    "deploy": "wrangler deploy",
    "db:create": "wrangler d1 create ketsuin-leaderboard",
    "db:migrate:local": "wrangler d1 migrations apply ketsuin-leaderboard --local",
    "db:migrate:prod": "wrangler d1 migrations apply ketsuin-leaderboard --remote"
  },
  "dependencies": {
    "hono": "^4.7.0"
  },
  "devDependencies": {
    "@cloudflare/workers-types": "^4.20240620.0",
    "typescript": "^5.9.3",
    "wrangler": "^3.114.0"
  }
}
```

- [ ] **Step 2: Create Wrangler config with D1 binding**

```toml
name = "ketsuin-leaderboard-worker"
main = "src/index.ts"
compatibility_date = "2024-06-20"

# Allow requests from GitHub Pages and local Vite dev server.
# Update ALLOWED_ORIGINS in production to match your deployed frontend domain.
[vars]
ALLOWED_ORIGINS = "http://localhost:5173,https://huanglizhuo.github.io"

[[d1_databases]]
binding = "DB"
database_name = "ketsuin-leaderboard"
database_id = "<replace-after-db-create>"
```

- [ ] **Step 3: Create TypeScript config**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "types": ["@cloudflare/workers-types"]
  },
  "include": ["src/**/*"]
}
```

- [ ] **Step 4: Create D1 schema**

```sql
CREATE TABLE IF NOT EXISTS leaderboard (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ninja_name TEXT NOT NULL,
    challenge_type TEXT NOT NULL CHECK (challenge_type IN ('jutsu', 'typing')),
    challenge_id TEXT NOT NULL,
    time_ms INTEGER NOT NULL,
    sign_count INTEGER NOT NULL,
    rank_title TEXT NOT NULL,
    score INTEGER,
    accuracy REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_leaderboard_challenge
ON leaderboard(challenge_id, challenge_type, time_ms);
```

- [ ] **Step 5: Commit**

```bash
git add worker/
git commit -m "chore(worker): scaffold Cloudflare Worker + D1 for leaderboard"
```

---

## Task 2: Implement Worker API with CORS

**Files:**
- Create: `worker/src/cors.ts`
- Create: `worker/src/index.ts`

- [ ] **Step 1: Implement CORS helper**

```typescript
export interface CorsConfig {
    allowedOrigins: string[];
}

export function isAllowedOrigin(origin: string | null, config: CorsConfig): string | null {
    if (!origin) return null;
    if (config.allowedOrigins.includes(origin)) return origin;
    return null;
}

export function corsHeaders(origin: string): HeadersInit {
    return {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400',
    };
}

export function preflightResponse(origin: string): Response {
    return new Response(null, {
        status: 204,
        headers: corsHeaders(origin),
    });
}
```

- [ ] **Step 2: Implement Worker router and endpoints**

```typescript
import { Hono } from 'hono';
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

function getOrigin(c: any): string | null {
    const requested = c.req.header('Origin');
    const allowed = (c.env.ALLOWED_ORIGINS || '').split(',').map((s: string) => s.trim());
    return isAllowedOrigin(requested, { allowedOrigins: allowed });
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

// POST /api/leaderboard — submit a score
app.post('/api/leaderboard', async (c) => {
    const body = await c.req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
        return c.json({ error: 'Invalid JSON body' }, 400);
    }

    const entry = {
        ninja_name: String(body.ninja_name || '').trim(),
        challenge_type: body.challenge_type === 'typing' ? 'typing' : 'jutsu',
        challenge_id: String(body.challenge_id || '').trim(),
        time_ms: Number(body.time_ms),
        sign_count: Number(body.sign_count),
        rank_title: String(body.rank_title || '').trim(),
        score: body.score === undefined ? null : Number(body.score),
        accuracy: body.accuracy === undefined ? null : Number(body.accuracy),
    };

    if (!entry.ninja_name || !entry.challenge_id || Number.isNaN(entry.time_ms) || entry.time_ms <= 0) {
        return c.json({ error: 'Missing required fields' }, 400);
    }

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

    return c.json({ ok: true }, 201);
});

// GET /api/leaderboard?challenge_id=&challenge_type=jutsu&limit=50
app.get('/api/leaderboard', async (c) => {
    const challengeId = c.req.query('challenge_id') || '';
    const challengeType = c.req.query('challenge_type') || 'jutsu';
    const limit = Math.min(parseInt(c.req.query('limit') || '50', 10), 100);

    if (!challengeId) {
        return c.json({ error: 'challenge_id is required' }, 400);
    }

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
});

// GET /api/leaderboard/rank?challenge_id=&challenge_type=jutsu&time_ms=
app.get('/api/leaderboard/rank', async (c) => {
    const challengeId = c.req.query('challenge_id') || '';
    const challengeType = c.req.query('challenge_type') || 'jutsu';
    const timeMs = parseInt(c.req.query('time_ms') || '0', 10);

    if (!challengeId || Number.isNaN(timeMs) || timeMs <= 0) {
        return c.json({ error: 'challenge_id and time_ms are required' }, 400);
    }

    const row = await c.env.DB.prepare(
        `SELECT COUNT(*) as count
         FROM leaderboard
         WHERE challenge_id = ? AND challenge_type = ? AND time_ms < ?`
    )
        .bind(challengeId, challengeType, timeMs)
        .first<{ count: number }>();

    const count = row?.count ?? 0;
    return c.json({ rank: count + 1 });
});

app.notFound((c) => c.json({ error: 'Not found' }, 404));

export default app;
```

- [ ] **Step 3: Run local typecheck**

Run: `cd worker && npm install && npx tsc --noEmit`
Expected: No type errors.

- [ ] **Step 4: Commit**

```bash
git add worker/src/ worker/package.json worker/wrangler.toml worker/tsconfig.json worker/schema.sql
git commit -m "feat(worker): add CORS-enabled leaderboard API endpoints"
```

---

## Task 3: Create Frontend API Client

**Files:**
- Create: `src/core/leaderboardApi.ts`
- Delete: `src/core/supabase.ts` (after components are updated in Task 4)

- [ ] **Step 1: Implement leaderboard API client with localStorage fallback**

```typescript
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

const API_URL = (import.meta.env.VITE_LEADERBOARD_API_URL || '').trim();

export function isLeaderboardApiConfigured(): boolean {
    return API_URL.startsWith('https://') || API_URL.startsWith('http://localhost');
}

function apiUrl(path: string): string {
    const base = API_URL.replace(/\/$/, '');
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
```

- [ ] **Step 2: Commit**

```bash
git add src/core/leaderboardApi.ts
git commit -m "feat(core): add Cloudflare Worker leaderboard API client"
```

---

## Task 4: Update Components and Remove Supabase Dependency

**Files:**
- Modify: `src/components/challenge/Leaderboard.tsx`
- Modify: `src/components/challenge/ChallengeResult.tsx`
- Modify: `src/views/AboutView.tsx`
- Delete: `src/core/supabase.ts`
- Modify: `package.json`
- Modify: `.env.example`
- Modify: `public/llms.txt`

- [ ] **Step 1: Update Leaderboard component imports**

In `src/components/challenge/Leaderboard.tsx`, replace:

```typescript
import { fetchLeaderboard, isSupabaseConfigured } from '../../core/supabase';
import type { LeaderboardEntry } from '../../core/supabase';
```

with:

```typescript
import { fetchLeaderboard, isLeaderboardApiConfigured } from '../../core/leaderboardApi';
import type { LeaderboardEntry } from '../../core/leaderboardApi';
```

And replace the data-source indicator line:

```tsx
{isSupabaseConfigured() ? t('leaderboard.global') : t('leaderboard.local')}
```

with:

```tsx
{isLeaderboardApiConfigured() ? t('leaderboard.global') : t('leaderboard.local')}
```

- [ ] **Step 2: Update ChallengeResult component imports**

In `src/components/challenge/ChallengeResult.tsx`, replace:

```typescript
import { submitScore, fetchPlayerRank } from '../../core/supabase';
```

with:

```typescript
import { submitScore, fetchPlayerRank } from '../../core/leaderboardApi';
```

- [ ] **Step 3: Update AboutView tech stack mention**

In `src/views/AboutView.tsx`, replace:

```tsx
<li><strong>Supabase</strong> — global leaderboard for challenge mode</li>
```

with:

```tsx
<li><strong>Cloudflare Workers + D1</strong> — global leaderboard for challenge mode</li>
```

- [ ] **Step 4: Update environment example**

Replace `.env.example` contents with:

```bash
# Leaderboard API Configuration (optional - falls back to localStorage if not set)
# Set this to your deployed Cloudflare Worker URL, e.g.:
# VITE_LEADERBOARD_API_URL=https://ketsuin-leaderboard-worker.<your-subdomain>.workers.dev
VITE_LEADERBOARD_API_URL=
```

- [ ] **Step 5: Remove Supabase dependency from package.json**

Remove this line from `dependencies` in `package.json`:

```json
    "@supabase/supabase-js": "^2.95.3",
```

Then run:

```bash
npm install
```

- [ ] **Step 6: Delete old Supabase client**

```bash
rm src/core/supabase.ts
git rm src/core/supabase.ts
```

- [ ] **Step 7: Update public llms.txt tech mention**

In `public/llms.txt`, replace:

```text
- Supabase for leaderboard data
```

with:

```text
- Cloudflare Workers + D1 for leaderboard data
```

- [ ] **Step 8: Build and typecheck**

Run: `npm run build`
Expected: Build succeeds with no TypeScript or lint errors.

- [ ] **Step 9: Commit**

```bash
git add src/components/challenge/Leaderboard.tsx src/components/challenge/ChallengeResult.tsx src/views/AboutView.tsx .env.example package.json package-lock.json public/llms.txt
git commit -m "refactor(supabase): replace Supabase client with Cloudflare Worker leaderboard API"
```

---

## Task 5: Update GitHub Actions Deployment

**Files:**
- Modify: `.github/workflows/deploy.yml`

- [ ] **Step 1: Replace Supabase secrets with leaderboard API URL**

In `.github/workflows/deploy.yml`, replace:

```yaml
        env:
          GITHUB_PAGES: 'true'
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
```

with:

```yaml
        env:
          GITHUB_PAGES: 'true'
          VITE_LEADERBOARD_API_URL: ${{ secrets.VITE_LEADERBOARD_API_URL }}
```

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/deploy.yml
git commit -m "ci(deploy): use Cloudflare leaderboard API URL instead of Supabase secrets"
```

---

## Task 6: Add Unit Tests for API Client

**Files:**
- Create: `vitest.config.ts`
- Create: `src/core/leaderboardApi.test.ts`

- [ ] **Step 1: Install Vitest**

Run: `npm install -D vitest @vitest/coverage-v8 jsdom @testing-library/react`
Expected: `package.json` devDependencies updated.

- [ ] **Step 2: Create Vitest config**

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        environment: 'jsdom',
        globals: true,
    },
});
```

- [ ] **Step 3: Write API client tests**

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    fetchLeaderboard,
    fetchPlayerRank,
    isLeaderboardApiConfigured,
    submitScore,
} from './leaderboardApi';

const LS_KEY = 'ketsuin_leaderboard';

function mockEnv(apiUrl: string) {
    vi.stubGlobal('import', {
        meta: { env: { VITE_LEADERBOARD_API_URL: apiUrl } },
    });
}

describe('leaderboardApi', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.stubGlobal('import.meta', { env: {} });
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
    });

    it('reports unconfigured when API URL is missing', () => {
        vi.stubGlobal('import.meta', { env: {} });
        expect(isLeaderboardApiConfigured()).toBe(false);
    });

    it('reports configured for HTTPS worker URL', () => {
        vi.stubGlobal('import.meta', {
            env: { VITE_LEADERBOARD_API_URL: 'https://worker.example.com' },
        });
        expect(isLeaderboardApiConfigured()).toBe(true);
    });

    it('submits score to localStorage when API is unconfigured', async () => {
        vi.stubGlobal('import.meta', { env: {} });
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
        vi.stubGlobal('import.meta', { env: {} });
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
        vi.stubGlobal('import.meta', { env: {} });
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
        vi.stubGlobal('import.meta', {
            env: { VITE_LEADERBOARD_API_URL: 'https://worker.example.com' },
        });
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
```

- [ ] **Step 4: Add test script to package.json**

Add to `scripts` in `package.json`:

```json
    "test": "vitest run",
    "test:watch": "vitest"
```

- [ ] **Step 5: Run tests**

Run: `npm test`
Expected: All tests pass.

- [ ] **Step 6: Commit**

```bash
git add vitest.config.ts src/core/leaderboardApi.test.ts package.json package-lock.json
git commit -m "test(leaderboard): add Vitest coverage for API client and fallback"
```

---

## Task 7: Provision D1 and Deploy Worker

**Files:**
- Modify: `worker/wrangler.toml` (after creating DB)

- [ ] **Step 1: Create D1 database**

Run: `cd worker && npm run db:create`
Expected: Wrangler outputs a `database_id`. Copy it.

- [ ] **Step 2: Update wrangler.toml with database_id**

Replace `<replace-after-db-create>` in `worker/wrangler.toml` with the copied ID.

- [ ] **Step 3: Apply schema migration locally**

Run: `cd worker && npm run db:migrate:local`
Expected: Migration applies successfully.

- [ ] **Step 4: Deploy worker to production**

Run: `cd worker && npm run deploy`
Expected: Wrangler deploys and prints the Worker URL.

- [ ] **Step 5: Apply schema migration to production**

Run: `cd worker && npm run db:migrate:prod`
Expected: Remote D1 table created.

- [ ] **Step 6: Commit wrangler.toml update**

```bash
git add worker/wrangler.toml
git commit -m "chore(worker): bind production D1 database"
```

---

## Task 8: Migrate Existing Supabase Data (Optional)

**Files:**
- Create: `scripts/migrate_supabase_to_d1.py`

Skip this task if there is no existing Supabase data to preserve.

- [ ] **Step 1: Create one-shot migration script**

```python
#!/usr/bin/env python3
"""Export Supabase leaderboard rows and import into Cloudflare D1."""
import csv
import json
import os
import sys

import requests

SUPABASE_URL = os.environ.get('SUPABASE_URL')
SUPABASE_ANON_KEY = os.environ.get('SUPABASE_ANON_KEY')
D1_WORKER_URL = os.environ.get('D1_WORKER_URL')

if not all([SUPABASE_URL, SUPABASE_ANON_KEY, D1_WORKER_URL]):
    print('Set SUPABASE_URL, SUPABASE_ANON_KEY, and D1_WORKER_URL', file=sys.stderr)
    sys.exit(1)


def fetch_supabase():
    url = f'{SUPABASE_URL}/rest/v1/leaderboard?select=*'
    headers = {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': f'Bearer {SUPABASE_ANON_KEY}',
    }
    r = requests.get(url, headers=headers, timeout=30)
    r.raise_for_status()
    return r.json()


def insert_into_d1(rows):
    ok = 0
    for row in rows:
        payload = {
            'ninja_name': row['ninja_name'],
            'challenge_type': row['challenge_type'],
            'challenge_id': row['challenge_id'],
            'time_ms': row['time_ms'],
            'sign_count': row['sign_count'],
            'rank_title': row['rank_title'],
            'score': row.get('score'),
            'accuracy': row.get('accuracy'),
        }
        r = requests.post(f'{D1_WORKER_URL}/api/leaderboard', json=payload, timeout=30)
        if r.status_code == 201:
            ok += 1
        else:
            print(f"Failed to insert {row.get('id')}: {r.status_code} {r.text}")
    return ok


if __name__ == '__main__':
    rows = fetch_supabase()
    print(f'Fetched {len(rows)} rows from Supabase')
    ok = insert_into_d1(rows)
    print(f'Inserted {ok}/{len(rows)} rows into D1')
```

- [ ] **Step 2: Export and verify**

Run:

```bash
python scripts/migrate_supabase_to_d1.py
```

Expected: Script reports fetched and inserted counts. Verify by hitting the `/api/leaderboard?challenge_id=<id>` endpoint.

- [ ] **Step 3: Commit**

```bash
git add scripts/migrate_supabase_to_d1.py
git commit -m "chore(migration): add Supabase-to-D1 data migration script"
```

---

## Task 9: Configure Production Frontend Secret and Deploy

**Files:**
- Modify: Repository GitHub secrets (outside repo files)

- [ ] **Step 1: Add GitHub secret**

In the GitHub repository settings, add:
- `VITE_LEADERBOARD_API_URL` = the deployed Cloudflare Worker URL (e.g. `https://ketsuin-leaderboard-worker.<subdomain>.workers.dev`)

Remove the old secrets `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

- [ ] **Step 2: Trigger production deploy**

Run the `Deploy Ketsuin to GitHub Pages` workflow manually or push to `main`.
Expected: Workflow succeeds and the leaderboard uses Cloudflare.

- [ ] **Step 3: Smoke test production**

1. Open the deployed site.
2. Go to Challenge mode, complete a jutsu, and submit a score.
3. Open `/ranking` and confirm the score appears.
4. Confirm the data source indicator shows "GLOBAL LEADERBOARD".

---

## Self-Review

**1. Spec coverage:**
- Supabase dependency removal: Task 4.
- Leaderboard insert/fetch/rank operations preserved: Tasks 2 and 3.
- localStorage fallback preserved: Task 3.
- Cloudflare backend introduced: Tasks 1, 2, and 7.
- Environment/config migration: Tasks 4 and 5.
- Deployment workflow update: Task 5.
- Documentation/tech stack update: Task 4.
- Data migration path: Task 8.
- Production verification: Task 9.

**2. Placeholder scan:**
- No `TBD`, `TODO`, or vague instructions remain.
- All code blocks contain concrete implementation.
- `<replace-after-db-create>` is intentional and resolved in Task 7.

**3. Type consistency:**
- `LeaderboardEntry` interface matches the old Supabase type; `id` allows `string | number` to accommodate D1 integer IDs and existing localStorage UUIDs.
- Component imports align with new module exports.
- Worker SQL parameter order matches the insert binding order.

---

## Execution Handoff

**Plan complete and saved to `docs/superpowers/plans/2026-06-19-migrate-leaderboard-to-cloudflare.md`.**

Two execution options:

1. **Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration.
2. **Inline Execution** — Execute tasks in this session using `executing-plans`, batch execution with checkpoints.

Which approach would you like?
