"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

// ============================================
// SVG Icon Components
// ============================================

export const FolderBackIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 20 16"
    className={cn("w-full h-full fill-current", className)}
  >
    <path d="M7.5,0C7.4,0,2,0,2,0C0.9,0,0,0.9,0,2l0,12c0,1.1,0.9,2,2,2h16c1.1,0,2-0.9,2-2V4c0-1.1-0.9-2-2-2c0,0-7.5,0-8,0C9,2,9.9,0,7.5,0z" />
  </svg>
);

export const FolderCoverIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 20 16"
    className={cn("w-full h-full fill-current", className)}
  >
    <path d="M2,2h16c1.1,0,2,0.9,2,2v10c0,1.1-0.9,2-2,2H2c-1.1,0-2-0.9-2-2V4C0,2.9,0.9,2,2,2z" />
  </svg>
);

export const GlobeIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    className={cn("w-full h-full fill-current", className)}
  >
    <circle cx="12" cy="12" r="10" opacity="0.3" />
    <path d="M12,2C6.5,2,2,6.5,2,12s4.5,10,10,10s10-4.5,10-10S17.5,2,12,2z M12,20c-4.4,0-8-3.6-8-8s3.6-8,8-8s8,3.6,8,8S16.4,20,12,20z" />
  </svg>
);

// ============================================
// Types & Interfaces
// ============================================

export type FolderVariant =
  | "devi"
  | "rudras"
  | "ardra"
  | "shakti"
  | "kubera"
  | "hari"
  | "ravi"
  | "durga"
  | "nandi";

export interface FolderPreviewProps {
  variant?: FolderVariant;
  images?: string[];
  files?: { name: string; type?: "txt" | "gif" | "mp3" | "default" }[];
  label?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  onClick?: () => void;
  isHovered?: boolean;
}

// ============================================
// Color Schemes for Each Variant
// ============================================

const variantColors: Record<
  FolderVariant,
  {
    back: string;
    cover: string;
    deco: string;
    caption: string;
    bg: string;
  }
> = {
  devi: {
    back: "text-gray-500",
    cover: "text-gray-400",
    deco: "text-gray-400 brightness-125",
    caption: "text-gray-800 dark:text-gray-200",
    bg: "bg-gray-100 dark:bg-gray-900",
  },
  rudras: {
    back: "text-gray-700 dark:text-gray-600",
    cover: "text-gray-600 dark:text-gray-500",
    deco: "text-gray-400",
    caption: "text-blue-600 dark:text-blue-400",
    bg: "bg-slate-200 dark:bg-slate-800",
  },
  ardra: {
    back: "text-zinc-850",
    cover: "text-zinc-600",
    deco: "text-zinc-500",
    caption: "text-zinc-500",
    bg: "bg-zinc-900",
  },
  shakti: {
    back: "text-indigo-800",
    cover: "text-indigo-700",
    deco: "text-indigo-800",
    caption: "text-green-400",
    bg: "bg-blue-600 dark:bg-blue-800",
  },
  kubera: {
    back: "text-gray-900",
    cover: "text-gray-700",
    deco: "text-gray-600",
    caption: "text-gray-900 dark:text-gray-100",
    bg: "bg-emerald-400 dark:bg-emerald-600",
  },
  hari: {
    back: "text-blue-800",
    cover: "text-blue-700",
    deco: "text-blue-800",
    caption: "text-yellow-400",
    bg: "bg-sky-500 dark:bg-sky-700",
  },
  ravi: {
    back: "text-gray-900",
    cover: "text-gray-700",
    deco: "text-black dark:text-white",
    caption: "text-gray-900 dark:text-gray-100",
    bg: "bg-gray-200 dark:bg-gray-800",
  },
  durga: {
    back: "text-green-600",
    cover: "text-green-500",
    deco: "text-green-600",
    caption: "text-green-400 font-mono",
    bg: "bg-gray-900 dark:bg-black",
  },
  nandi: {
    back: "text-amber-500",
    cover: "text-amber-400",
    deco: "text-amber-500",
    caption: "text-gray-900 dark:text-gray-100",
    bg: "bg-green-100 dark:bg-green-950",
  },
};

// ============================================
// Size Configuration
// ============================================

const sizeConfig = {
  sm: {
    folder: "w-16",
    thumb: "w-10 h-10",
    deco: "w-4 h-4",
    caption: "text-[10px]",
  },
  md: {
    folder: "w-24",
    thumb: "w-14 h-14",
    deco: "w-6 h-6",
    caption: "text-xs",
  },
  lg: {
    folder: "w-32",
    thumb: "w-20 h-20",
    deco: "w-8 h-8",
    caption: "text-sm",
  },
};

// ============================================
// Main FolderPreview Component
// ============================================

export const FolderPreview = React.forwardRef<
  HTMLDivElement,
  FolderPreviewProps
>(
  (
    {
      variant = "devi",
      label,
      size = "md",
      className,
      onClick,
      isHovered: externalHover,
    },
    ref,
  ) => {
    const [localHover, setLocalHover] = React.useState(false);
    const isHovered = externalHover !== undefined ? externalHover : localHover;
    const colors = variantColors[variant];
    const sizes = sizeConfig[size];

    return (
      <div
        ref={ref}
        className={cn(
          "inline-flex flex-col items-center overflow-visible select-none",
          sizes.folder,
          className,
        )}
        onMouseEnter={() => setLocalHover(true)}
        onMouseLeave={() => setLocalHover(false)}
        onClick={onClick}
      >
        <div
          className="relative cursor-pointer aspect-[20/16] w-full"
          style={{ perspective: "800px" }}
        >
          {/* Back */}
          <div
            className={cn(
              "absolute inset-0 transition-colors duration-150",
              colors.back,
            )}
          >
            <FolderBackIcon />
          </div>

          {/* Cover */}
          <motion.div
            className={cn(
              "relative transition-colors duration-150",
              colors.cover,
            )}
            style={{
              transformOrigin: "50% 100%",
              transformStyle: "preserve-3d",
            }}
            animate={isHovered ? { rotateX: -30 } : { rotateX: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <FolderCoverIcon />
            <div
              className={cn(
                "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 mt-0.5",
                sizes.deco,
                colors.deco,
              )}
            >
              <GlobeIcon />
            </div>
          </motion.div>
        </div>

        {label && (
          <h3
            className={cn(
              "mt-2 font-medium text-center",
              sizes.caption,
              colors.caption,
            )}
          >
            {label}
          </h3>
        )}
      </div>
    );
  },
);

FolderPreview.displayName = "FolderPreview";
