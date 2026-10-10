import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { chunkText } from "../src/lib/rag/chunker";

describe("RAG Chunker - chunkText", () => {
  it("should return empty array for empty or whitespace-only text", () => {
    assert.deepEqual(chunkText(""), []);
    assert.deepEqual(chunkText("   \n\t  "), []);
  });

  it("should return single chunk if text is smaller than chunkSize", () => {
    const text = "Synapse RAG is a custom AI assistant platform.";
    const chunks = chunkText(text, { chunkSize: 1000 });
    assert.equal(chunks.length, 1);
    assert.equal(chunks[0].index, 0);
    assert.equal(chunks[0].content, text);
    assert.ok(chunks[0].tokenCount > 0);
  });

  it("should split long text into multiple chunks with overlap", () => {
    const sentence = "Artificial Intelligence is transforming enterprise knowledge management and productivity. ";
    const longText = sentence.repeat(25); // ~2250 chars
    const chunks = chunkText(longText, { chunkSize: 500, chunkOverlap: 100 });

    assert.ok(chunks.length > 2);
    for (let i = 0; i < chunks.length; i++) {
      assert.equal(chunks[i].index, i);
      assert.ok(chunks[i].content.length > 0);
    }
  });

  it("should respect Persian question marks and sentence boundaries", () => {
    const persianText =
      "آیا پایگاه دانش از زبان فارسی پشتیبانی می‌کند؟ بله، تمام مکالمات با ردیابی جهت متن و فونت مناسب نمایش داده می‌شوند. " +
      "آیا امکان خروجی گرفتن و اشتراک‌گذاری عمومی ربات وجود دارد؟ بله، از طریق ویجت جاوااسکریپت و لینک اختصاصی قابل دسترسی است. ".repeat(6);

    const chunks = chunkText(persianText, { chunkSize: 300, chunkOverlap: 50 });
    assert.ok(chunks.length >= 2);
    assert.ok(chunks[0].content.includes("فارسی"));
  });
});
