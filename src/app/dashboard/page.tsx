"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  Bot,
  LogOut,
  Sparkles,
  Plus,
  Layers,
  FileText,
  Search,
  RefreshCw,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { CreateKbModal } from "@/components/dashboard/create-kb-modal";
import { KbCard } from "@/components/dashboard/kb-card";

interface KnowledgeBaseItem {
  id: string;
  name: string;
  description?: string | null;
  prompt: string;
  colorCode: string;
  isPublic: boolean;
  createdAt: string;
  _count?: {
    documents: number;
  };
  documents?: Array<{
    id: string;
    name: string;
    type: string;
    status: string;
    fileSize?: number;
    _count?: {
      chunks: number;
    };
  }>;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [kbs, setKbs] = useState<KnowledgeBaseItem[]>([]);
  const [loadingKbs, setLoadingKbs] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  const fetchKnowledgeBases = useCallback(async () => {
    try {
      setLoadingKbs(true);
      const res = await fetch("/api/kb");
      if (res.ok) {
        const data = await res.json();
        setKbs(data.knowledgeBases || []);
      }
    } catch (err) {
      console.error("Failed to load KBs", err);
    } finally {
      setLoadingKbs(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    if (session) {
      queueMicrotask(() => {
        if (!ignore) {
          fetchKnowledgeBases();
        }
      });
    }
    return () => {
      ignore = true;
    };
  }, [session, fetchKnowledgeBases]);

  const handleDeleteKb = async (id: string) => {
    const res = await fetch(`/api/kb/${id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setKbs((prev) => prev.filter((item) => item.id !== id));
    }
  };

  const handleCreateSuccess = (newKb: KnowledgeBaseItem) => {
    setKbs((prev) => [newKb, ...prev]);
  };

  // Metrics computation
  const totalKbs = kbs.length;
  const totalDocs = useMemo(() => {
    return kbs.reduce(
      (acc, kb) => acc + (kb._count?.documents || kb.documents?.length || 0),
      0
    );
  }, [kbs]);

  const totalChunks = useMemo(() => {
    return kbs.reduce((acc, kb) => {
      const kbChunks =
        kb.documents?.reduce(
          (sub, doc) => sub + (doc._count?.chunks || 0),
          0
        ) || 0;
      return acc + kbChunks;
    }, 0);
  }, [kbs]);

  const filteredKbs = useMemo(() => {
    if (!searchQuery.trim()) return kbs;
    const q = searchQuery.toLowerCase();
    return kbs.filter(
      (k) =>
        k.name.toLowerCase().includes(q) ||
        (k.description && k.description.toLowerCase().includes(q))
    );
  }, [kbs, searchQuery]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-slate-400">
            Loading Synapse Workspace...
          </span>
        </div>
      </div>
    );
  }

  if (!session) return null;

  const isDemo = session.user?.isDemo;

  return (
    <div className="min-h-screen flex flex-col bg-grid-pattern selection:bg-cyan-500/20">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-[var(--background)]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-cyan-500/20">
                <Bot className="w-5 h-5" />
              </div>
              <span className="font-bold tracking-tight text-lg text-slate-100">
                Synapse<span className="text-cyan-400">RAG</span>
              </span>
            </Link>
            <span className="hidden sm:inline-block text-xs px-2.5 py-0.5 rounded-full border border-slate-700 bg-slate-800/50 text-slate-300">
              Workspace
            </span>
          </div>

          <div className="flex items-center gap-3">
            {isDemo && (
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full border border-amber-500/30 bg-amber-950/30 text-amber-300 text-xs font-medium">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Demo Review Mode</span>
              </div>
            )}
            <ThemeToggle />
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="p-2 rounded-lg border border-slate-700/60 bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-8">
        {/* Workspace Banner */}
        <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-slate-800 mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100">
                  Welcome back, {session.user?.name || "Architect"}
                </h1>
                {isDemo && (
                  <span className="px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider rounded-md border border-cyan-500/40 text-cyan-400 bg-cyan-950/40">
                    Demo Mode
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-400">
                Manage your RAG assistants, configure vector data ingestion, and deploy custom widgets.
              </p>
            </div>

            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer transform hover:-translate-y-0.5"
            >
              <Plus className="w-4 h-4" />
              <span>Create Knowledge Base</span>
            </button>
          </div>
        </div>

        {/* Metrics Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="glass-panel p-5 rounded-2xl border border-slate-800/80 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-cyan-950/60 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-100">{totalKbs}</div>
              <div className="text-xs text-slate-400">Active Assistants</div>
            </div>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-slate-800/80 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-950/60 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-100">{totalDocs}</div>
              <div className="text-xs text-slate-400">Uploaded Documents</div>
            </div>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-slate-800/80 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-950/60 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-100">{totalChunks}</div>
              <div className="text-xs text-slate-400">Vector Embeddings</div>
            </div>
          </div>
        </div>

        {/* Search and Action Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search knowledge assistants..."
              className="w-full bg-slate-900/80 border border-slate-700/80 rounded-xl pl-9 pr-4 py-2 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            />
          </div>

          <button
            onClick={fetchKnowledgeBases}
            className="p-2 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors flex items-center justify-center gap-2 text-xs cursor-pointer"
            title="Refresh Knowledge Bases"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingKbs ? "animate-spin" : ""}`} />
            <span>Sync</span>
          </button>
        </div>

        {/* Knowledge Bases Grid */}
        {loadingKbs ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="glass-panel p-5 rounded-2xl border border-slate-800/80 animate-pulse h-56"
              >
                <div className="w-8 h-8 rounded-xl bg-slate-800 mb-4" />
                <div className="h-5 w-3/4 bg-slate-800 rounded mb-2" />
                <div className="h-3 w-full bg-slate-800/60 rounded mb-1" />
                <div className="h-3 w-1/2 bg-slate-800/60 rounded" />
              </div>
            ))}
          </div>
        ) : filteredKbs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredKbs.map((kb) => (
              <KbCard key={kb.id} kb={kb} onDelete={handleDeleteKb} />
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="glass-panel p-10 rounded-2xl border border-dashed border-slate-800 text-center flex flex-col items-center justify-center my-6">
            <div className="w-14 h-14 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-4">
              <Bot className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-100 mb-1">
              {searchQuery ? "No matching assistants found" : "No Knowledge Bases yet"}
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mb-6">
              {searchQuery
                ? `No assistants matched "${searchQuery}". Try a different keyword.`
                : "Create your first RAG knowledge assistant, upload documentation, and test answers with strict citations."}
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 flex items-center gap-2 cursor-pointer transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Create Assistant Now</span>
            </button>
          </div>
        )}
      </main>

      {/* Create Modal */}
      <CreateKbModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />
    </div>
  );
}
