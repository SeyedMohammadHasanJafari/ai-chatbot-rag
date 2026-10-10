"use client";

import * as React from "react";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot,
  Zap,
  FileText,
  Sparkles,
  ArrowRight,
  Code2,
  Database,
  ShieldCheck,
  Check,
  Copy,
  Globe,
  Sliders,
  Menu,
  X,
  BookOpen,
  FileCode,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export default function HomePage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [demoLoading, setDemoLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeCodeTab, setActiveCodeTab] = useState<"widget" | "api" | "sql">("widget");
  const [copiedCode, setCopiedCode] = useState(false);
  const [previewLanguage, setPreviewLanguage] = useState<"en" | "fa">("en");

  const handleDemoLaunch = async () => {
    setDemoLoading(true);
    try {
      const res = await signIn("credentials", {
        redirect: false,
        email: "demo@synapserag.ai",
        isDemo: "true",
      });

      if (!res?.error) {
        router.push("/dashboard");
        router.refresh();
      } else {
        router.push("/login");
      }
    } catch {
      router.push("/login");
    } finally {
      setDemoLoading(false);
    }
  };

  const codeSnippets = {
    widget: `<!-- Embed Synapse RAG into any external website -->
<script 
  src="https://synapserag.ai/widget.js" 
  data-kb-id="cmv0vuwej0000z0verh9aqhum" 
  data-color="#06b6d4" 
  defer>
</script>`,
    api: `// Query grounded vector assistant via Streaming REST API
curl -X POST https://synapserag.ai/api/chat \\
  -H "Content-Type: application/json" \\
  -d '{
    "kbId": "cmv0vuwej0000z0verh9aqhum",
    "messages": [
      { "role": "user", "content": "What is the SLA uptime guarantee?" }
    ]
  }'`,
    sql: `-- High-performance pgvector Cosine Distance Query
SELECT 
  c.id, 
  c.content, 
  d.name AS document_name,
  (1 - (c.embedding <=> $query_vector::vector)) AS similarity
FROM "DocumentChunk" c
JOIN "Document" d ON c."documentId" = d.id
WHERE d."kbId" = $kb_id AND d.status = 'READY'
ORDER BY c.embedding <=> $query_vector::vector ASC
LIMIT 5;`,
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(codeSnippets[activeCodeTab]);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)] text-[var(--foreground)] relative selection:bg-cyan-500/20 selection:text-cyan-800 dark:selection:text-cyan-300">
      {/* Background Lighting Orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[550px] bg-gradient-to-b from-cyan-500/15 via-indigo-600/10 to-transparent blur-[160px] opacity-80" />
        <div className="absolute top-1/3 -right-40 w-[600px] h-[600px] bg-purple-600/10 blur-[180px] opacity-70" />
        <div className="absolute bottom-10 -left-40 w-[600px] h-[600px] bg-teal-500/10 blur-[180px] opacity-60" />
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.4] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      </div>

      {/* Navigation Header */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-slate-800/80 bg-white/80 dark:bg-[var(--background)]/80 backdrop-blur-xl transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
              <Bot className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold tracking-tight text-xl text-slate-900 dark:text-white">
                Synapse<span className="text-cyan-600 dark:text-cyan-400">RAG</span>
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border border-cyan-300 bg-cyan-50 text-cyan-800 dark:border-cyan-500/30 dark:bg-cyan-950/50 dark:text-cyan-400">
                v1.0 Pro
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-semibold text-slate-700 dark:text-slate-300">
            <a href="#features" className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">
              Features
            </a>
            <a href="#pipeline" className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">
              Architecture
            </a>
            <a href="#code" className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">
              Integration
            </a>
            <a href="#security" className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">
              Security
            </a>
            <a href="#comparison" className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">
              Benchmarks
            </a>
          </nav>

          {/* Header Action Buttons */}
          <div className="hidden sm:flex items-center gap-3">
            <ThemeToggle />
            {session ? (
              <Link
                href="/dashboard"
                id="header-dashboard-link"
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 dark:bg-cyan-500 dark:hover:bg-cyan-400 text-white dark:text-slate-950 text-sm font-bold transition-all shadow-md shadow-cyan-500/20 flex items-center gap-2"
              >
                <span>Console</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  id="header-login-link"
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800/60 transition-all"
                >
                  Sign In
                </Link>
                <button
                  onClick={handleDemoLaunch}
                  disabled={demoLoading}
                  id="header-demo-button"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 via-indigo-600 to-purple-600 hover:opacity-90 text-white text-sm font-bold transition-all shadow-lg shadow-cyan-500/20 flex items-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {demoLoading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Zap className="w-4 h-4 fill-white text-white" />
                  )}
                  <span>Try Demo</span>
                </button>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <div className="flex sm:hidden items-center gap-2">
            <ThemeToggle />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="sm:hidden border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl px-4 py-5 flex flex-col gap-4 text-sm shadow-xl"
            >
              <a
                href="#features"
                onClick={() => setMobileMenuOpen(false)}
                className="text-slate-700 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-400 py-1 font-semibold"
              >
                Features
              </a>
              <a
                href="#pipeline"
                onClick={() => setMobileMenuOpen(false)}
                className="text-slate-700 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-400 py-1 font-semibold"
              >
                Architecture
              </a>
              <a
                href="#code"
                onClick={() => setMobileMenuOpen(false)}
                className="text-slate-700 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-400 py-1 font-semibold"
              >
                Integration
              </a>
              <a
                href="#security"
                onClick={() => setMobileMenuOpen(false)}
                className="text-slate-700 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-400 py-1 font-semibold"
              >
                Security
              </a>
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-2">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleDemoLaunch();
                  }}
                  disabled={demoLoading}
                  className="w-full py-2.5 rounded-xl bg-cyan-600 text-white font-bold text-center flex items-center justify-center gap-2 shadow-md"
                >
                  <Zap className="w-4 h-4 fill-white" />
                  <span>Launch Demo (One-Click)</span>
                </button>
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-2.5 rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-center font-bold"
                >
                  Sign In / Register
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Hero Section */}
      <main className="flex-1 z-10">
        <section className="relative pt-16 sm:pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col items-center text-center">
          {/* Announcement Pill */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-cyan-300 bg-cyan-50 text-cyan-800 dark:border-cyan-500/30 dark:bg-cyan-950/40 dark:text-cyan-300 text-xs sm:text-sm font-semibold mb-8 shadow-sm backdrop-blur-md"
          >
            <Sparkles className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            <span>PostgreSQL pgvector Engine • 1536-Dimensional Vectors</span>
            <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse ml-1" />
          </motion.div>

          {/* Main Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight max-w-5xl leading-[1.12] text-slate-900 dark:text-slate-100"
          >
            Autonomous Knowledge Assistants{" "}
            <span className="bg-gradient-to-r from-cyan-600 via-teal-600 to-indigo-600 dark:from-cyan-400 dark:via-teal-300 dark:to-indigo-400 bg-clip-text text-transparent">
              Grounded in Private Data
            </span>
          </motion.h1>

          {/* Subtitle with High Contrast */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-7 text-base sm:text-xl text-slate-600 dark:text-slate-300 max-w-3xl leading-relaxed font-normal"
          >
            Index enterprise PDFs, Word documents, and web portals into a secure vector space.
            Deploy AI support bots with zero hallucinations, verified citations, bidirectional
            RTL/LTR typography, and zero-dependency embed widgets.
          </motion.p>

          {/* Hero Call-to-Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-10 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto"
          >
            <button
              onClick={handleDemoLaunch}
              disabled={demoLoading}
              id="hero-demo-launch"
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-600 via-cyan-500 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-extrabold text-base shadow-xl shadow-cyan-500/25 flex items-center justify-center gap-3 transition-all transform hover:-translate-y-0.5 cursor-pointer disabled:opacity-60"
            >
              {demoLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Zap className="w-5 h-5 fill-white text-white" />
              )}
              <span>Try Demo Account (One Click)</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <Link
              href="/login"
              id="hero-create-kb-link"
              className="w-full sm:w-auto px-8 py-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-900 dark:border-slate-700 dark:bg-slate-900/80 dark:hover:bg-slate-800 dark:text-slate-100 font-bold text-base shadow-sm transition-all flex items-center justify-center gap-2"
            >
              <span>Build Custom Assistant</span>
            </Link>
          </motion.div>

          {/* Production Metrics Bar */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="mt-14 w-full max-w-4xl grid grid-cols-2 md:grid-cols-4 gap-4 py-6 px-4 rounded-2xl bg-white/90 border border-slate-200 shadow-sm dark:bg-slate-900/60 dark:border-slate-800"
          >
            <div className="flex flex-col items-center">
              <span className="text-2xl sm:text-3xl font-extrabold text-cyan-600 dark:text-cyan-400 tracking-tight">
                1536-dim
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 uppercase font-bold tracking-wider">
                Vector Precision
              </span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-2xl sm:text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 tracking-tight">
                &lt; 200ms
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 uppercase font-bold tracking-wider">
                Cosine Retrieval
              </span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-2xl sm:text-3xl font-extrabold text-teal-600 dark:text-teal-400 tracking-tight">
                100%
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 uppercase font-bold tracking-wider">
                Grounded Citations
              </span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-2xl sm:text-3xl font-extrabold text-purple-600 dark:text-purple-400 tracking-tight">
                0%
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 uppercase font-bold tracking-wider">
                Hallucinations
              </span>
            </div>
          </motion.div>

          {/* Interactive Live Product Preview Showcase */}
          <motion.div
            initial={{ opacity: 0, y: 35 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="mt-16 w-full max-w-5xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-2xl shadow-cyan-500/10 overflow-hidden text-left"
          >
            {/* Window Header */}
            <div className="px-5 py-3.5 bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <div className="w-3 h-3 rounded-full bg-emerald-400" />
                <span className="ml-3 text-xs font-mono text-slate-700 dark:text-slate-300 flex items-center gap-1.5 font-semibold">
                  <Database className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                  synapse-rag://kb/acme-support-ai
                </span>
              </div>

              {/* Language Switcher Pill */}
              <div className="flex items-center gap-2 bg-slate-200 dark:bg-slate-950/60 p-1 rounded-lg border border-slate-300 dark:border-slate-800">
                <button
                  onClick={() => setPreviewLanguage("en")}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all ${
                    previewLanguage === "en"
                      ? "bg-cyan-600 text-white shadow-sm"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  English (LTR)
                </button>
                <button
                  onClick={() => setPreviewLanguage("fa")}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all font-persian ${
                    previewLanguage === "fa"
                      ? "bg-cyan-600 text-white shadow-sm"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  فارسی (RTL)
                </button>
              </div>
            </div>

            {/* Mockup Content Grid */}
            <div className="grid grid-cols-1 md:grid-cols-12 min-h-[420px]">
              {/* Left Column: Data Sources */}
              <div className="md:col-span-4 p-5 border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                      Active Sources
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/20 font-bold">
                      3 READY
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    <div className="p-3 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm flex items-start gap-2.5">
                      <FileText className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                          Enterprise_SLA_2026.pdf
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                          8 Chunks • 1536-dim indexed
                        </div>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm flex items-start gap-2.5">
                      <FileCode className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                          Pricing_Refund_Policy.docx
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                          5 Chunks • 1536-dim indexed
                        </div>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm flex items-start gap-2.5">
                      <Globe className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                          docs.acme.cloud/api-ref
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                          Web Scraped • SSRF Verified
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400 mb-1.5 font-medium">
                    <span>Similarity Metric</span>
                    <span className="font-mono text-cyan-700 dark:text-cyan-400 font-bold">Cosine ({'<=>'})</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                    <span>Index Type</span>
                    <span className="font-mono text-indigo-700 dark:text-indigo-400 font-bold">HNSW (ef=64)</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Chat Interface */}
              <div className="md:col-span-8 p-6 flex flex-col justify-between bg-slate-50/50 dark:bg-slate-950/60">
                {previewLanguage === "en" ? (
                  <div className="space-y-4">
                    {/* User Query - High Contrast! */}
                    <div className="flex items-start gap-3 justify-end">
                      <div className="bg-cyan-600 text-white rounded-2xl rounded-tr-sm px-4 py-2.5 text-xs sm:text-sm max-w-md font-medium shadow-md">
                        What is your uptime guarantee for Enterprise tier and the refund timeline?
                      </div>
                    </div>

                    {/* Assistant Bubble */}
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-cyan-100 text-cyan-700 dark:bg-cyan-500/20 dark:border dark:border-cyan-500/30 dark:text-cyan-400 flex items-center justify-center shrink-0">
                        <Bot className="w-4 h-4" />
                      </div>
                      <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-200 rounded-2xl rounded-tl-sm p-4 text-xs sm:text-sm max-w-xl space-y-2.5 shadow-md">
                        <p className="leading-relaxed">
                          Under our Enterprise SLA, uptime is guaranteed at{" "}
                          <strong className="text-cyan-700 dark:text-cyan-300 font-bold">99.95%</strong> with automated credit reimbursement if degraded.
                        </p>
                        <p className="leading-relaxed">
                          In accordance with the refund terms, verified refund requests are processed within{" "}
                          <strong className="text-cyan-700 dark:text-cyan-300 font-bold">30 calendar days</strong> of written notification.
                        </p>

                        {/* Citations */}
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap gap-2">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-cyan-50 border border-cyan-200 text-cyan-800 dark:bg-cyan-950/60 dark:border-cyan-500/30 dark:text-cyan-300 text-[11px] font-mono font-medium">
                            <FileText className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />
                            [Doc 1: Enterprise_SLA_2026.pdf • 94.8% match]
                          </span>
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-800 dark:bg-indigo-950/60 dark:border-indigo-500/30 dark:text-indigo-300 text-[11px] font-mono font-medium">
                            <FileCode className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                            [Doc 2: Pricing_Refund_Policy.docx • 91.2% match]
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 font-persian" dir="rtl">
                    {/* User Query RTL */}
                    <div className="flex items-start gap-3 justify-start">
                      <div className="bg-cyan-600 text-white rounded-2xl rounded-tr-sm px-4 py-2.5 text-xs sm:text-sm max-w-md font-medium shadow-md">
                        تضمین پایداری سرور در پلن سازمانی چقدر است و شرایط بازگشت وجه به چه صورت است؟
                      </div>
                    </div>

                    {/* Assistant Bubble RTL */}
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-cyan-100 text-cyan-700 dark:bg-cyan-500/20 dark:border dark:border-cyan-500/30 dark:text-cyan-400 flex items-center justify-center shrink-0">
                        <Bot className="w-4 h-4" />
                      </div>
                      <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-200 rounded-2xl rounded-tl-sm p-4 text-xs sm:text-sm max-w-xl space-y-2.5 shadow-md">
                        <p className="leading-relaxed">
                          بر اساس توافق‌نامه سطح خدمات (SLA) پلن سازمانی، آپ‌تایم و پایداری سیستم{" "}
                          <strong className="text-cyan-700 dark:text-cyan-300 font-bold">۹۹.۹۵٪</strong> تضمین می‌شود.
                        </p>
                        <p className="leading-relaxed">
                          همچنین بر طبق سند شرایط مالی، درخواست‌های بازگشت وجه تأیید شده ظرف حداکثر{" "}
                          <strong className="text-cyan-700 dark:text-cyan-300 font-bold">۳۰ روز تقویمی</strong> پس از ثبت رسمی تسویه می‌گردند.
                        </p>

                        {/* Citations RTL */}
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap gap-2">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-cyan-50 border border-cyan-200 text-cyan-800 dark:bg-cyan-950/60 dark:border-cyan-500/30 dark:text-cyan-300 text-[11px] font-mono font-medium">
                            <FileText className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />
                            [مستند ۱: Enterprise_SLA_2026.pdf • شباهت ۹۴.۸٪]
                          </span>
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-800 dark:bg-indigo-950/60 dark:border-indigo-500/30 dark:text-indigo-300 text-[11px] font-mono font-medium">
                            <FileCode className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                            [مستند ۲: Pricing_Refund_Policy.docx • شباهت ۹۱.۲٪]
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Input Simulation Footer */}
                <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800/80 flex items-center gap-3">
                  <div className="flex-1 py-2.5 px-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between shadow-inner">
                    <span>
                      {previewLanguage === "en"
                        ? "Ask anything grounded in your documents..."
                        : "سوالی در مورد اسناد بپرسید..."}
                    </span>
                    <span className="text-[10px] text-cyan-700 dark:text-cyan-400 font-bold border border-cyan-300 dark:border-cyan-500/30 bg-cyan-50 dark:bg-cyan-950/50 px-2 py-0.5 rounded">
                      Grounded
                    </span>
                  </div>
                  <div className="w-9 h-9 rounded-xl bg-cyan-600 text-white flex items-center justify-center shrink-0 shadow-md">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Feature Bento Grid Section */}
        <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs sm:text-sm font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-widest mb-3">
              Production Capabilities
            </h2>
            <p className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
              Engineered for Accuracy, Security, and Scale
            </p>
            <p className="mt-4 text-base text-slate-600 dark:text-slate-400 font-normal">
              Every component is built to prevent hallucinations, protect private infrastructure,
              and deliver verifiable knowledge.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Bento Card 1: Multi-Format Parsing */}
            <div className="p-8 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-cyan-500/50 dark:bg-slate-900/40 dark:border-slate-800/80 transition-all">
              <div className="w-12 h-12 rounded-xl bg-cyan-50 border border-cyan-200 dark:bg-cyan-950/60 dark:border-cyan-500/30 flex items-center justify-center text-cyan-700 dark:text-cyan-400 mb-6">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-slate-900 dark:text-slate-100">Multi-Format Ingestion</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
                Direct in-memory buffer parsing for PDF (`unpdf`), Microsoft Word (`mammoth`),
                plain text, and markdown files without third-party binary dependencies.
              </p>
              <div className="mt-6 flex flex-wrap gap-2 text-[11px] font-mono">
                <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 font-medium">.PDF</span>
                <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 font-medium">.DOCX</span>
                <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 font-medium">.TXT</span>
                <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 font-medium">.MD</span>
              </div>
            </div>

            {/* Bento Card 2: pgvector Vector Engine */}
            <div className="p-8 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-500/50 dark:bg-slate-900/40 dark:border-slate-800/80 transition-all">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-200 dark:bg-indigo-950/60 dark:border-indigo-500/30 flex items-center justify-center text-indigo-700 dark:text-indigo-400 mb-6">
                <Database className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-slate-900 dark:text-slate-100">PostgreSQL pgvector</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
                Native vector similarity operations via the {"<=>"} cosine distance operator.
                Zero standalone vector SaaS lock-in; everything resides in your PostgreSQL cluster.
              </p>
              <div className="mt-6 flex flex-wrap gap-2 text-[11px] font-mono">
                <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 font-medium">1536-dim</span>
                <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 font-medium">HNSW Index</span>
                <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 font-medium">Cosine Distance</span>
              </div>
            </div>

            {/* Bento Card 3: SSRF Security Guard */}
            <div className="p-8 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-teal-500/50 dark:bg-slate-900/40 dark:border-slate-800/80 transition-all">
              <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-200 dark:bg-teal-950/60 dark:border-teal-500/30 flex items-center justify-center text-teal-700 dark:text-teal-400 mb-6">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-slate-900 dark:text-slate-100">SSRF Defense Shield</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
                Pre-crawl network verification blocks RFC 1918 private subnets, loopbacks (`127.0.0.1`,
                `[::1]`), and cloud metadata endpoints (`169.254.169.254`) before sockets open.
              </p>
              <div className="mt-6 flex flex-wrap gap-2 text-[11px] font-mono">
                <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 font-medium">RFC 1918</span>
                <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 font-medium">Loopback Guard</span>
                <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 font-medium">Cloud Metadata</span>
              </div>
            </div>

            {/* Bento Card 4: Bi-Directional RTL Engine */}
            <div className="p-8 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-purple-500/50 dark:bg-slate-900/40 dark:border-slate-800/80 transition-all">
              <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-200 dark:bg-purple-950/60 dark:border-purple-500/30 flex items-center justify-center text-purple-700 dark:text-purple-400 mb-6">
                <Globe className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-slate-900 dark:text-slate-100">Dynamic RTL / LTR Engine</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
                Automatic real-time Unicode script inspection toggles inputs, message bubbles,
                and typographic font stacks (`Vazirmatn`) when Persian or Arabic is detected.
              </p>
              <div className="mt-6 flex flex-wrap gap-2 text-[11px] font-mono">
                <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 font-medium">فارسی</span>
                <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 font-medium">العربية</span>
                <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 font-medium">Vazirmatn</span>
              </div>
            </div>

            {/* Bento Card 5: Embeddable Widget */}
            <div className="p-8 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-cyan-500/50 dark:bg-slate-900/40 dark:border-slate-800/80 transition-all">
              <div className="w-12 h-12 rounded-xl bg-cyan-50 border border-cyan-200 dark:bg-cyan-950/60 dark:border-cyan-500/30 flex items-center justify-center text-cyan-700 dark:text-cyan-400 mb-6">
                <Code2 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-slate-900 dark:text-slate-100">Embeddable Client Widget</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
                Zero-dependency vanilla JavaScript launcher (`widget.js`). Embed your customized
                support bot onto any website or SaaS platform in a single script tag.
              </p>
              <div className="mt-6 flex flex-wrap gap-2 text-[11px] font-mono">
                <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 font-medium">&lt;script&gt;</span>
                <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 font-medium">Iframe Isolated</span>
                <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 font-medium">Custom Colors</span>
              </div>
            </div>

            {/* Bento Card 6: Fair Document Representation */}
            <div className="p-8 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-500/50 dark:bg-slate-900/40 dark:border-slate-800/80 transition-all">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-200 dark:bg-indigo-950/60 dark:border-indigo-500/30 flex items-center justify-center text-indigo-700 dark:text-indigo-400 mb-6">
                <Sliders className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-slate-900 dark:text-slate-100">Multi-Document Diversity</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
                Smart diversity retrieval prevents large documents from monopolizing the prompt.
                Ensures fair representation across all indexed sources in your repository.
              </p>
              <div className="mt-6 flex flex-wrap gap-2 text-[11px] font-mono">
                <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 font-medium">Fair Distribution</span>
                <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 font-medium">Overlapped Chunks</span>
                <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 font-medium">Source Attributed</span>
              </div>
            </div>
          </div>
        </section>

        {/* 4-Stage Architecture Pipeline Section */}
        <section id="pipeline" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-200 dark:border-slate-800/80">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs sm:text-sm font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-widest mb-3">
              Engineering Topology
            </h2>
            <p className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
              The 4-Stage Ingestion & Query Lifecycle
            </p>
            <p className="mt-4 text-base text-slate-600 dark:text-slate-400 font-normal">
              How documents flow from unstructured raw files into verified vector intelligence.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm dark:bg-slate-900/40 dark:border-slate-800 relative">
              <div className="text-3xl font-extrabold text-cyan-600/40 dark:text-cyan-500/30 mb-4">01</div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2">Ingestion & Sanitize</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Extract binary streams into plain text via unpdf/mammoth/cheerio. Strips HTML boilerplate and verifies safety.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm dark:bg-slate-900/40 dark:border-slate-800 relative">
              <div className="text-3xl font-extrabold text-indigo-600/40 dark:text-indigo-500/30 mb-4">02</div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2">Boundary Chunking</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Sliding window of 1000 characters with 200 overlap. Respects paragraph breaks and sentence terminators.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm dark:bg-slate-900/40 dark:border-slate-800 relative">
              <div className="text-3xl font-extrabold text-teal-600/40 dark:text-teal-500/30 mb-4">03</div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2">Vector Indexing</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Generates 1536-dimensional embeddings and stores them in PostgreSQL with pgvector indexing.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm dark:bg-slate-900/40 dark:border-slate-800 relative">
              <div className="text-3xl font-extrabold text-purple-600/40 dark:text-purple-500/30 mb-4">04</div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2">Grounded Stream</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Retrieves Top-K context chunks, injects into strict prompt, and streams token answers with [Doc X] citation badges.
              </p>
            </div>
          </div>
        </section>

        {/* Integration Code Snippets Section */}
        <section id="code" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-200 dark:border-slate-800/80">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-xs sm:text-sm font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-widest mb-3">
                Developer Integration
              </h2>
              <p className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
                Integrate in Under 2 Minutes
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden shadow-2xl">
              {/* Code Tab Switcher */}
              <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveCodeTab("widget")}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                      activeCodeTab === "widget"
                        ? "bg-cyan-500 text-slate-950 shadow-sm"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    HTML Widget
                  </button>
                  <button
                    onClick={() => setActiveCodeTab("api")}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                      activeCodeTab === "api"
                        ? "bg-cyan-500 text-slate-950 shadow-sm"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Streaming REST API
                  </button>
                  <button
                    onClick={() => setActiveCodeTab("sql")}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                      activeCodeTab === "sql"
                        ? "bg-cyan-500 text-slate-950 shadow-sm"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    pgvector SQL
                  </button>
                </div>

                <button
                  onClick={handleCopyCode}
                  className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-cyan-400 px-2.5 py-1 rounded bg-slate-800 border border-slate-700 transition-colors font-medium"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode ? "Copied" : "Copy"}</span>
                </button>
              </div>

              {/* Code Body */}
              <pre className="p-6 text-xs sm:text-sm font-mono overflow-x-auto text-slate-200 leading-relaxed">
                <code>{codeSnippets[activeCodeTab]}</code>
              </pre>
            </div>
          </div>
        </section>

        {/* Feature Comparison Table */}
        <section id="comparison" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-200 dark:border-slate-800/80">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs sm:text-sm font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-widest mb-3">
              Why Synapse RAG
            </h2>
            <p className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
              Enterprise Grounding vs. Naive Chatbots
            </p>
          </div>

          <div className="max-w-4xl mx-auto rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900/40 shadow-sm">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-100 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200">
                <tr>
                  <th className="py-4 px-6 font-bold">Capabilities</th>
                  <th className="py-4 px-6 font-bold text-slate-500 dark:text-slate-400">Generic LLM Wrappers</th>
                  <th className="py-4 px-6 font-bold text-cyan-700 dark:text-cyan-400">Synapse RAG Platform</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                <tr>
                  <td className="py-4 px-6 font-bold text-slate-900 dark:text-slate-100">Hallucination Mitigation</td>
                  <td className="py-4 px-6 text-red-600 dark:text-red-400">Unbounded / Speculative</td>
                  <td className="py-4 px-6 text-cyan-700 dark:text-cyan-400 font-bold">Strict Context Grounded Only</td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-bold text-slate-900 dark:text-slate-100">Source Attribution</td>
                  <td className="py-4 px-6 text-slate-500">None / Fake References</td>
                  <td className="py-4 px-6 text-cyan-700 dark:text-cyan-400 font-bold">Real-Time [Doc X] Badges & Raw Chunks</td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-bold text-slate-900 dark:text-slate-100">Multilingual RTL Engine</td>
                  <td className="py-4 px-6 text-red-600 dark:text-red-400">Broken Character Alignment</td>
                  <td className="py-4 px-6 text-cyan-700 dark:text-cyan-400 font-bold">Dynamic Persian/Arabic Unicode Auto-RTL</td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-bold text-slate-900 dark:text-slate-100">SSRF Crawler Protection</td>
                  <td className="py-4 px-6 text-red-600 dark:text-red-400">Unprotected Fetch Vulnerability</td>
                  <td className="py-4 px-6 text-cyan-700 dark:text-cyan-400 font-bold">RFC 1918 & Cloud Metadata Shield</td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-bold text-slate-900 dark:text-slate-100">Client Deployment</td>
                  <td className="py-4 px-6 text-slate-500">Requires Custom Frontend Build</td>
                  <td className="py-4 px-6 text-cyan-700 dark:text-cyan-400 font-bold">Drop-in `widget.js` Script Tag</td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-bold text-slate-900 dark:text-slate-100">Database Persistence</td>
                  <td className="py-4 px-6 text-slate-500">Temporary In-Memory</td>
                  <td className="py-4 px-6 text-cyan-700 dark:text-cyan-400 font-bold">PostgreSQL 16 + pgvector HNSW</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Security & Bottom CTA Box */}
        <section id="security" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-200 dark:border-slate-800/80">
          <div className="max-w-4xl mx-auto rounded-3xl p-8 sm:p-12 border border-cyan-200 dark:border-cyan-500/30 bg-gradient-to-br from-cyan-50 via-white to-indigo-50 dark:bg-gradient-to-b dark:from-cyan-950/20 dark:via-slate-950 dark:to-slate-950 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
              <div>
                <span className="text-xs font-bold text-cyan-700 dark:text-cyan-400 uppercase tracking-widest">
                  Ready for Production
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold mt-2 text-slate-900 dark:text-slate-100">
                  Deploy Your First Grounded Knowledge Assistant
                </h2>
                <p className="mt-3 text-sm text-slate-600 dark:text-slate-400 max-w-lg leading-relaxed font-normal">
                  Start with the pre-seeded enterprise demo repository or create a dedicated tenant
                  with your own documents.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0">
                <button
                  onClick={handleDemoLaunch}
                  disabled={demoLoading}
                  className="px-6 py-3.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 dark:bg-cyan-500 dark:hover:bg-cyan-400 text-white dark:text-slate-950 font-bold text-sm shadow-xl shadow-cyan-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {demoLoading ? (
                    <div className="w-4 h-4 border-2 border-white dark:border-slate-950 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Zap className="w-4 h-4 fill-white dark:fill-slate-950" />
                  )}
                  <span>Try Demo Account</span>
                </button>
                <Link
                  href="/login"
                  className="px-6 py-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-slate-200 font-bold text-sm text-center shadow-sm"
                >
                  Sign In
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800/80 py-12 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-950/70 text-slate-600 dark:text-slate-400 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center text-white shadow-sm">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-slate-900 dark:text-slate-200">Synapse RAG</span>
              <span className="text-slate-500 dark:text-slate-500 ml-2">Enterprise Knowledge Retrieval Platform</span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>All Systems Operational</span>
            </div>
            <span>•</span>
            <span className="font-medium">Next.js 16 • React 19 • pgvector • Prisma 7</span>
          </div>

          <div className="text-slate-500">
            &copy; {new Date().getFullYear()} Synapse RAG. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
