"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  SearchIcon,
  HomeIcon,
  GitPullRequestIcon,
  CommentIcon,
  OrganizationIcon,
  GraphIcon,
  XIcon,
} from "@primer/octicons-react";

interface CommandMenuProps {
  isOpen: boolean;
  onClose: () => void;
  pages: readonly string[];
  activePage: string;
  onSelectPage: (page: string) => void;
}

const PAGE_ICONS: Record<
  string,
  React.ComponentType<{ className?: string; size?: number }>
> = {
  Dashboard: HomeIcon,
  "Issues & PRs": GitPullRequestIcon,
  "Reviews & Comments": CommentIcon,
  Organizations: OrganizationIcon,
  GitStats: GraphIcon,
};

const PAGE_DESCRIPTIONS: Record<string, string> = {
  Dashboard: "Overview, contribution metrics & recent streaks",
  "Issues & PRs": "Pull requests & issues breakdown",
  "Reviews & Comments": "Code review workload & discussions",
  Organizations: "Affiliated organizations & team stats",
  GitStats: "Developer persona, commit timeline & velocity",
};

export function CommandMenu({
  isOpen,
  onClose,
  pages,
  activePage,
  onSelectPage,
}: CommandMenuProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const filteredPages = pages.filter((page) =>
    page.toLowerCase().includes(searchQuery.trim().toLowerCase()),
  );

  // Focus input and reset search when opened
  useEffect(() => {
    if (isOpen) {
      setSearchQuery("");
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Keep selected index within bounds
  useEffect(() => {
    if (selectedIndex >= filteredPages.length) {
      setSelectedIndex(Math.max(0, filteredPages.length - 1));
    }
  }, [filteredPages.length, selectedIndex]);

  // Handle keyboard events (ArrowUp, ArrowDown, Enter, Escape)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev < filteredPages.length - 1 ? prev + 1 : 0,
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev > 0 ? prev - 1 : filteredPages.length - 1,
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredPages[selectedIndex]) {
        onSelectPage(filteredPages[selectedIndex]);
        onClose();
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/75 backdrop-blur-md cursor-pointer"
          />

          {/* Dialog Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -8 }}
            transition={{ type: "spring", duration: 0.2, bounce: 0 }}
            className="relative w-full max-w-lg bg-[#0e0e11] border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col font-sans"
            onKeyDown={handleKeyDown}
          >
            {/* Search Input Bar */}
            <div className="flex items-center px-4 py-3.5 border-b border-zinc-800/80 gap-3">
              <SearchIcon size={18} className="text-zinc-400 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSelectedIndex(0);
                }}
                placeholder="Search pages or navigate..."
                className="w-full bg-transparent text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none"
              />
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    inputRef.current?.focus();
                  }}
                  className="text-zinc-500 hover:text-zinc-300 p-1"
                >
                  <XIcon size={14} />
                </button>
              ) : (
                <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-zinc-400 bg-zinc-900 border border-zinc-700/60 rounded">
                  ESC
                </kbd>
              )}
            </div>

            {/* Pages List */}
            <div
              ref={listRef}
              className="max-h-72 overflow-y-auto p-2 space-y-1 select-none"
            >
              <div className="px-2 py-1.5 text-[11px] font-mono uppercase tracking-wider text-zinc-500">
                Pages
              </div>

              {filteredPages.length === 0 ? (
                <div className="py-8 text-center text-sm text-zinc-500">
                  No pages found matching &ldquo;{searchQuery}&rdquo;
                </div>
              ) : (
                filteredPages.map((page, index) => {
                  const Icon = PAGE_ICONS[page] || HomeIcon;
                  const isCurrent = page === activePage;
                  const isHighlighted = index === selectedIndex;
                  const description = PAGE_DESCRIPTIONS[page];

                  return (
                    <div
                      key={page}
                      onClick={() => {
                        onSelectPage(page);
                        onClose();
                      }}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                        isHighlighted
                          ? "bg-zinc-800/80 text-white"
                          : "text-zinc-300 hover:bg-zinc-900"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`p-1.5 rounded-md flex items-center justify-center ${
                            isHighlighted
                              ? "bg-zinc-700 text-white"
                              : "bg-zinc-900 text-zinc-400 border border-zinc-800"
                          }`}
                        >
                          <Icon size={16} />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-medium tracking-wide truncate">
                            {page}
                          </span>
                          {description && (
                            <span className="text-xs text-zinc-500 truncate">
                              {description}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 ml-3">
                        {isCurrent && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Current
                          </span>
                        )}
                        {isHighlighted && (
                          <span className="text-xs font-mono text-zinc-400">
                            ↵
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer with key hints */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-900/60 border-t border-zinc-800/80 text-[11px] font-mono text-zinc-400">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <kbd className="px-1 py-0.5 bg-zinc-800 border border-zinc-700 rounded text-[10px]">
                    ↑
                  </kbd>
                  <kbd className="px-1 py-0.5 bg-zinc-800 border border-zinc-700 rounded text-[10px]">
                    ↓
                  </kbd>
                  <span>Navigate</span>
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-zinc-800 border border-zinc-700 rounded text-[10px]">
                    ↵
                  </kbd>
                  <span>Select</span>
                </span>
              </div>
              <div className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-zinc-800 border border-zinc-700 rounded text-[10px]">
                  esc
                </kbd>
                <span>Close</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
