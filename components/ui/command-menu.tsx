"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  HomeIcon,
  GitPullRequestIcon,
  CommentIcon,
  OrganizationIcon,
  GraphIcon,
  XIcon,
} from "@primer/octicons-react";
import { Montserrat } from "next/font/google";

const montserrat = Montserrat({ subsets: ["latin"] });

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
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Focus active page when modal opens
  useEffect(() => {
    if (isOpen) {
      const activeIdx = pages.indexOf(activePage);
      setSelectedIndex(activeIdx >= 0 ? activeIdx : 0);
    }
  }, [isOpen, activePage, pages]);

  // Global window keydown listener for seamless arrow and enter navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const total = pages.length;
      if (total === 0) return;

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
          setSelectedIndex((prev) => {
            if (prev === 0) return 3;
            if (prev === 1) return 4;
            if (prev === 2) return 4;
            if (prev === 3) return 0;
            if (prev === 4) return 1;
            return (prev + 1) % total;
          });
        } else {
          setSelectedIndex((prev) => (prev + 1) % total);
        }
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        if (total === 5) {
          // Row 2 (3, 4) -> Row 1 (0, 1, 2)
          setSelectedIndex((prev) => {
            if (prev === 3) return 0;
            if (prev === 4) return 1;
            if (prev === 0) return 3;
            if (prev === 1) return 4;
            if (prev === 2) return 4;
            return (prev - 1 + total) % total;
          });
        } else {
          setSelectedIndex((prev) => (prev - 1 + total) % total);
        }
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (pages[selectedIndex]) {
          onSelectPage(pages[selectedIndex]);
          onClose();
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, selectedIndex, pages, onSelectPage, onClose]);

  const row1 = pages.slice(0, 3);
  const row2 = pages.slice(3, 5);

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
        className={`relative w-[150px] sm:w-[160px] h-[135px] p-3.5 rounded-xl cursor-pointer border transition-all duration-150 flex flex-col items-center justify-center text-center select-none ${
          isHighlighted
            ? isCurrent
              ? "bg-zinc-800 border-zinc-500 ring-1 ring-white/20 shadow-xl text-white"
              : "bg-zinc-800/80 border-zinc-700 shadow-lg text-white"
            : isCurrent
              ? "bg-zinc-800/60 border-zinc-600 ring-1 ring-white/10 text-white shadow-sm hover:border-zinc-500 hover:bg-zinc-800/80"
              : "bg-zinc-900/60 border-zinc-800/80 text-zinc-400 hover:border-zinc-700 hover:bg-zinc-900/90 hover:text-zinc-200"
        }`}
      >
        <div
          className={`w-11 h-11 rounded-lg flex items-center justify-center mb-2.5 transition-colors border ${
            isHighlighted
              ? isCurrent
                ? "bg-zinc-800 text-white border-zinc-600"
                : "bg-zinc-800 text-white border-zinc-700"
              : isCurrent
                ? "bg-zinc-800/80 text-white border-zinc-700"
                : "bg-zinc-950/70 text-zinc-500 border-zinc-800"
          }`}
        >
          <Icon size={22} />
        </div>

        <span className="text-xs font-semibold tracking-wide leading-tight line-clamp-1">
          {page}
        </span>

        {description && (
          <span
            className={`text-[10px] mt-1 leading-tight line-clamp-1 max-w-[130px] ${
              isCurrent ? "text-zinc-400" : "text-zinc-500"
            }`}
          >
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
          >
            {/* Header */}
            <div
              className={`flex items-center justify-center px-6 py-4 border-b border-zinc-800/80 ${montserrat.className}`}
            >
              Command Menu
            </div>

            {/* Pages Grid Area */}
            <div className="p-6 select-none flex flex-col items-center justify-center">
              <div className="flex flex-col gap-3.5 items-center w-full">
                {/* First row: 3 items (centered) */}
                <div className="flex flex-wrap items-center justify-center gap-3.5 w-full">
                  {row1.map((page, idx) => renderCard(page, idx))}
                </div>

                {/* Second row: 2 items (centered) */}
                {row2.length > 0 && (
                  <div className="flex flex-wrap items-center justify-center gap-3.5 w-full">
                    {row2.map((page, idx) => renderCard(page, idx + 3))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer with key hints */}
            <div className="flex items-center justify-between px-6 py-3 bg-zinc-900/60 border-t border-zinc-800/80 text-[11px] font-mono text-zinc-400">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-zinc-800 border border-zinc-700 rounded text-[10px]">
                    ←
                  </kbd>
                  <kbd className="px-1.5 py-0.5 bg-zinc-800 border border-zinc-700 rounded text-[10px]">
                    ↑
                  </kbd>
                  <kbd className="px-1.5 py-0.5 bg-zinc-800 border border-zinc-700 rounded text-[10px]">
                    ↓
                  </kbd>
                  <kbd className="px-1.5 py-0.5 bg-zinc-800 border border-zinc-700 rounded text-[10px]">
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
