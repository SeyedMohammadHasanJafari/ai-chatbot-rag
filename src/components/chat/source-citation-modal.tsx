"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, FileText, Link2, Copy, Check, Sparkles } from "lucide-react";
import { isRtlText } from "@/lib/rag/rtl";

export interface CitationItem {
  id: string;
  label: string;
  documentName: string;
  documentType: string;
  snippet: string;
  similarity: number;
}

interface SourceCitationModalProps {
  citation: CitationItem | null;
  onClose: () => void;
}

export function SourceCitationModal({
  citation,
  onClose,
}: SourceCitationModalProps) {
  const [copied, setCopied] = React.useState(false);

  if (!citation) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(citation.snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const similarityPercent = Math.min(
    100,
    Math.max(1, Math.round(citation.similarity * 100))
  );

  const isDocNameRtl = isRtlText(citation.documentName);
  const isSnippetRtl = isRtlText(citation.snippet);
  const isPersian = isDocNameRtl || isSnippetRtl;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-md"
        />

        {/* Modal Dialog */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 z-10 text-slate-800 dark:text-slate-100"
        >
          {/* Top highlight bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-500 rounded-t-2xl" />

          {/* Header */}
          <div className={`flex items-center ${isPersian ? "flex-row-reverse" : "flex-row"} justify-between pb-4 border-b border-slate-200 dark:border-slate-800`}>
            <div className={`flex items-center gap-2.5 min-w-0 ${isPersian ? "flex-row-reverse" : "flex-row"}`}>
              <div className="w-8 h-8 rounded-lg bg-cyan-100/80 dark:bg-cyan-950/80 border border-cyan-300/60 dark:border-cyan-500/30 flex items-center justify-center text-cyan-600 dark:text-cyan-400 shrink-0">
                {citation.documentType === "URL" ? (
                  <Link2 className="w-4 h-4" />
                ) : (
                  <FileText className="w-4 h-4" />
                )}
              </div>
              <div className="min-w-0">
                <div className={`flex items-center gap-2 ${isPersian ? "flex-row-reverse" : "flex-row"}`}>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-cyan-100/80 dark:bg-cyan-950/60 border border-cyan-300/60 dark:border-cyan-500/30 text-cyan-800 dark:text-cyan-300 font-bold shrink-0">
                    {citation.label}
                  </span>
                  <span
                    dir={isDocNameRtl ? "rtl" : "ltr"}
                    className={`text-xs font-semibold text-slate-800 dark:text-slate-100 truncate ${isDocNameRtl ? "font-persian text-right" : "text-left"
                      }`}
                  >
                    {citation.documentName}
                  </span>
                </div>
                <div
                  dir={isPersian ? "rtl" : "ltr"}
                  className={`flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 ${isPersian ? "font-persian" : ""
                    }`}
                >
                  <span>
                    {isPersian ? `نوع فایل: ${citation.documentType}` : `Type: ${citation.documentType}`}
                  </span>
                  <span>•</span>
                  <span className="text-cyan-600 dark:text-cyan-400 font-semibold flex items-center gap-0.5">
                    <Sparkles className="w-3 h-3" />
                    {isPersian
                      ? `${similarityPercent}٪ ارتباط معنایی`
                      : `${similarityPercent}% Semantic Relevance`}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title={isPersian ? "بستن" : "Close"}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body Content */}
          <div className="py-4">
            <div className={`flex items-center justify-between mb-2.5 ${isPersian ? "flex-row-reverse" : "flex-row"}`}>
              <span className={`text-xs font-semibold text-slate-700 dark:text-slate-300 ${isPersian ? "font-persian" : ""}`}>
                {isPersian ? "تکه متن استخراج‌شده از منبع:" : "Exact Grounded Excerpt Retrieved:"}
              </span>
              <button
                onClick={handleCopy}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-[11px] text-slate-600 hover:text-cyan-700 dark:text-slate-300 dark:hover:text-cyan-300 hover:border-cyan-300 dark:hover:border-cyan-500/50 transition-all cursor-pointer shadow-2xs ${isPersian ? "font-persian flex-row-reverse" : ""
                  }`}
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                      {isPersian ? "کپی شد!" : "Copied"}
                    </span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>{isPersian ? "کپی تکه متن" : "Copy Excerpt"}</span>
                  </>
                )}
              </button>
            </div>

            <div
              dir={isSnippetRtl ? "rtl" : "ltr"}
              className={`p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 leading-relaxed max-h-64 overflow-y-auto whitespace-pre-wrap selection:bg-cyan-500/30 ${isSnippetRtl
                ? "font-persian text-right text-slate-800 dark:text-slate-200 text-xs sm:text-sm"
                : "font-mono text-left text-slate-800 dark:text-slate-200 text-xs"
                }`}
            >
              {citation.snippet}
            </div>

            <p
              dir={isPersian ? "rtl" : "ltr"}
              className={`text-[11px] text-slate-500 dark:text-slate-400 mt-3 leading-relaxed ${isPersian ? "font-persian text-right" : "text-left"
                }`}
            >
              {isPersian
                ? "این قطعه مستند مستقیماً از وکتور دیتابیس بازیابی شده و به عنوان سند تاییدشده جهت جلوگیری از هرگونه پاسخ نادرست به هوش مصنوعی تحویل داده شده است."
                : "This verified passage was retrieved from your vector index via Cosine Distance and provided directly to the language model to guarantee a hallucination-free response."}
            </p>
          </div>

          <div className={`pt-3 border-t border-slate-200 dark:border-slate-800 flex ${isPersian ? "justify-start" : "justify-end"}`}>
            <button
              type="button"
              onClick={onClose}
              className={`px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-all cursor-pointer shadow-xs active:scale-95 ${isPersian ? "font-persian" : ""
                }`}
            >
              {isPersian ? "بستن" : "Close"}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
