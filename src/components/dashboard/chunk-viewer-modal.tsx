"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Layers, Copy, Check } from "lucide-react";
import { isRtlText } from "@/lib/rag/rtl";

interface ChunkItem {
  id: string;
  chunkIndex: number;
  content: string;
  tokenCount: number | null;
  createdAt: string;
}

interface ChunkViewerModalProps {
  isOpen: boolean;
  kbId: string;
  documentId: string | null;
  documentName: string;
  onClose: () => void;
}

export function ChunkViewerModal({
  isOpen,
  kbId,
  documentId,
  documentName,
  onClose,
}: ChunkViewerModalProps) {
  const [chunks, setChunks] = useState<ChunkItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  useEffect(() => {
    let ignore = false;
    if (isOpen && documentId) {
      queueMicrotask(async () => {
        if (ignore) return;
        setLoading(true);
        try {
          const res = await fetch(`/api/kb/${kbId}/documents/${documentId}/chunks`);
          const data = await res.json();
          if (!ignore) {
            setChunks(data.chunks || []);
          }
        } catch (err) {
          console.error("Failed to load chunks:", err);
        } finally {
          if (!ignore) {
            setLoading(false);
          }
        }
      });
    }
    return () => {
      ignore = true;
    };
  }, [isOpen, kbId, documentId]);

  if (!isOpen || !documentId) return null;

  const copyChunk = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const isDocPersian = isRtlText(documentName);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-md"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-700/80 z-10 max-h-[85vh] flex flex-col text-slate-800 dark:text-slate-100"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-cyan-100 dark:bg-cyan-950/80 border border-cyan-300 dark:border-cyan-500/30 flex items-center justify-center text-cyan-600 dark:text-cyan-400 shrink-0">
                <Layers className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 truncate">
                  <span>Inspect Vector Chunks: </span>
                  <span className={isDocPersian ? "font-persian" : ""}>{documentName}</span>
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {chunks.length} overlapping text segments extracted for semantic search
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Chunks List */}
          <div className="flex-1 overflow-y-auto py-4 space-y-3 pr-1">
            {loading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
                <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs">Fetching chunk data...</span>
              </div>
            ) : chunks.length > 0 ? (
              chunks.map((c) => {
                const isChunkPersian = isRtlText(c.content);
                return (
                  <div
                    key={c.id}
                    className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 transition-all text-xs"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-cyan-100 dark:bg-cyan-950/60 border border-cyan-300 dark:border-cyan-500/30 text-cyan-800 dark:text-cyan-300 font-mono text-[10px] font-bold">
                          Chunk #{c.chunkIndex + 1}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {c.content.length} chars • ~{c.tokenCount || Math.ceil(c.content.length / 4)} tokens
                        </span>
                      </div>

                      <button
                        onClick={() => copyChunk(c.content, c.chunkIndex)}
                        className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-300 cursor-pointer"
                      >
                        {copiedIndex === c.chunkIndex ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-500 dark:text-emerald-400" />
                            <span className="text-emerald-600 dark:text-emerald-400">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>

                    <p
                      dir={isChunkPersian ? "rtl" : "ltr"}
                      className={`text-slate-800 dark:text-slate-300 ${
                        isChunkPersian
                          ? "font-persian text-right text-xs leading-relaxed"
                          : "font-mono text-left text-[11px] leading-relaxed"
                      } bg-white dark:bg-slate-900/60 p-3 rounded-lg border border-slate-200 dark:border-slate-800/40 whitespace-pre-wrap`}
                    >
                      {c.content}
                    </p>
                  </div>
                );
              })
            ) : (
              <div className="py-8 text-center text-xs text-slate-500">
                No chunks found for this document.
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
