"use client";

import React from "react";

export interface LoadStatus {
  status: "idle" | "loading" | "success" | "error";
  errorCount: number;
}

export interface LoadStates {
  user: LoadStatus;
  repos: LoadStatus;
  prs: LoadStatus;
  topRepos: LoadStatus;
  contributions: LoadStatus;
  notifications: LoadStatus;
}

interface DashboardLoaderProps {
  loadStates: LoadStates;
}

export function DashboardLoader({ loadStates }: DashboardLoaderProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black select-none overflow-hidden">
      {/* Pulse keyframes style block */}
      <style>{`
        @keyframes scale-pulse {
          0%, 100% {
            transform: scale(0.9);
            opacity: 0.8;
          }
          50% {
            transform: scale(1.1);
            opacity: 1;
          }
        }
        .animate-scale-pulse {
          animation: scale-pulse 3s ease-in-out infinite;
        }
      `}</style>

      <div className="relative animate-scale-pulse">
        <img
          src="/logo.png"
          className="w-64 h-32 object-contain"
          alt="PRism Logo"
        />
      </div>
    </div>
  );
}
