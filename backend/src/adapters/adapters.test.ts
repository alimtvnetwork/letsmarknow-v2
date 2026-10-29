import { describe, it, expect, beforeEach } from "vitest";
import { MemoryRateLimiter } from "./memoryRateLimiter.js";
import { MemoryIdempotencyStore } from "./memoryIdempotencyStore.js";
import { LocalFileStorage } from "./localFileStorage.js";
import { ConsoleMailer } from "./consoleMailer.js";
import path from "node:path";
import os from "node:os";

describe("Development Adapters", () => {
  describe("MemoryRateLimiter", () => {
    let limiter: MemoryRateLimiter;

    beforeEach(() => {
      limiter = new MemoryRateLimiter();
    });

    it("should allow requests under the limit", async () => {
      const res1 = await limiter.consume("user-1", 5, 60);
      expect(res1.allowed).toBe(true);
      expect(res1.remaining).toBe(4);

      const res2 = await limiter.consume("user-1", 5, 60);
      expect(res2.allowed).toBe(true);
      expect(res2.remaining).toBe(3);
    });

    it("should block requests when limit is exhausted", async () => {
      for (let i = 0; i < 3; i++) {
        await limiter.consume("user-2", 3, 60);
      }

      const blocked = await limiter.consume("user-2", 3, 60);
      expect(blocked.allowed).toBe(false);
      expect(blocked.remaining).toBe(0);
      expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
    });

    it("should allow resetting buckets", async () => {
      for (let i = 0; i < 2; i++) {
        await limiter.consume("user-3", 2, 60);
      }
      expect((await limiter.consume("user-3", 2, 60)).allowed).toBe(false);

      await limiter.reset("user-3");
      const afterReset = await limiter.consume("user-3", 2, 60);
      expect(afterReset.allowed).toBe(true);
    });
  });

  describe("MemoryIdempotencyStore", () => {
    let store: MemoryIdempotencyStore;

    beforeEach(() => {
      store = new MemoryIdempotencyStore();
    });

    it("should store and retrieve cached response", async () => {
      const key = "0190a4f1-6c5e-7c2a-9b3f-1234567890ab";
      await store.set("acc-1", key, {
        statusCode: 201,
        headers: {},
        body: { id: "item-123" },
        requestPayloadHash: "hash-abc",
      });

      const cached = await store.get("acc-1", key);
      expect(cached).not.toBeNull();
      expect(cached?.statusCode).toBe(201);
      expect(cached?.requestPayloadHash).toBe("hash-abc");
      expect(cached?.body).toEqual({ id: "item-123" });
    });

    it("should return null for expired records", async () => {
      const key = "expired-key";
      // Set TTL of -1 seconds (already expired)
      await store.set(
        "acc-1",
        key,
        {
          statusCode: 200,
          headers: {},
          body: { ok: true },
          requestPayloadHash: "hash-xyz",
        },
        -1
      );

      const cached = await store.get("acc-1", key);
      expect(cached).toBeNull();
    });
  });

  describe("LocalFileStorage", () => {
    const testDir = path.join(os.tmpdir(), `lmn-test-storage-${Date.now()}`);
    const storage = new LocalFileStorage({ baseDir: testDir });

    it("should upload, retrieve, and delete files", async () => {
      const filePath = "favicons/test-icon.png";
      const content = Buffer.from("mock-png-data");

      const url = await storage.upload(filePath, content);
      expect(url).toContain("favicons/test-icon.png");

      const retrieved = await storage.get(filePath);
      expect(retrieved).not.toBeNull();
      expect(retrieved?.toString()).toBe("mock-png-data");

      await storage.delete(filePath);
      const afterDelete = await storage.get(filePath);
      expect(afterDelete).toBeNull();
    });
  });

  describe("ConsoleMailer", () => {
    let mailer: ConsoleMailer;

    beforeEach(() => {
      mailer = new ConsoleMailer();
    });

    it("should capture verification email in test memory", async () => {
      await mailer.sendVerificationEmail("alice@example.com", "verify-token-123");
      const emails = mailer.getSentEmails();
      expect(emails.length).toBe(1);
      expect(emails[0].to).toBe("alice@example.com");
      expect(emails[0].text).toContain("verify-token-123");
    });

    it("should capture org invite email with token", async () => {
      await mailer.sendOrgInviteEmail(
        "bob@example.com",
        "Design Studio",
        "invite-xyz-456"
      );
      const emails = mailer.getSentEmails();
      expect(emails.length).toBe(1);
      expect(emails[0].subject).toContain("Design Studio");
      expect(emails[0].text).toContain("invite-xyz-456");
    });
  });
});
