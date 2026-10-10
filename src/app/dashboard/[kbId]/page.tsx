"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, use, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Bot,
  Database,
  MessageSquare,
  Share2,
  Settings,
  Globe,
  Lock,
  ExternalLink,
  Save,
  Trash2,
  FileText,
  FileCode,
  Link2,
  Check,
  Copy,
  Layers,
  AlertTriangle,
  Upload,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { ACCENT_COLORS } from "@/lib/constants/personas";
import { FileUploader } from "@/components/dashboard/file-uploader";
import { UrlScraper } from "@/components/dashboard/url-scraper";
import { ChunkViewerModal } from "@/components/dashboard/chunk-viewer-modal";
import { ChatInterface } from "@/components/chat/chat-interface";
import { isRtlText } from "@/lib/rag/rtl";

type TabType = "sources" | "playground" | "embed" | "settings";
type IngestionMode = "upload" | "scrape";

interface DocumentItem {
  id: string;
  name: string;
  type: string;
  status: string;
  fileSize?: number | null;
  errorMessage?: string | null;
  createdAt: string;
  _count?: {
    chunks: number;
  };
}

interface KnowledgeBaseDetails {
  id: string;
  name: string;
  description?: string | null;
  prompt: string;
  colorCode: string;
  isPublic: boolean;
  createdAt: string;
  documents: DocumentItem[];
  _count?: {
    documents: number;
  };
}

