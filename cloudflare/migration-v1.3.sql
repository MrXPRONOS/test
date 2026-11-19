-- GW Suivi V1.3 : invitations directes par e-mail / WhatsApp, connexion par numéro
-- Exécuter une seule fois sur gw-suivi-production après la V1.2.
-- Préserve les comptes, tâches, invitations et sessions existants.
ALTER TABLE people ADD COLUMN phone TEXT;
ALTER TABLE accounts ADD COLUMN phone TEXT;
ALTER TABLE admin_invites ADD COLUMN phone TEXT;
ALTER TABLE people ADD COLUMN invite_code_hash TEXT;
ALTER TABLE people ADD COLUMN invite_expires_at INTEGER;
CREATE UNIQUE INDEX IF NOT EXISTS idx_people_phone_unique ON people(phone) WHERE phone IS NOT NULL AND phone<>'';
CREATE UNIQUE INDEX IF NOT EXISTS idx_accounts_phone_unique ON accounts(phone) WHERE phone IS NOT NULL AND phone<>'';
CREATE INDEX IF NOT EXISTS idx_admin_invite_token ON admin_invites(code_hash,expires_at);
CREATE INDEX IF NOT EXISTS idx_people_invite_token ON people(invite_code_hash,invite_expires_at);
CREATE INDEX IF NOT EXISTS idx_admin_invites_phone ON admin_invites(phone,expires_at);