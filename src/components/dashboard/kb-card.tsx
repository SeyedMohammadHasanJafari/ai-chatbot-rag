"use client";

import * as React from "react";
import { useState } from "react";
import Link from "next/link";
import {
  Bot,
  FileText,
  Layers,
  ArrowRight,
  Trash2,
  Globe,
  Lock,
} from "lucide-react";

interface KbCardProps {
  kb: {
    id: string;
    name: string;
    description?: string | null;
    colorCode: string;
    isPublic: boolean;
    createdAt: string | Date;
    _count?: {
      documents: number;
    };
    documents?: Array<{
      id: string;
      status: string;
      _count?: {
        chunks: number;
      };
    }>;
  };
  onDelete: (id: string) => Promise<void>;
}

export function KbCard({ kb, onDelete }: KbCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const documentCount = kb._count?.documents ?? kb.documents?.length ?? 0;
  const chunkCount =
    kb.documents?.reduce(
      (acc, doc) => acc + (doc._count?.chunks || 0),
      0
    ) || 0;

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!showConfirm) {
      setShowConfirm(true);
      return;
    }

    setIsDeleting(true);
    try {
      await onDelete(kb.id);
    } finally {
      setIsDeleting(false);
      setShowConfirm(false);
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-5 border border-slate-800/90 relative group hover:border-slate-700 transition-all flex flex-col justify-between overflow-hidden shadow-lg">
      {/* Top accent line */}
      <div
        className="absolute top-0 left-0 right-0 h-1 transition-opacity opacity-80 group-hover:opacity-100"
        style={{ backgroundColor: kb.colorCode }}
      />

      <div>
        {/* Top Badges */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-md"
              style={{ backgroundColor: kb.colorCode }}
            >
              <Bot className="w-4 h-4" />
            </div>
            {kb.isPublic ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border border-cyan-500/30 bg-cyan-950/40 text-cyan-300">
                <Globe className="w-3 h-3" />
                Public
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border border-slate-700 bg-slate-800/50 text-slate-400">
                <Lock className="w-3 h-3" />
                Private
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            {showConfirm ? (
              <div className="flex items-center gap-1 bg-red-950/80 border border-red-500/40 px-2 py-1 rounded-lg">
                <span className="text-[10px] text-red-200">Sure?</span>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="text-[10px] font-bold text-red-400 hover:text-white px-1.5 py-0.5 rounded bg-red-600/30 cursor-pointer"
                >
                  {isDeleting ? "..." : "Yes"}
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowConfirm(false);
                  }}
                  className="text-[10px] text-slate-400 hover:text-slate-200 px-1 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleDelete}
                className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-800/50 transition-colors cursor-pointer"
                title="Delete Knowledge Base"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Title and Description */}
        <h3 className="text-base font-bold text-slate-100 group-hover:text-white transition-colors mb-1.5 line-clamp-1">
          {kb.name}
        </h3>
        <p className="text-xs text-slate-400 leading-relaxed mb-4 line-clamp-2 min-h-[32px]">
          {kb.description || "Grounded assistant trained exclusively on custom files and web pages."}
        </p>

        {/* Metrics */}
        <div className="grid grid-cols-2 gap-2 py-2.5 px-3 rounded-xl bg-slate-900/60 border border-slate-800/80 mb-4">
          <div className="flex items-center gap-2">
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs text-slate-300">
              <strong className="text-slate-100">{documentCount}</strong> {documentCount === 1 ? "File" : "Files"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-xs text-slate-300">
              <strong className="text-slate-100">{chunkCount}</strong> Chunks
            </span>
          </div>
        </div>
      </div>

      {/* Action footer */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
        <Link
          href={`/dashboard/${kb.id}`}
          className="w-full py-2 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all group-hover:border group-hover:border-cyan-500/30"
        >
          <span>Manage Knowledge Base</span>
          <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
        </Link>
      </div>
    </div>
  );
}
