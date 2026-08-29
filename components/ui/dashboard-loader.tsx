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

export function DashboardLoader(
  {}: DashboardLoaderProps = {} as DashboardLoaderProps,
) {
  const [showSlowMessage, setShowSlowMessage] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setShowSlowMessage(true);
    }, 10000);

    return () => clearTimeout(timer);
  }, []);

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
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>

      <div className="flex flex-col items-center">
        <div className="relative animate-scale-pulse">
          <img
            src="/logo.png"
            className="w-64 h-32 object-contain"
            alt="PRism Logo"
          />
        </div>
        <p className="text-zinc-500 font-mono text-[11px] tracking-wider uppercase">
          Hit the PRism logo to sync your GitHub data
        </p>
        {showSlowMessage && (
          <p className="text-zinc-600 font-mono text-[10px] tracking-wider mt-2 animate-fade-in text-center">
            taking longer than usual..
          </p>
        )}
      </div>
    </div>
  );
}
