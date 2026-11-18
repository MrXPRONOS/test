-- GW Suivi / Greatness Winner - Cloudflare D1 (SQLite)
-- Dedicated database only. Never place passwords, setup code or access tokens in this file.
PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS people (
  id TEXT PRIMARY KEY,
  user_id TEXT UNIQUE,
  name TEXT NOT NULL CHECK(length(name) BETWEEN 1 AND 100),
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  role TEXT NOT NULL CHECK(role IN ('admin','employee')),
  invite_code TEXT,
  active INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0,1)),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  salt TEXT NOT NULL,
  iterations INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_sessions_account ON sessions(user_id);
CREATE TABLE IF NOT EXISTS login_failures (
  email TEXT NOT NULL,
  occurred_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_fail_email_time ON login_failures(email,occurred_at);
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL CHECK(length(title) BETWEEN 1 AND 130),
  description TEXT NOT NULL DEFAULT '',
  employee_id TEXT NOT NULL REFERENCES people(id),
  due_at TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'normal' CHECK(priority IN ('low','normal','high')),
  bonus_amount INTEGER NOT NULL DEFAULT 0 CHECK(bonus_amount >= 0),
  bonus_before TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'todo' CHECK(status IN ('todo','in_progress','submitted','approved','changes_requested')),
  submitted_at TEXT,
  approved_at TEXT,
  bonus_awarded INTEGER NOT NULL DEFAULT 0 CHECK(bonus_awarded >= 0),
  bonus_override INTEGER NOT NULL DEFAULT 0 CHECK(bonus_override IN (0,1)),
  client_submitted_at TEXT,
  employee_note TEXT NOT NULL DEFAULT '',
  admin_note TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_tasks_employee ON tasks(employee_id,due_at);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);