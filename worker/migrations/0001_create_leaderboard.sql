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
