import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { isSafeUrl, parseText } from "../src/lib/rag/parsers";

describe("Document Parsers & SSRF Security Guard", () => {
  describe("isSafeUrl - SSRF Protection", () => {
    it("should allow standard public HTTPS and HTTP URLs", () => {
      assert.equal(isSafeUrl("https://docs.github.com/en"), true);
      assert.equal(isSafeUrl("http://example.org/about"), true);
    });

    it("should reject non-http/https protocols", () => {
      assert.equal(isSafeUrl("file:///etc/passwd"), false);
      assert.equal(isSafeUrl("ftp://ftp.example.com"), false);
      assert.equal(isSafeUrl("javascript:alert(1)"), false);
    });

    it("should reject localhost and loopback addresses", () => {
      assert.equal(isSafeUrl("http://localhost:3000"), false);
      assert.equal(isSafeUrl("http://127.0.0.1:8080"), false);
      assert.equal(isSafeUrl("http://0.0.0.0:5432"), false);
      assert.equal(isSafeUrl("http://[::1]:3000"), false);
    });

    it("should reject cloud metadata endpoints", () => {
      assert.equal(isSafeUrl("http://169.254.169.254/latest/meta-data"), false);
    });

    it("should reject private RFC-1918 subnets", () => {
      assert.equal(isSafeUrl("http://10.0.0.1/admin"), false);
      assert.equal(isSafeUrl("http://192.168.1.1/router"), false);
      assert.equal(isSafeUrl("http://172.16.0.5/api"), false);
      assert.equal(isSafeUrl("http://172.31.255.255"), false);
    });

    it("should reject invalid URL strings", () => {
      assert.equal(isSafeUrl("not-a-valid-url"), false);
      assert.equal(isSafeUrl(""), false);
    });
  });

  describe("parseText - Plain Text & Markdown parsing", () => {
    it("should decode UTF-8 text buffer properly", () => {
      const buffer = Buffer.from("Hello world from text file", "utf-8");
      assert.equal(parseText(buffer), "Hello world from text file");
    });

    it("should decode Persian text correctly without character loss", () => {
      const persianStr = "پایگاه دانش اسناد سازمان";
      const buffer = Buffer.from(persianStr, "utf-8");
      assert.equal(parseText(buffer), persianStr);
    });
  });
});
