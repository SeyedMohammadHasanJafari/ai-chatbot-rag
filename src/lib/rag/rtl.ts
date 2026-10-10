/**
 * Regular expression matching Persian, Arabic, and Hebrew Unicode blocks.
 */
const RTL_REGEX = /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF\u0590-\u05FF]/;

/**
 * Checks whether a given string begins with or is predominantly RTL (Persian / Arabic).
 */
export function isRtlText(text: string): boolean {
  if (!text) return false;

  // Trim and test the first 50 meaningful characters
  const sample = text.trim().slice(0, 50);
  return RTL_REGEX.test(sample);
}

/**
 * Returns dynamic dir and typography class based on text language detection.
 */
export function getDirectionStyle(text: string): {
  dir: "rtl" | "ltr";
  className: string;
} {
  const isRtl = isRtlText(text);
  return {
    dir: isRtl ? "rtl" : "ltr",
    className: isRtl ? "font-persian text-right" : "text-left",
  };
}