export default function KnowledgeBaseDetailsPage({
  params,
}: {
  params: Promise<{ kbId: string }>;
}) {
  const resolvedParams = use(params);
  const kbId = resolvedParams.kbId;

  const { data: session, status: authStatus } = useSession();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<TabType>("sources");
  const [kb, setKb] = useState<KnowledgeBaseDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Edit settings form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [prompt, setPrompt] = useState("");
  const [colorCode, setColorCode] = useState("#06b6d4");
  const [isPublic, setIsPublic] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.push("/login");
    }
  }, [authStatus, router]);

  const fetchKbDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch(`/api/kb/${kbId}`);
      if (!res.ok) {
        if (res.status === 404) throw new Error("Knowledge Base not found");
        throw new Error("Failed to load Knowledge Base details");
      }
      const data = await res.json();
      setKb(data.knowledgeBase);
      setName(data.knowledgeBase.name);
      setDescription(data.knowledgeBase.description || "");
      setPrompt(data.knowledgeBase.prompt);
      setColorCode(data.knowledgeBase.colorCode);
      setIsPublic(data.knowledgeBase.isPublic);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An error occurred");
      }
    } finally {
      setLoading(false);
    }
  }, [kbId]);

  const [ingestionMode, setIngestionMode] = useState<IngestionMode>("upload");
  const [selectedDocForChunks, setSelectedDocForChunks] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [deletingDocId, setDeletingDocId] = useState<string | null>(null);

  const handleDeleteDocument = async (docId: string) => {
    if (!confirm("Are you sure you want to remove this document and its vector chunks?")) {
      return;
    }

    try {
      setDeletingDocId(docId);
      const res = await fetch(`/api/kb/${kbId}/documents/${docId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setKb((prev) =>
          prev
            ? {
                ...prev,
                documents: prev.documents.filter((d) => d.id !== docId),
              }
            : null
        );
      } else {
        alert("Failed to delete document.");
      }
    } catch {
      alert("Error deleting document.");
    } finally {
      setDeletingDocId(null);
    }
  };

  useEffect(() => {
    let ignore = false;
    if (session && kbId) {
      queueMicrotask(() => {
        if (!ignore) {
          fetchKbDetails();
        }
      });
    }
    return () => {
      ignore = true;
    };
  }, [session, kbId, fetchKbDetails]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    setSaveSuccess(false);
    setError("");

    try {
      const res = await fetch(`/api/kb/${kbId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          prompt,
          colorCode,
          isPublic,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update Knowledge Base");
      }

      setKb((prev) => (prev ? { ...prev, ...data.knowledgeBase } : null));
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to update settings");
      }
    } finally {
      setSavingSettings(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to permanently delete this Knowledge Base? All documents and vector embeddings will be erased.")) {
      return;
    }

    try {
      const res = await fetch(`/api/kb/${kbId}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/dashboard");
      }
    } catch {
      alert("Failed to delete Knowledge Base");
    }
  };

  const copyToClipboard = (text: string, type: "link" | "snippet") => {
    navigator.clipboard.writeText(text);
    if (type === "link") {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } else {
      setCopiedSnippet(true);
      setTimeout(() => setCopiedSnippet(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-slate-400">Loading Assistant Workspace...</span>
        </div>
      </div>
    );
  }

  if (error || !kb) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)] px-4">
        <div className="glass-panel p-8 rounded-2xl border border-red-500/30 text-center max-w-md">
          <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-slate-100 mb-2">Error</h2>
          <p className="text-xs text-slate-400 mb-6">{error || "Assistant not found"}</p>
          <Link
            href="/dashboard"
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const publicUrl = typeof window !== "undefined" ? `${window.location.origin}/bot/${kb.id}` : `/bot/${kb.id}`;
  const embedCode = `<script src="${typeof window !== "undefined" ? window.location.origin : ""}/widget.js" data-kb-id="${kb.id}" defer></script>`;

  return (
    <div className="min-h-screen flex flex-col bg-grid-pattern selection:bg-cyan-500/20">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-[var(--background)]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="p-1.5 rounded-lg border border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
              title="Return to Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs shadow-md"
                style={{ backgroundColor: kb.colorCode }}
              >
                <Bot className="w-4 h-4" />
              </div>
              <span className="font-bold text-sm sm:text-base text-slate-100 truncate max-w-[200px] sm:max-w-sm">
                {kb.name}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={`/bot/${kb.id}`}
              target="_blank"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-cyan-500/40 bg-cyan-950/40 text-cyan-300 text-xs font-medium hover:bg-cyan-900/50 transition-colors"
            >
              <span>Test Public View</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6">
        {/* Assistant Header Card */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 mb-6 relative overflow-hidden">
          <div
            className="absolute top-0 left-0 right-0 h-1.5"
            style={{ backgroundColor: kb.colorCode }}
          />
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5 mb-1.5">
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-100">
                  {kb.name}
                </h1>
                {kb.isPublic ? (
                  <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full border border-cyan-500/30 bg-cyan-950/40 text-cyan-300">
                    <Globe className="w-3 h-3" />
                    Public Assistant
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full border border-slate-700 bg-slate-800/50 text-slate-400">
                    <Lock className="w-3 h-3" />
                    Private Assistant
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 max-w-2xl">
                {kb.description || "Grounded assistant trained exclusively on custom files and web pages."}
              </p>
            </div>

            {/* Quick Metrics */}
            <div className="flex items-center gap-3">
              <div className="px-3.5 py-2 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
                <div className="text-xs text-slate-400">Documents</div>
                <div className="text-sm font-bold text-slate-200">
                  {kb.documents?.length || 0}
                </div>
              </div>
              <div className="px-3.5 py-2 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
                <div className="text-xs text-slate-400">Vector Chunks</div>
                <div className="text-sm font-bold text-cyan-400">
                  {kb.documents?.reduce((acc, d) => acc + (d._count?.chunks || 0), 0)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-800 mb-6 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveTab("sources")}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-b-2 cursor-pointer ${
              activeTab === "sources"
                ? "border-cyan-400 text-cyan-300 bg-cyan-950/20"
                : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40"
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Data Sources ({kb.documents?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab("playground")}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-b-2 cursor-pointer ${
              activeTab === "playground"
                ? "border-cyan-400 text-cyan-300 bg-cyan-950/20"
                : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40"
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Playground</span>
          </button>

          <button
            onClick={() => setActiveTab("embed")}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-b-2 cursor-pointer ${
              activeTab === "embed"
                ? "border-cyan-400 text-cyan-300 bg-cyan-950/20"
                : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40"
            }`}
          >
            <Share2 className="w-4 h-4" />
            <span>Embed & Share</span>
          </button>

          <button
            onClick={() => setActiveTab("settings")}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-b-2 cursor-pointer ${
              activeTab === "settings"
                ? "border-cyan-400 text-cyan-300 bg-cyan-950/20"
                : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40"
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Assistant Settings</span>
          </button>
        </div>

        {/* Tab 1: Data Sources (Ingestion Pipeline) */}
        <div className={activeTab === "sources" ? "space-y-6" : "hidden"}>
          {/* Ingestion Inputs Card */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-800">
              <div>
                <h2 className="text-base font-bold text-slate-100">
                  Add Knowledge Sources
                </h2>
                <p className="text-xs text-slate-400">
                  Ingest multi-format files or live web pages directly into PostgreSQL vector storage
                </p>
              </div>

              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-950 border border-slate-800 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setIngestionMode("upload")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    ingestionMode === "upload"
                      ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Upload Documents
                </button>
                <button
                  type="button"
                  onClick={() => setIngestionMode("scrape")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    ingestionMode === "scrape"
                      ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Crawl Web URL
                </button>
              </div>
            </div>

            {ingestionMode === "upload" ? (
              <FileUploader kbId={kbId} onUploadSuccess={fetchKbDetails} />
            ) : (
              <UrlScraper kbId={kbId} onScrapeSuccess={fetchKbDetails} />
            )}
          </div>

          {/* Uploaded Documents List */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-100">
                  Indexed Documents ({kb.documents?.length || 0})
                </h3>
                <p className="text-xs text-slate-400">
                  Parsed text chunks ready for vector embeddings and similarity search
                </p>
              </div>
            </div>

            {kb.documents && kb.documents.length > 0 ? (
              <div className="divide-y divide-slate-800/80">
                {kb.documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-center text-slate-300 shrink-0">
                        {doc.type === "URL" ? (
                          <Link2 className="w-5 h-5 text-cyan-400" />
                        ) : (
                          <FileText className="w-5 h-5 text-indigo-400" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div
                          className={`text-xs sm:text-sm font-semibold text-slate-100 truncate ${
                            isRtlText(doc.name) ? "font-persian" : ""
                          }`}
                        >
                          {doc.name}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                          <span className="font-mono text-cyan-400 font-semibold">{doc.type}</span>
                          <span>•</span>
                          <span>{doc._count?.chunks || 0} Chunks</span>
                          {doc.fileSize && (
                            <>
                              <span>•</span>
                              <span>{(doc.fileSize / 1024).toFixed(1)} KB</span>
                            </>
                          )}
                        </div>
                        {doc.errorMessage && (
                          <div className="text-[10px] text-red-400 mt-1">
                            Error: {doc.errorMessage}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                      <span
                        className={`text-[10px] px-2.5 py-0.5 rounded-full font-medium ${
                          doc.status === "READY"
                            ? "bg-emerald-950/60 text-emerald-300 border border-emerald-500/30"
                            : doc.status === "PROCESSING"
                            ? "bg-amber-950/60 text-amber-300 border border-amber-500/30 animate-pulse"
                            : "bg-red-950/60 text-red-300 border border-red-500/30"
                        }`}
                      >
                        {doc.status}
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          setSelectedDocForChunks({
                            id: doc.id,
                            name: doc.name,
                          })
                        }
                        className="px-2.5 py-1.5 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-slate-300 hover:text-cyan-300 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="Inspect Chunks"
                      >
                        <Layers className="w-3.5 h-3.5 text-cyan-400" />
                        <span className="hidden sm:inline">Inspect Chunks</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteDocument(doc.id)}
                        disabled={deletingDocId === doc.id}
                        className="p-1.5 rounded-lg border border-slate-800 hover:border-red-500/40 bg-slate-900/60 hover:bg-red-950/40 text-slate-400 hover:text-red-400 text-xs transition-colors cursor-pointer disabled:opacity-50"
                        title="Delete Document"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center flex flex-col items-center justify-center border border-dashed border-slate-800 rounded-xl">
                <Upload className="w-10 h-10 text-slate-500 mb-3" />
                <h3 className="text-sm font-semibold text-slate-200 mb-1">
                  No documents attached yet
                </h3>
                <p className="text-xs text-slate-400 max-w-sm mb-4">
                  Upload your files above or paste web URLs to create the vector knowledge base for this bot.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Tab 2: Interactive Playground */}
        <div className={activeTab === "playground" ? "space-y-4" : "hidden"}>
          <ChatInterface
            kbId={kb.id}
            kbName={kb.name}
            colorCode={kb.colorCode}
            initialPrompt={kb.prompt}
          />
        </div>

        {/* Tab 3: Embed & Share */}
        <div className={activeTab === "embed" ? "space-y-6" : "hidden"}>
          {/* Standalone Public Link */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-2 mb-2">
              <Globe className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-bold text-slate-100">
                Public Assistant Link
              </h2>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Share this unique link with anyone to allow them to query your assistant without logging in.
            </p>

            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={publicUrl}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-300 focus:outline-none"
              />
              <button
                onClick={() => copyToClipboard(publicUrl, "link")}
                className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Link</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Embed Widget Snippet */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-2 mb-2">
              <FileCode className="w-4 h-4 text-purple-400" />
              <h2 className="text-sm font-bold text-slate-100">
                Website Embed Script
              </h2>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Paste this script into the <code className="text-cyan-400">&lt;head&gt;</code> or <code className="text-cyan-400">&lt;body&gt;</code> of any HTML website to render a floating chat widget.
            </p>

            <div className="relative">
              <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs font-mono text-cyan-300 overflow-x-auto">
                {embedCode}
              </pre>
              <button
                onClick={() => copyToClipboard(embedCode, "snippet")}
                className="absolute top-3 right-3 px-3 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copiedSnippet ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Snippet</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Tab 4: Settings */}
        <div className={activeTab === "settings" ? "space-y-6" : "hidden"}>
          <form onSubmit={handleSaveSettings} className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h2 className="text-base font-bold text-slate-100">
                  Assistant Configuration
                </h2>
                <p className="text-xs text-slate-400">
                  Update persona instructions, brand colors, and visibility
                </p>
              </div>

              <button
                type="submit"
                disabled={savingSettings}
                className="px-4 py-2 rounded-xl text-slate-950 text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                style={{ backgroundColor: colorCode }}
              >
                {savingSettings ? (
                  <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                ) : saveSuccess ? (
                  <>
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Saved!</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Assistant Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-900/80 border border-slate-700/80 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Description
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-900/80 border border-slate-700/80 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  System Prompt & Anti-Hallucination Guardrail
                </label>
                <textarea
                  rows={5}
                  required
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="w-full bg-slate-900/80 border border-slate-700/80 rounded-lg p-3 text-xs font-mono text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 leading-relaxed"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Directs the LLM to ground answers exclusively in retrieved chunks and cite sources via [Doc X].
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-800">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">
                    Accent Color
                  </label>
                  <div className="flex items-center gap-2">
                    {ACCENT_COLORS.map((c) => (
                      <button
                        key={c.hex}
                        type="button"
                        onClick={() => setColorCode(c.hex)}
                        className={`w-7 h-7 rounded-full border-2 transition-transform cursor-pointer ${
                          colorCode === c.hex
                            ? "scale-115 border-white shadow-md"
                            : "border-transparent opacity-75 hover:opacity-100"
                        }`}
                        style={{ backgroundColor: c.hex }}
                        title={c.name}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">
                    Public Visibility
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsPublic(true)}
                      className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        isPublic
                          ? "bg-cyan-950/50 border-cyan-500 text-cyan-300"
                          : "bg-slate-900/40 border-slate-800 text-slate-400"
                      }`}
                    >
                      <Globe className="w-3.5 h-3.5" />
                      <span>Public</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsPublic(false)}
                      className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        !isPublic
                          ? "bg-slate-800 border-slate-600 text-slate-200"
                          : "bg-slate-900/40 border-slate-800 text-slate-400"
                      }`}
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Private</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </form>

          {/* Danger Zone */}
          <div className="glass-panel p-6 rounded-2xl border border-red-500/20 bg-red-950/10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-red-300">
                  Danger Zone
                </h3>
                <p className="text-xs text-slate-400">
                  Permanently delete this assistant and all associated documents and vector chunks.
                </p>
              </div>
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2 rounded-xl bg-red-950/60 hover:bg-red-900 border border-red-500/40 text-red-200 text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Trash2 className="w-4 h-4 text-red-400" />
                <span>Delete Knowledge Base</span>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Chunk Inspector Modal */}
      <ChunkViewerModal
        isOpen={!!selectedDocForChunks}
        kbId={kbId}
        documentId={selectedDocForChunks?.id || null}
        documentName={selectedDocForChunks?.name || ""}
        onClose={() => setSelectedDocForChunks(null)}
      />
    </div>
  );
}
