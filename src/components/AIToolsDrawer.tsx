import React, { useState, useMemo } from "react";
import { X, Search, Sparkles, ExternalLink, Copy, Check, Layers, MessageSquare } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { AI_TOOLS_CATALOG, AI_TOOLS_CATEGORIES, AITool } from "../services/aiToolsCatalog";

interface AIToolsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onAskMentor?: (toolName: string) => void;
}

export default function AIToolsDrawer({ isOpen, onClose, onAskMentor }: AIToolsDrawerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const categories = useMemo(() => {
    return Object.entries(AI_TOOLS_CATEGORIES).map(([key, name]) => {
      const count = key === "All" 
        ? AI_TOOLS_CATALOG.length 
        : AI_TOOLS_CATALOG.filter(t => t.category === key).length;
      return { key, name, count };
    });
  }, []);

  const filteredTools = useMemo(() => {
    return AI_TOOLS_CATALOG.filter((tool) => {
      const matchesCategory = selectedCategory === "All" || tool.category === selectedCategory;
      const matchesSearch = 
        tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  const handleCopyLink = (url: string, toolName: string) => {
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(toolName);
      setTimeout(() => setCopiedId(null), 2000);
    }).catch(err => {
      console.error("Failed to copy link:", err);
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            id="ai-tools-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/70 z-40 backdrop-blur-sm pointer-events-auto"
          />

          {/* Sliding Drawer Panel */}
          <motion.div
            id="ai-tools-drawer"
            initial={{ x: "100%", opacity: 0.8 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0.8 }}
            transition={{ type: "spring", damping: 25, stiffness: 180 }}
            className="absolute top-0 right-0 h-full w-[90vw] sm:w-[500px] bg-[#09090b]/95 border-l border-white/10 z-50 shadow-2xl flex flex-col pointer-events-auto backdrop-blur-xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <Layers size={18} className="text-emerald-400" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-mono font-bold tracking-wider text-white uppercase">AI Tool Stack</span>
                  <span className="text-[10px] font-mono text-emerald-400/80 font-medium">60+ CURATED FREE AI SERVICES</span>
                </div>
              </div>
              <button
                id="close-ai-tools-drawer"
                onClick={onClose}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border border-white/10 transition-all cursor-pointer"
                title="Close Drawer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Sticky Search and Filter Controls */}
            <div className="px-6 py-4 bg-white/[0.02]/40 border-b border-white/5 flex flex-col gap-3 shrink-0">
              <div className="relative">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  id="ai-tools-search-input"
                  type="text"
                  placeholder="Search AI tools (e.g. background, logo, voice)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white/5 hover:bg-white/[0.08] focus:bg-white/[0.08] border border-white/10 focus:border-emerald-500/50 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-zinc-500 hover:text-white"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Horizontally Scrollable Categories Tab bar */}
              <div className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                {categories.map((cat) => {
                  const isActive = selectedCategory === cat.key;
                  return (
                    <button
                      key={cat.key}
                      onClick={() => setSelectedCategory(cat.key)}
                      className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono border transition-all cursor-pointer ${
                        isActive
                          ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300 shadow-md shadow-emerald-500/5"
                          : "bg-white/5 border-white/10 text-zinc-400 hover:text-zinc-200 hover:bg-white/10"
                      }`}
                    >
                      <span>{cat.name}</span>
                      <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-sans ${
                        isActive ? "bg-emerald-500/20 text-emerald-200" : "bg-white/10 text-zinc-500"
                      }`}>
                        {cat.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Scrollable Catalog Container */}
            <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4 scrollbar-none">
              {filteredTools.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-12 px-4 gap-3 self-center">
                  <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-500">
                    <Search size={20} className="animate-pulse" />
                  </div>
                  <div>
                    <p className="text-sm font-mono text-zinc-300 font-bold uppercase">No Tools Found</p>
                    <p className="text-xs text-zinc-500 max-w-xs mt-1 leading-relaxed">
                      We couldn't find any tools matching your query. Try searching for other keywords, or change the category tab!
                    </p>
                  </div>
                </div>
              ) : (
                filteredTools.map((tool) => {
                  const isCopied = copiedId === tool.name;
                  return (
                    <motion.div
                      key={tool.name}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="group flex flex-col gap-3 p-4 rounded-xl bg-white/[0.03] hover:bg-white/[0.05] border border-white/10 hover:border-emerald-500/30 transition-all duration-300"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors font-mono">
                              {tool.name}
                            </h4>
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-zinc-400 font-mono scale-95 origin-left">
                              {AI_TOOLS_CATEGORIES[tool.category]}
                            </span>
                          </div>
                        </div>

                        {/* Top corner standard link button */}
                        <a
                          href={tool.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg bg-white/5 border border-white/10 hover:border-emerald-500/30 hover:bg-emerald-500/10 text-zinc-400 hover:text-emerald-300 transition-all flex items-center justify-center cursor-pointer"
                          title={`Open ${tool.name} website`}
                        >
                          <ExternalLink size={12} />
                        </a>
                      </div>

                      <p className="text-xs text-zinc-400 leading-relaxed font-sans font-medium">
                        {tool.description}
                      </p>

                      <div className="flex justify-end items-center gap-1.5 pt-1.5 border-t border-white/5 shrink-0">
                        {onAskMentor && (
                          <button
                            onClick={() => onAskMentor(tool.name)}
                            className="mr-auto inline-flex items-center gap-1 px-2.5 py-1.2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 hover:border-emerald-500/30 text-[10px] text-emerald-300 font-mono tracking-wide uppercase transition-all cursor-pointer"
                            title={`Ask Token voice assistant about ${tool.name}`}
                          >
                            <MessageSquare size={10} />
                            <span>Ask Token</span>
                          </button>
                        )}

                        <button
                          onClick={() => handleCopyLink(tool.url, tool.name)}
                          className={`flex items-center gap-1 px-2.5 py-1.2 rounded-lg border transition-all text-[10px] font-mono tracking-wide uppercase cursor-pointer ${
                            isCopied
                              ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-300"
                              : "bg-white/5 border-white/10 text-zinc-400 hover:text-zinc-200 hover:bg-white/10"
                          }`}
                          title="Copy Tool URL"
                        >
                          {isCopied ? <Check size={10} /> : <Copy size={10} />}
                          <span>{isCopied ? "Copied" : "Copy Link"}</span>
                        </button>

                        <a
                          href={tool.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 px-2.5 py-1.2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-[10px] text-zinc-100 hover:text-white font-mono tracking-wide uppercase transition-all cursor-pointer"
                        >
                          <span>Launch</span>
                          <Sparkles size={10} className="text-emerald-400" />
                        </a>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-black/60 border-t border-white/10 text-center shrink-0">
              <p className="text-[10px] font-mono text-zinc-500 font-medium">
                Contributed by <a href="https://github.com/harryramoliya01" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 underline transition-colors">harryramoliya01</a> • Integrated by Build Agent
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
