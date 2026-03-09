import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  createApiKey,
  listApiKeys,
  revokeApiKey,
  deleteApiKey,
  authenticateApiKey,
  rotateApiKey,
} from "./api-keys.js";

describe("API Key Management", () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "penguins-apikeys-"));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("creates a key and returns the raw key", () => {
    const { rawKey, record } = createApiKey(dir, "test-key");
    expect(rawKey).toMatch(/^pk_/);
    expect(record.label).toBe("test-key");
    expect(record.role).toBe("operator");
    expect(record.revoked).toBe(false);
    expect(record.id).toMatch(/^pk_/);
  });

  it("lists created keys", () => {
    createApiKey(dir, "key-1");
    createApiKey(dir, "key-2", "admin");
    const keys = listApiKeys(dir);
    expect(keys).toHaveLength(2);
    expect(keys[0].label).toBe("key-1");
    expect(keys[1].role).toBe("admin");
  });

  it("authenticates with a valid raw key", () => {
    const { rawKey } = createApiKey(dir, "auth-test");
    const result = authenticateApiKey(dir, rawKey);
    expect(result.ok).toBe(true);
    expect(result.record?.label).toBe("auth-test");
    expect(result.record?.lastUsedAt).toBeTruthy();
  });

  it("rejects an invalid key", () => {
    createApiKey(dir, "auth-test");
    const result = authenticateApiKey(dir, "pk_totally-wrong-key");
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("key not found");
  });

  it("rejects a revoked key", () => {
    const { rawKey, record } = createApiKey(dir, "revoke-test");
    revokeApiKey(dir, record.id);
    const result = authenticateApiKey(dir, rawKey);
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("key revoked");
  });

  it("deletes a key", () => {
    const { record } = createApiKey(dir, "delete-test");
    expect(listApiKeys(dir)).toHaveLength(1);
    deleteApiKey(dir, record.id);
    expect(listApiKeys(dir)).toHaveLength(0);
  });

  it("rotates a key", () => {
    const { rawKey: oldKey, record: oldRecord } = createApiKey(dir, "rotate-test", "admin");
    const result = rotateApiKey(dir, oldRecord.id);
    expect(result).not.toBeNull();

    // Old key should be revoked.
    const oldAuth = authenticateApiKey(dir, oldKey);
    expect(oldAuth.ok).toBe(false);

    // New key should work.
    const newAuth = authenticateApiKey(dir, result!.rawKey);
    expect(newAuth.ok).toBe(true);
    expect(newAuth.record?.role).toBe("admin");
    expect(newAuth.record?.label).toBe("rotate-test");
  });

  it("rejects non-pk_ prefixed keys", () => {
    const result = authenticateApiKey(dir, "not-a-valid-key");
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("invalid key format");
  });

  it("handles empty store gracefully", () => {
    const keys = listApiKeys(dir);
    expect(keys).toEqual([]);
  });
});
