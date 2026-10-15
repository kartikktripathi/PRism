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
  Dashboard: "Overview & streaks",
  "Issues & PRs": "Pull requests & issues",
  "Reviews & Comments": "Reviews & discussions",
  Organizations: "Teams & affiliated orgs",
  GitStats: "Velocity & developer stats",
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

  // Handle keyboard events (ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Enter, Escape)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const total = filteredPages.length;
    if (total === 0) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
      return;
    }

    if (e.key === "ArrowRight") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % total);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + total) % total);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (total === 5) {
        // Row 1 (0, 1, 2) -> Row 2 (3, 4)
        if (selectedIndex === 0) setSelectedIndex(3);
        else if (selectedIndex === 1) setSelectedIndex(4);
        else if (selectedIndex === 2) setSelectedIndex(4);
        else if (selectedIndex === 3) setSelectedIndex(0);
        else if (selectedIndex === 4) setSelectedIndex(1);
      } else {
        setSelectedIndex((prev) => (prev + 1) % total);
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (total === 5) {
        // Row 2 (3, 4) -> Row 1 (0, 1, 2)
        if (selectedIndex === 3) setSelectedIndex(0);
        else if (selectedIndex === 4) setSelectedIndex(1);
        else if (selectedIndex === 0) setSelectedIndex(3);
        else if (selectedIndex === 1) setSelectedIndex(4);
        else if (selectedIndex === 2) setSelectedIndex(4);
      } else {
        setSelectedIndex((prev) => (prev - 1 + total) % total);
      }
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

  const row1 = filteredPages.slice(0, 3);
  const row2 = filteredPages.slice(3, 5);

  const renderCard = (page: string, index: number) => {
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
        className={`relative w-[145px] sm:w-[155px] h-[132px] p-3.5 rounded-xl cursor-pointer transition-all flex flex-col items-center justify-center text-center select-none ${
          isHighlighted
            ? "bg-zinc-800/90 border-zinc-600 shadow-xl scale-[1.03] text-white ring-1 ring-zinc-500/30"
            : "bg-zinc-900/60 border border-zinc-800/80 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-900/90 hover:scale-[1.01]"
        }`}
      >
        {isCurrent && (
          <span className="absolute top-2 right-2 flex items-center gap-1 text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Active
          </span>
        )}

        <div
          className={`w-10 h-10 rounded-lg flex items-center justify-center mb-2 transition-all ${
            isHighlighted
              ? "bg-white/10 text-white shadow-inner scale-105"
              : "bg-zinc-950/70 text-zinc-400 border border-zinc-800"
          }`}
        >
          <Icon size={20} />
        </div>

        <span className="text-xs font-semibold tracking-wide leading-tight line-clamp-1">
          {page}
        </span>

        {description && (
          <span className="text-[10px] text-zinc-500 mt-1 leading-tight line-clamp-1 max-w-[125px]">
            {description}
          </span>
        )}
      </div>
    );
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
            className="relative w-full max-w-xl bg-[#0e0e11] border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col font-sans"
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
                  className="text-zinc-500 hover:text-zinc-300 p-1 cursor-pointer"
                >
                  <XIcon size={14} />
                </button>
              ) : (
                <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-zinc-400 bg-zinc-900 border border-zinc-700/60 rounded">
                  ESC
                </kbd>
              )}
            </div>

            {/* Pages Grid Area */}
            <div
              ref={listRef}
              className="p-5 overflow-y-auto max-h-[380px] select-none flex flex-col items-center justify-center"
            >
              <div className="w-full flex items-center justify-between px-2 pb-3 text-[11px] font-mono uppercase tracking-wider text-zinc-500">
                <span>Navigate Pages</span>
                <span className="text-[10px]">
                  {filteredPages.length} {filteredPages.length === 1 ? "page" : "pages"}
                </span>
              </div>

              {filteredPages.length === 0 ? (
                <div className="py-12 text-center text-sm text-zinc-500">
                  No pages found matching &ldquo;{searchQuery}&rdquo;
                </div>
              ) : (
                <div className="flex flex-col gap-3 items-center w-full">
                  {/* First row: 3 items (centered) */}
                  <div className="flex flex-wrap items-center justify-center gap-3 w-full">
                    {row1.map((page, idx) => renderCard(page, idx))}
                  </div>

                  {/* Second row: 2 items (centered) */}
                  {row2.length > 0 && (
                    <div className="flex flex-wrap items-center justify-center gap-3 w-full">
                      {row2.map((page, idx) => renderCard(page, idx + 3))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer with key hints */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-900/60 border-t border-zinc-800/80 text-[11px] font-mono text-zinc-400">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <kbd className="px-1 py-0.5 bg-zinc-800 border border-zinc-700 rounded text-[10px]">
                    ←
                  </kbd>
                  <kbd className="px-1 py-0.5 bg-zinc-800 border border-zinc-700 rounded text-[10px]">
                    ↑
                  </kbd>
                  <kbd className="px-1 py-0.5 bg-zinc-800 border border-zinc-700 rounded text-[10px]">
                    ↓
                  </kbd>
                  <kbd className="px-1 py-0.5 bg-zinc-800 border border-zinc-700 rounded text-[10px]">
                    →
                  </kbd>
                  <span className="ml-1">Navigate</span>
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

