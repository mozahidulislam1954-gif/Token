import React, { useState, useMemo } from "react";
import { X, Search, Sparkles, ExternalLink, Copy, Check, Layers, MessageSquare } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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
            className="absolute inset-0 bg-slate-900/40 z-40 backdrop-blur-sm pointer-events-auto"
          />

          {/* Sliding Drawer Panel */}
          <motion.div
            id="ai-tools-drawer"
            initial={{ x: "100%", opacity: 0.8 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0.8 }}
            transition={{ type: "spring", damping: 25, stiffness: 180 }}
            className="absolute top-0 right-0 h-full w-[90vw] sm:w-[500px] nm-card border-l border-white/10 z-50 shadow-2xl flex flex-col pointer-events-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl nm-inset-card">
                  <Layers size={16} className="text-emerald-400" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold tracking-wide text-white uppercase">AI Tool Stack</span>
                  <span className="text-[9px] font-mono text-slate-400 font-bold tracking-widest leading-none mt-0.5">60+ CURATED FREE AI SERVICES</span>
                </div>
              </div>
              <button
                id="close-ai-tools-drawer"
                onClick={onClose}
                className="p-2 rounded-full nm-btn-sm text-slate-400 hover:text-white shrink-0 cursor-pointer"
                title="Close Drawer"
              >
                <X size={15} />
              </button>
            </div>

            {/* Sticky Search and Filter Controls */}
            <div className="px-6 py-4 bg-transparent border-b border-white/10 flex flex-col gap-4 shrink-0">
              <div className="relative">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-450" />
                <input
                  id="ai-tools-search-input"
                  type="text"
                  placeholder="Search AI tools (e.g. background, logo, voice)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full nm-inset-card rounded-2xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-400 outline-none transition-all font-semibold"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-500 hover:text-red-500 transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Horizontally Scrollable Categories Tab bar */}
              <div className="flex gap-2.5 overflow-x-auto pb-1.5 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                {categories.map((cat) => {
                  const isActive = selectedCategory === cat.key;
                  return (
                    <button
                      key={cat.key}
                      onClick={() => setSelectedCategory(cat.key)}
                      className={`shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        isActive
                          ? "nm-inset-card text-emerald-400 scale-98"
                          : "nm-btn text-slate-300 hover:text-white hover:scale-[1.02]"
                      }`}
                    >
                      <span>{cat.name}</span>
                      <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${
                        isActive ? "nm-inset-card text-emerald-400" : "bg-white/10 text-slate-400"
                      }`}>
                        {cat.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Scrollable Catalog Container */}
            <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5 scrollbar-none bg-transparent">
              {filteredTools.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-12 px-4 gap-4 self-center">
                  <div className="w-16 h-16 rounded-full nm-inset-card flex items-center justify-center text-slate-400">
                    <Search size={24} className="animate-pulse text-slate-400" />
                  </div>
                  <div>
                    <p className="text-sm font-mono text-white font-bold uppercase tracking-wider">No Tools Found</p>
                    <p className="text-xs text-slate-400 max-w-xs mt-1.5 leading-relaxed">
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
                      className="group flex flex-col gap-3 p-5 rounded-2xl nm-flat hover:-translate-y-0.5 transition-all duration-300"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-sm font-extrabold text-white group-hover:text-emerald-400 transition-colors">
                              {tool.name}
                            </h4>
                            <span className="text-[9px] px-2 py-0.5 rounded-lg nm-inset-card text-slate-400 font-bold tracking-wider">
                              {AI_TOOLS_CATEGORIES[tool.category]}
                            </span>
                          </div>
                        </div>

                        {/* Top corner standard link button */}
                        <a
                          href={tool.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-xl nm-btn-sm text-slate-400 hover:text-emerald-400 transition-all flex items-center justify-center cursor-pointer"
                          title={`Open ${tool.name} website`}
                        >
                          <ExternalLink size={12} />
                        </a>
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed font-semibold">
                        {tool.description}
                      </p>

                      <div className="flex justify-end items-center gap-2 pt-3 border-t border-white/10 shrink-0">
                        {onAskMentor && (
                          <button
                            onClick={() => onAskMentor(tool.name)}
                            className="mr-auto inline-flex items-center gap-1 px-3 py-1.5 rounded-xl nm-btn-sm text-[10px] text-emerald-400 font-bold uppercase transition-all cursor-pointer"
                            title={`Ask Token voice assistant about ${tool.name}`}
                          >
                            <MessageSquare size={10} className="text-emerald-400 mr-0.5" />
                            <span>Ask Agent</span>
                          </button>
                        )}

                        <button
                          onClick={() => handleCopyLink(tool.url, tool.name)}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-xl transition-all text-[10px] font-bold uppercase cursor-pointer ${
                            isCopied
                              ? "nm-inset-card text-emerald-400 scale-95"
                              : "nm-btn text-slate-300 hover:text-white"
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
                          className="flex items-center gap-1 px-3 py-1.5 rounded-xl nm-btn text-[10px] text-slate-200 font-bold uppercase transition-all cursor-pointer hover:text-white"
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
            <div className="p-4 bg-white/5 border-t border-white/10 text-center shrink-0">
              <p className="text-[9px] font-mono text-slate-400 font-medium">
                Contributed by <a href="https://github.com/harryramoliya01" target="_blank" rel="noopener noreferrer" className="hover:text-slate-200 underline transition-colors">harryramoliya01</a> • Integrated by Build Agent
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
