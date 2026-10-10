import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createKbSchema, updateKbSchema } from "../src/lib/validations/kb";
import { registerSchema } from "../src/lib/validations/auth";
import { env } from "../src/lib/env";

describe("Input Validation Schemas", () => {
  describe("createKbSchema", () => {
    it("should validate a correct Knowledge Base payload", () => {
      const validPayload = {
        name: "Acme Customer Service",
        description: "Official support documentation",
        prompt: "You are a customer service assistant. Cite all sources.",
        colorCode: "#06b6d4",
        isPublic: true,
      };

      const result = createKbSchema.safeParse(validPayload);
      assert.equal(result.success, true);
    });

    it("should reject names shorter than 2 characters", () => {
      const invalid = { name: "A" };
      const result = createKbSchema.safeParse(invalid);
      assert.equal(result.success, false);
    });

    it("should reject invalid hex color format", () => {
      const invalid = {
        name: "Valid Name",
        colorCode: "red", // Not a hex code
      };
      const result = createKbSchema.safeParse(invalid);
      assert.equal(result.success, false);
    });
  });

  describe("updateKbSchema", () => {
    it("should allow partial updates", () => {
      const partialUpdate = { name: "Updated Name" };
      const result = updateKbSchema.safeParse(partialUpdate);
      assert.equal(result.success, true);
    });
  });

  describe("registerSchema", () => {
    it("should accept valid registration details", () => {
      const valid = {
        name: "Alice Engineer",
        email: "alice@example.com",
        password: "securePassword123",
      };
      const result = registerSchema.safeParse(valid);
      assert.equal(result.success, true);
    });

    it("should reject passwords shorter than 6 characters", () => {
      const invalid = {
        email: "alice@example.com",
        password: "123",
      };
      const result = registerSchema.safeParse(invalid);
      assert.equal(result.success, false);
    });

    it("should reject invalid email format", () => {
      const invalid = {
        email: "not-an-email",
        password: "securePassword123",
      };
      const result = registerSchema.safeParse(invalid);
      assert.equal(result.success, false);
    });
  });

  describe("env validation", () => {
    it("should load environment variables safely without throwing", () => {
      assert.ok(typeof env === "object");
    });
  });
});
