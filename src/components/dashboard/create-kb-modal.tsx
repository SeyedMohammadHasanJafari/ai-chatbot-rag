"use client";

import * as React from "react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Sparkles,
  Bot,
  Check,
  ArrowRight,
  Globe,
  Lock,
} from "lucide-react";
import { PERSONA_PRESETS, ACCENT_COLORS, PersonaPreset } from "@/lib/constants/personas";

export interface CreatedKnowledgeBase {
  id: string;
  name: string;
  description?: string | null;
  prompt: string;
  colorCode: string;
  isPublic: boolean;
  createdAt: string;
  _count?: { documents: number };
}

interface CreateKbModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newKb: CreatedKnowledgeBase) => void;
}

export function CreateKbModal({ isOpen, onClose, onSuccess }: CreateKbModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedPersona, setSelectedPersona] = useState<PersonaPreset>(PERSONA_PRESETS[0]);
  const [customPrompt, setCustomPrompt] = useState(PERSONA_PRESETS[0].prompt);
  const [colorCode, setColorCode] = useState(ACCENT_COLORS[0].hex);
  const [isPublic, setIsPublic] = useState(true);
  const [isCustomPromptMode, setIsCustomPromptMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSelectPersona = (preset: PersonaPreset) => {
    setSelectedPersona(preset);
    setCustomPrompt(preset.prompt);
    setColorCode(preset.color);
    setIsCustomPromptMode(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please provide a name for your Knowledge Base.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/kb", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          prompt: customPrompt,
          colorCode,
          isPublic,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create Knowledge Base");
      }

      // Reset state and call onSuccess
      setName("");
      setDescription("");
      onSuccess(data.knowledgeBase);
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
        />

        {/* Modal Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="relative w-full max-w-2xl glass-panel rounded-2xl p-6 sm:p-8 shadow-2xl border border-slate-700/80 z-10 my-8 max-h-[90vh] overflow-y-auto"
        >
          {/* Top highlight bar */}
          <div
            className="absolute top-0 left-0 right-0 h-1.5 transition-colors duration-300 rounded-t-2xl"
            style={{ backgroundColor: colorCode }}
          />

          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-lg transition-colors"
                style={{ backgroundColor: colorCode }}
              >
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-100">
                  Create Knowledge Assistant
                </h2>
                <p className="text-xs text-slate-400">
                  Configure persona, grounded RAG constraints, and theme
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {error && (
            <div className="mt-4 p-3 rounded-lg bg-red-950/60 border border-red-500/30 text-red-200 text-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-6">
            {/* Step 1: Name and Description */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Assistant Name <span className="text-cyan-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Acme Cloud Support Bot, HR Policy Guide"
                  className="w-full bg-slate-900/80 border border-slate-700/80 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Description <span className="text-slate-500 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief note about the purpose or target audience"
                  className="w-full bg-slate-900/80 border border-slate-700/80 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500"
                />
              </div>
            </div>

            {/* Step 2: Persona Selection */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  Select Assistant Persona & Base Prompt
                </label>
                <button
                  type="button"
                  onClick={() => setIsCustomPromptMode(!isCustomPromptMode)}
                  className="text-[11px] text-cyan-400 hover:underline cursor-pointer"
                >
                  {isCustomPromptMode ? "Choose Presets" : "Edit Raw Prompt"}
                </button>
              </div>

              {!isCustomPromptMode ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {PERSONA_PRESETS.map((preset) => {
                    const isSelected = selectedPersona.id === preset.id;
                    return (
                      <div
                        key={preset.id}
                        onClick={() => handleSelectPersona(preset)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? "bg-slate-850 border-cyan-500 shadow-md shadow-cyan-500/10"
                            : "bg-slate-900/40 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/70"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-bold text-slate-200">
                            {preset.name}
                          </span>
                          {isSelected && (
                            <span className="w-4 h-4 rounded-full bg-cyan-500 flex items-center justify-center text-slate-950">
                              <Check className="w-2.5 h-2.5 stroke-[3]" />
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 leading-snug line-clamp-2">
                          {preset.description}
                        </p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-1.5">
                  <textarea
                    rows={4}
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    className="w-full bg-slate-900/80 border border-slate-700/80 rounded-lg p-3 text-xs font-mono text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                  />
                  <p className="text-[10px] text-slate-500">
                    Always retain citation instructions ([Doc X]) and out-of-context guardrails to eliminate hallucinations.
                  </p>
                </div>
              )}
            </div>

            {/* Step 3: Visual Accent Color & Public Switch */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800">
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
                  Visibility
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
                    <span>Public Bot</span>
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

            {/* Submit Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 rounded-lg text-slate-950 text-xs font-bold transition-all shadow-lg flex items-center gap-2 cursor-pointer disabled:opacity-50"
                style={{ backgroundColor: colorCode }}
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Create Assistant</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
