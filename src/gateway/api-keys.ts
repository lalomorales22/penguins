/**
 * API Key management for HTTP endpoints.
 *
 * Allows issuing, revoking, and authenticating per-user API keys that are
 * separate from the single shared gateway token/password.
 *
 * Keys are stored in `~/.penguins/api-keys.json` alongside the main config.
 * Each key has:
 *   - A hashed secret (SHA-256 of the raw key)
 *   - A human-readable label
 *   - An optional role (admin / operator / viewer)
 *   - Creation / last-used timestamps
 *   - Optional rate-limit overrides
 *   - Revoked flag
 */

import { randomBytes, createHash } from "node:crypto";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { safeEqualSecret } from "../security/secret-equal.js";

export type ApiKeyRole = "admin" | "operator" | "viewer";

export type ApiKeyRecord = {
  /** Unique ID (prefix of the key, e.g. "pk_abc12345"). */
  id: string;
  /** SHA-256 hex of the full key (we never store the raw key). */
  hash: string;
  /** Human-readable label. */
  label: string;
  /** Role for RBAC. */
  role: ApiKeyRole;
  /** ISO timestamp. */
  createdAt: string;
  /** ISO timestamp — updated on each successful auth. */
  lastUsedAt?: string;
  /** Revoked keys fail auth. */
  revoked: boolean;
  /** Optional per-key rate limit (requests per minute). */
  rateLimit?: number;
};

export type ApiKeyStore = {
  keys: ApiKeyRecord[];
};

const KEY_PREFIX = "pk_";
const KEY_BYTES = 32; // 256-bit random key

function hashKey(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

function generateRawKey(): string {
  return KEY_PREFIX + randomBytes(KEY_BYTES).toString("base64url");
}

function storeFilePath(stateDir: string): string {
  return join(stateDir, "api-keys.json");
}

function loadStore(stateDir: string): ApiKeyStore {
  const path = storeFilePath(stateDir);
  if (!existsSync(path)) {
    return { keys: [] };
  }
  try {
    const raw = readFileSync(path, "utf-8");
    const parsed = JSON.parse(raw) as ApiKeyStore;
    return { keys: Array.isArray(parsed.keys) ? parsed.keys : [] };
  } catch {
    return { keys: [] };
  }
}

function saveStore(stateDir: string, store: ApiKeyStore): void {
  const path = storeFilePath(stateDir);
  writeFileSync(path, JSON.stringify(store, null, 2), { mode: 0o600 });
}

// ── Public API ────────────────────────────────────────────────────────

export type CreateKeyResult = {
  /** The raw key — shown once, never stored. */
  rawKey: string;
  record: ApiKeyRecord;
};

export function createApiKey(
  stateDir: string,
  label: string,
  role: ApiKeyRole = "operator",
  rateLimit?: number,
): CreateKeyResult {
  const rawKey = generateRawKey();
  const hash = hashKey(rawKey);
  const id = rawKey.slice(0, KEY_PREFIX.length + 8); // "pk_" + 8 chars

  const record: ApiKeyRecord = {
    id,
    hash,
    label,
    role,
    createdAt: new Date().toISOString(),
    revoked: false,
    ...(rateLimit !== undefined ? { rateLimit } : {}),
  };

  const store = loadStore(stateDir);
  store.keys.push(record);
  saveStore(stateDir, store);

  return { rawKey, record };
}

export function listApiKeys(stateDir: string): ApiKeyRecord[] {
  return loadStore(stateDir).keys;
}

export function revokeApiKey(stateDir: string, id: string): boolean {
  const store = loadStore(stateDir);
  const key = store.keys.find((k) => k.id === id);
  if (!key) {
    return false;
  }
  key.revoked = true;
  saveStore(stateDir, store);
  return true;
}

export function deleteApiKey(stateDir: string, id: string): boolean {
  const store = loadStore(stateDir);
  const idx = store.keys.findIndex((k) => k.id === id);
  if (idx === -1) {
    return false;
  }
  store.keys.splice(idx, 1);
  saveStore(stateDir, store);
  return true;
}

export type AuthenticateResult = {
  ok: boolean;
  record?: ApiKeyRecord;
  reason?: string;
};

/**
 * Authenticate a raw API key.
 *
 * This uses constant-time comparison against each stored hash to prevent
 * timing attacks. It's O(n) in the number of keys, which is fine for
 * typical installations (< 100 keys).
 */
export function authenticateApiKey(stateDir: string, rawKey: string): AuthenticateResult {
  if (!rawKey || !rawKey.startsWith(KEY_PREFIX)) {
    return { ok: false, reason: "invalid key format" };
  }

  const candidateHash = hashKey(rawKey);
  const store = loadStore(stateDir);

  for (const key of store.keys) {
    if (safeEqualSecret(candidateHash, key.hash)) {
      if (key.revoked) {
        return { ok: false, reason: "key revoked" };
      }
      // Update last-used timestamp.
      key.lastUsedAt = new Date().toISOString();
      saveStore(stateDir, store);
      return { ok: true, record: key };
    }
  }

  return { ok: false, reason: "key not found" };
}

/**
 * Rotate an API key — revoke the old one and create a new one with the
 * same label and role.
 */
export function rotateApiKey(stateDir: string, id: string): CreateKeyResult | null {
  const store = loadStore(stateDir);
  const old = store.keys.find((k) => k.id === id);
  if (!old) {
    return null;
  }

  // Revoke old.
  old.revoked = true;
  saveStore(stateDir, store);

  // Create replacement.
  return createApiKey(stateDir, old.label, old.role, old.rateLimit);
}
