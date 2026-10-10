import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { isRtlText, getDirectionStyle } from "../src/lib/rag/rtl";

describe("RTL & Multilingual Direction Detection", () => {
  it("should return false for English and Latin strings", () => {
    assert.equal(isRtlText("Hello world! How does RAG work?"), false);
    assert.equal(isRtlText("1234567890"), false);
    assert.equal(isRtlText(""), false);
  });

  it("should correctly identify Persian queries", () => {
    assert.equal(isRtlText("سلام، لطفاً در مورد ساعات کاری توضیح دهید."), true);
    assert.equal(isRtlText("شرایط گارانتی و بازگشت وجه چیست؟"), true);
  });

  it("should correctly identify Arabic text", () => {
    assert.equal(isRtlText("مرحبا بكم في المساعد الذكي"), true);
  });

  it("should return proper direction style attributes", () => {
    const persianStyle = getDirectionStyle("پاسخ به سوال کاربر");
    assert.equal(persianStyle.dir, "rtl");
    assert.ok(persianStyle.className.includes("font-persian"));

    const englishStyle = getDirectionStyle("Answering user inquiry");
    assert.equal(englishStyle.dir, "ltr");
    assert.ok(englishStyle.className.includes("text-left"));
  });
});
