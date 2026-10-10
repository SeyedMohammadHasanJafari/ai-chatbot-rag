import * as cheerio from "cheerio";
import mammoth from "mammoth";

/**
 * Validates whether a URL is safe to fetch (avoids SSRF to internal/private networks).
 */
export function isSafeUrl(rawUrl: string): boolean {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return false;
    }

    const hostname = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, "");
    // Block localhost and loopback
    if (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "::1" ||
      hostname === "0.0.0.0"
    ) {
      return false;
    }

    // Block AWS/Cloud metadata service
    if (hostname === "169.254.169.254") {
      return false;
    }

    // Block common private network ranges (10.x, 192.168.x, 172.16-31.x)
    if (
      hostname.startsWith("10.") ||
      hostname.startsWith("192.168.") ||
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname)
    ) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Extracts plain text from a PDF Buffer using unpdf (serverless/workerless PDF.js wrapper).
 */
export async function parsePdf(buffer: Buffer): Promise<string> {
  try {
    const { extractText } = await import("unpdf");
    const { text } = await extractText(new Uint8Array(buffer));
    
    // text is an array of strings per page
    const pages = Array.isArray(text) ? text : [text];
    const fullText = pages
      .map((p) => (typeof p === "string" ? p.trim() : ""))
      .filter(Boolean)
      .join("\n\n")
      .trim();

    if (!fullText) {
      throw new Error("No readable text found in PDF (the document might be scanned/image-only).");
    }

    return fullText;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("PDF parse error:", error);
    throw new Error(`Failed to parse PDF document: ${message}`);
  }
}

/**
 * Extracts raw text from a Microsoft Word (.docx) Buffer using mammoth.
 */
export async function parseDocx(buffer: Buffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value?.trim() || "";
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("DOCX parse error:", error);
    throw new Error(`Failed to parse DOCX document: ${message}`);
  }
}

/**
 * Reads plain text or markdown UTF-8 buffer.
 */
export function parseText(buffer: Buffer): string {
  try {
    return buffer.toString("utf-8").trim();
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Invalid UTF-8";
    throw new Error(`Failed to read text document: ${message}`);
  }
}

/**
 * Crawls a public website URL, strips HTML tags, scripts, and navigation, and extracts body text.
 */
export async function parseUrl(
  rawUrl: string
): Promise<{ title: string; content: string }> {
  if (!isSafeUrl(rawUrl)) {
    throw new Error(
      "Forbidden URL. Only public http/https websites are allowed for scraping."
    );
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s timeout

  try {
    const response = await fetch(rawUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "SynapseRAG-Bot/1.0 (+https://synapserag.ai; web scraper for custom knowledge assistant)",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Failed to fetch URL. HTTP status: ${response.status}`);
    }

    const contentType = response.headers.get("content-type") || "";
    if (
      !contentType.includes("text/html") &&
      !contentType.includes("text/plain") &&
      !contentType.includes("application/xhtml+xml")
    ) {
      throw new Error(`Unsupported content type at target URL: ${contentType}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Remove noise elements
    $("script, style, nav, footer, header, noscript, iframe, svg, [role='navigation'], [role='banner']").remove();

    const title =
      $("title").text().trim() ||
      $("h1").first().text().trim() ||
      new URL(rawUrl).hostname;

    // Extract text from main container or body
    const mainContent = $("main, article, #content, .content, body").first();
    const rawText = mainContent.length ? mainContent.text() : $("body").text();

    // Clean up excessive whitespace
    const cleanText = rawText
      .replace(/\r\n/g, "\n")
      .replace(/\t/g, " ")
      .replace(/ +/g, " ")
      .replace(/\n\s*\n/g, "\n\n")
      .trim();

    return {
      title,
      content: cleanText,
    };
  } catch (error: unknown) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Request to target URL timed out after 12 seconds.");
    }
    throw error;
  }
}
