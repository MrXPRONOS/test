ALTER TABLE people ADD COLUMN is_superadmin INTEGER NOT NULL DEFAULT 0 CHECK(is_superadmin IN (0,1));
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_super ON people(is_superadmin) WHERE is_superadmin=1;
CREATE TABLE IF NOT EXISTS admin_invites(id TEXT PRIMARY KEY,name TEXT NOT NULL,email TEXT NOT NULL COLLATE NOCASE,code_hash TEXT NOT NULL,created_by TEXT NOT NULL,expires_at INTEGER NOT NULL,created_at TEXT NOT NULL,consumed_at TEXT);
CREATE INDEX IF NOT EXISTS idx_invite_email ON admin_invites(email,code_hash,expires_at);
CREATE TABLE IF NOT EXISTS ops_events(id TEXT PRIMARY KEY,kind TEXT NOT NULL,action TEXT NOT NULL,actor_id TEXT NOT NULL DEFAULT '',detail TEXT NOT NULL,created_at TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS idx_events_time ON ops_events(created_at DESC);