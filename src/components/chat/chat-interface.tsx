"use client";

import * as React from "react";
import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Send,
  Bot,
  User,
  Sparkles,
  FileText,
  Link2,
  Trash2,
  Languages,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
import { isRtlText, getDirectionStyle } from "@/lib/rag/rtl";
import {
  SourceCitationModal,
  CitationItem,
} from "@/components/chat/source-citation-modal";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: CitationItem[];
}

interface ChatInterfaceProps {
  kbId: string;
  kbName: string;
  colorCode?: string;
  initialPrompt?: string;
  heightClass?: string;
}

export function ChatInterface({
  kbId,
  kbName,
  colorCode = "#06b6d4",
  heightClass = "h-[650px]",
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [hasLoadedPersisted, setHasLoadedPersisted] = useState(false);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeCitation, setActiveCitation] = useState<CitationItem | null>(null);
  const [error, setError] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load chat history from localStorage on mount
  useEffect(() => {
    let active = true;
    try {
      const saved = localStorage.getItem(`synapse_chat_${kbId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          queueMicrotask(() => {
            if (active) {
              setMessages(parsed);
              setHasLoadedPersisted(true);
            }
          });
          return;
        }
      }
    } catch (e) {
      console.error("Failed to load chat history:", e);
    }
    queueMicrotask(() => {
      if (active) {
        setHasLoadedPersisted(true);
      }
    });
    return () => {
      active = false;
    };
  }, [kbId]);

  // Save chat history to localStorage whenever messages update
  useEffect(() => {
    if (!hasLoadedPersisted) return;
    try {
      if (messages.length > 0) {
        localStorage.setItem(`synapse_chat_${kbId}`, JSON.stringify(messages));
      } else {
        localStorage.removeItem(`synapse_chat_${kbId}`);
      }
    } catch (e) {
      console.error("Failed to save chat history:", e);
    }
  }, [messages, kbId, hasLoadedPersisted]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Determine input direction dynamically based on typed text
  const inputDirStyle = getDirectionStyle(input);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = input.trim();
    if (!query || isLoading) return;

    setError("");
    const userMsgId = `user-${Date.now()}`;
    const userMsg: ChatMessage = {
      id: userMsgId,
      role: "user",
      content: query,
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    const assistantMsgId = `assistant-${Date.now()}`;
    // Prepare placeholder assistant message
    setMessages((prev) => [
      ...prev,
      {
        id: assistantMsgId,
        role: "assistant",
        content: "",
        sources: [],
      },
    ]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kbId,
          messages: newMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Error: ${response.status}`);
      }

      // Parse citation sources from response header
      let responseCitations: CitationItem[] = [];
      const sourcesHeader = response.headers.get("X-Sources");
      if (sourcesHeader) {
        try {
          const binary = atob(sourcesHeader);
          try {
            responseCitations = JSON.parse(decodeURIComponent(binary));
          } catch {
            responseCitations = JSON.parse(binary);
          }
        } catch (e) {
          console.error("Failed to parse sources header:", e);
        }
      }

      if (!response.body) {
        throw new Error("No readable stream received.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        accumulated += chunk;

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId
              ? {
                ...msg,
                content: accumulated,
                sources: responseCitations,
              }
              : msg
          )
        );
      }
    } catch (err: unknown) {
      console.error("Chat error:", err);
      const msg = err instanceof Error ? err.message : "Failed to get response";
      setError(msg);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsgId
            ? {
              ...m,
              content: "An error occurred while generating the grounded response.",
            }
            : m
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleClear = () => {
    setMessages([]);
    setError("");
    try {
      localStorage.removeItem(`synapse_chat_${kbId}`);
    } catch (e) {
      console.error("Failed to clear chat history:", e);
    }
    if (inputRef.current) inputRef.current.focus();
  };

  return (
    <div className={`flex flex-col ${heightClass} glass-panel rounded-2xl border border-slate-800/90 overflow-hidden relative shadow-2xl`}>
      {/* Chat Header */}
      <div className="p-3.5 sm:p-4 border-b border-slate-800/80 bg-slate-950/40 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-md"
            style={{ backgroundColor: colorCode }}
          >
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-100">{kbName}</h3>
              <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border border-cyan-500/30 bg-cyan-950/40 text-cyan-300">
                <ShieldCheck className="w-3 h-3" />
                RAG Grounded
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <span className="flex items-center gap-1 text-[10px] text-slate-400">
                <Languages className="w-3 h-3 text-cyan-400" />
                Auto-RTL & Persian Ready
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <button
              type="button"
              onClick={handleClear}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-700/80 bg-slate-900/80 hover:bg-red-950/40 hover:border-red-500/50 text-slate-300 hover:text-red-400 text-xs font-medium transition-all cursor-pointer shadow-sm active:scale-95"
              title="پاک کردن سابقه چت / Clear chat history"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-400" />

            </button>
          )}
        </div>
      </div>

      {/* Messages Stream Container */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-xl mb-4"
              style={{ backgroundColor: colorCode }}
            >
              <Bot className="w-7 h-7" />
            </div>
            <h4 className="text-base font-bold text-slate-100 mb-1.5">
              Ask {kbName} anything
            </h4>
            <p className="text-xs text-slate-400 max-w-sm mb-6 leading-relaxed">
              This assistant is strictly constrained to your uploaded documents. Responses cite exact sources with [Doc X] chips.
            </p>

            {/* Starter Suggestion Chips */}
            <div className="flex flex-wrap justify-center gap-2 max-w-md">
              <button
                type="button"
                onClick={() => {
                  setInput("What are the main services and SLA terms covered?");
                }}
                className="px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-900/60 hover:border-cyan-500/40 text-slate-300 hover:text-cyan-300 text-xs transition-all cursor-pointer"
              >
                What are the main services & SLA terms?
              </button>
              <button
                type="button"
                onClick={() => {
                  setInput("شرایط گارانتی و پشتیبانی در مستندات چیست؟");
                }}
                className="px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-900/60 hover:border-cyan-500/40 text-slate-300 hover:text-cyan-300 text-xs font-persian transition-all cursor-pointer"
              >
                شرایط گارانتی و پشتیبانی در مستندات چیست؟
              </button>
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isUser = msg.role === "user";
            const dirStyle = getDirectionStyle(msg.content);

            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"
                  }`}
              >
                {/* Avatar */}
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-md ${isUser
                      ? "bg-slate-800 text-slate-200 border border-slate-700"
                      : "text-white"
                    }`}
                  style={!isUser ? { backgroundColor: colorCode } : undefined}
                >
                  {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                {/* Message Bubble */}
                <div
                  className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 shadow-lg ${isUser
                      ? "bg-slate-800/90 text-slate-100 border border-slate-700/80 rounded-tr-sm"
                      : "glass-panel text-slate-100 border border-slate-800 rounded-tl-sm"
                    }`}
                >
                  {/* Message Text with dynamic RTL detection */}
                  <div
                    dir={dirStyle.dir}
                    className={`text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${dirStyle.className}`}
                  >
                    {msg.content || (
                      <span className="inline-flex items-center gap-1.5 text-slate-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                        Analyzing vector sources & synthesizing answer...
                      </span>
                    )}
                  </div>

                  {/* Grounded Source Citation Chips */}
                  {!isUser && msg.sources && msg.sources.length > 0 && (
                    <div className="mt-3.5 pt-3 border-t border-slate-200/80 dark:border-slate-800/80">
                      <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">
                        <Sparkles className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />
                        <span>
                          {isRtlText(msg.content) ? "منابع استفاده‌شده" : "Sources Used"} ({msg.sources.length}):
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.sources.map((citation) => {
                          const isDocRtl = isRtlText(citation.documentName);
                          return (
                            <button
                              key={citation.id}
                              type="button"
                              onClick={() => setActiveCitation(citation)}
                              dir={isDocRtl ? "rtl" : "ltr"}
                              className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-medium flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95 ${
                                isDocRtl ? "font-persian" : ""
                              } bg-white dark:bg-slate-900/80 border-slate-200 dark:border-slate-700/80 hover:bg-cyan-50/80 dark:hover:bg-cyan-950/40 hover:border-cyan-400/80 dark:hover:border-cyan-500/50 text-slate-700 dark:text-slate-200 hover:text-cyan-700 dark:hover:text-cyan-300`}
                              title={`مشاهده تکه بازیابی شده از ${citation.documentName}`}
                            >
                              {citation.documentType === "URL" ? (
                                <Link2 className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 shrink-0" />
                              ) : (
                                <FileText className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                              )}
                              <span className="font-mono text-[10px] font-bold text-cyan-700 dark:text-cyan-300 bg-cyan-100/70 dark:bg-cyan-950/70 border border-cyan-300/60 dark:border-cyan-600/40 px-1 py-0.5 rounded-md shrink-0">
                                [{citation.label}]
                              </span>
                              <span className="truncate max-w-[150px] sm:max-w-[220px]">
                                {citation.documentName}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Error alert */}
      {error && (
        <div className="px-4 py-2 bg-red-950/80 border-t border-red-500/40 text-red-200 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => setError("")}
            className="text-[10px] text-red-300 hover:underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Input Bar with Auto-RTL Detection */}
      <div className="p-3 sm:p-4 border-t border-slate-800/80 bg-slate-950/40 dark:bg-slate-950/60 shrink-0">
        <form
          onSubmit={handleSubmit}
          className="relative flex items-end gap-2 bg-slate-900/90 border border-slate-700/80 rounded-2xl p-2.5 focus-within:border-cyan-500 focus-within:ring-2 focus-within:ring-cyan-500/20 transition-all shadow-lg"
        >
          <textarea
            ref={inputRef}
            rows={1}
            dir={inputDirStyle.dir}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              inputDirStyle.dir === "rtl"
                ? "پرسش خود را بر اساس مستندات مطرح کنید..."
                : "Ask anything about your documents..."
            }
            className={`w-full bg-transparent resize-none px-3 py-2 text-xs sm:text-sm text-slate-100 placeholder:text-slate-400 focus:outline-none max-h-32 ${inputDirStyle.className}`}
          />

          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="p-2.5 rounded-xl text-white font-bold transition-all shadow-md flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0 hover:scale-105 active:scale-95"
            style={{ backgroundColor: colorCode }}
            title="Send Message"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </form>

        <div className="flex items-center justify-between mt-2 px-1 text-[10px] text-slate-400">
          <span>Grounded Retrieval-Augmented Generation</span>
          <span>Shift + Enter for new line</span>
        </div>
      </div>

      {/* Source Citation Modal */}
      <SourceCitationModal
        citation={activeCitation}
        onClose={() => setActiveCitation(null)}
      />
    </div>
  );
}
