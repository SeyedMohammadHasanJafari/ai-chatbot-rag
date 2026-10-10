export interface TextChunk {
  index: number;
  content: string;
  tokenCount: number;
}

export interface ChunkOptions {
  chunkSize?: number; // Target character length per chunk (default: 1000)
  chunkOverlap?: number; // Overlapping character count (default: 200)
}

/**
 * Splits input text into overlapping chunks respecting paragraph, sentence, and word boundaries.
 */
export function chunkText(
  text: string,
  options: ChunkOptions = {}
): TextChunk[] {
  const { chunkSize = 1000, chunkOverlap = 200 } = options;

  if (!text || !text.trim()) {
    return [];
  }

  const cleanedText = text.trim();
  if (cleanedText.length <= chunkSize) {
    return [
      {
        index: 0,
        content: cleanedText,
        tokenCount: Math.ceil(cleanedText.length / 4),
      },
    ];
  }

  const chunks: TextChunk[] = [];
  let startIndex = 0;
  let chunkIndex = 0;

  while (startIndex < cleanedText.length) {
    let endIndex = startIndex + chunkSize;

    if (endIndex >= cleanedText.length) {
      const slice = cleanedText.slice(startIndex).trim();
      if (slice.length > 0) {
        chunks.push({
          index: chunkIndex,
          content: slice,
          tokenCount: Math.ceil(slice.length / 4),
        });
      }
      break;
    }

    // Attempt to break at natural boundaries near endIndex
    const lookbackWindow = Math.min(250, chunkSize / 2);
    const searchArea = cleanedText.slice(endIndex - lookbackWindow, endIndex);

    // Look for paragraph breaks first, then sentence breaks, then space
    const paragraphBreak = searchArea.lastIndexOf("\n\n");
    const newlineBreak = searchArea.lastIndexOf("\n");
    const sentenceBreak = Math.max(
      searchArea.lastIndexOf(". "),
      searchArea.lastIndexOf("? "),
      searchArea.lastIndexOf("! "),
      searchArea.lastIndexOf("؟ ")
    );
    const spaceBreak = searchArea.lastIndexOf(" ");

    let splitOffset = -1;
    if (paragraphBreak !== -1) {
      splitOffset = paragraphBreak + 2;
    } else if (sentenceBreak !== -1) {
      splitOffset = sentenceBreak + 2;
    } else if (newlineBreak !== -1) {
      splitOffset = newlineBreak + 1;
    } else if (spaceBreak !== -1) {
      splitOffset = spaceBreak + 1;
    }

    if (splitOffset !== -1) {
      endIndex = endIndex - lookbackWindow + splitOffset;
    }

    const chunkContent = cleanedText.slice(startIndex, endIndex).trim();

    if (chunkContent.length > 0) {
      chunks.push({
        index: chunkIndex,
        content: chunkContent,
        tokenCount: Math.ceil(chunkContent.length / 4),
      });
      chunkIndex++;
    }

    // Step forward by (endIndex - chunkOverlap)
    const nextStart = endIndex - chunkOverlap;
    startIndex = nextStart > startIndex ? nextStart : endIndex;
  }

  return chunks;
}
