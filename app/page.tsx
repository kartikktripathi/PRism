"use client";

import { useState, useEffect } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { LiquidOcean } from "@/components/ui/liquid-ocean";

export default function Home() {
  const { data: session } = useSession();
  const [prs, setPrs] = useState<any[]>([]);
  const [username, setUsername] = useState<string | null>(null);
  const [position, setPosition] = useState({
    x: 0,
    y: 0,
  });
  const [selectedTab, setSelectedTab] = useState('dashboard');

  const [dragging, setDragging] = useState(false);

  const [dragOffset, setDragOffset] = useState({
    x: 0,
    y: 0,
  });

  function handleTabChange(tab: string) {
    setSelectedTab(tab);
  }

  useEffect(() => {
    if (session) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        signIn("github");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [session]);

  async function fetchUser() {
    const res = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${session?.accessToken}`,
      },
    });

    const data = await res.json();
    console.log("User:", data);
    setUsername(data.login);
  }

  async function fetchPRs() {
    if (!username) {
      alert("Fetch user first");
      return;
    }

    const res = await fetch(
      `https://api.github.com/search/issues?q=is:pr+author:${username}`,
      {
        headers: {
          Authorization: `Bearer ${session?.accessToken}`,
        },
      }
    );

    const data = await res.json();
    console.log("PRs:", data);
    setPrs(data.items || []);
  }

  function handleMouseDown(e: React.MouseEvent) {
    setDragging(true);

    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  }

  useEffect(() => {
    function handleMouseMove(e: MouseEvent) {
      if (!dragging) return;

      setPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y,
      });
    }

    function handleMouseUp() {
      setDragging(false);
    }

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragging, dragOffset]);

  if (!session) {
    return (
      <main className="relative min-h-screen bg-[#09090b] text-[#a1a1aa] font-mono flex flex-col items-center justify-center p-4 overflow-hidden select-none">
        <div className="absolute inset-0 z-0">
          <LiquidOcean
            oceanFragments={100}
            boatCount={0}
            boatSpread={8}
            waveAmplitude={0.1}
            showGrid={false}
          />

        </div>

        <div className="w-full max-w-lg relative z-10" style={{
          left: position.x,
          top: position.y,
        }}>

          <div className="rounded-lg bg-zinc-950/70 backdrop-blur-md shadow-2xl overflow-hidden">

            <div onMouseDown={handleMouseDown} className="cursor-move flex items-center justify-between px-4 py-3 border-b border-zinc-800/60 bg-zinc-900/20">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-zinc-800 hover:bg-red-500 cursor-pointer" />
                <span className="w-2.5 h-2.5 rounded-full bg-zinc-800 hover:bg-yellow-500 cursor-pointer" />
                <span className="w-2.5 h-2.5 rounded-full bg-zinc-800 hover:bg-green-500 cursor-pointer" />
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 justify-center">
                <span>http://localhost:3000/</span>
              </div>
              <div className="w-10" />
            </div>

            <div className="p-6 md:p-8 space-y-6">

              <div className="space-y-2 text-center flex flex-col items-center">
                <img src="/logo.png" className="w-48 h-24 object-contain" alt="PRism Logo" />
                <h1 className="text-base text-zinc-200 font-semibold tracking-wide font-sans">
                  <span className="text-emerald-500 font-bold">❯</span> PRism — An Open Sourcerer's Playground
                </h1>
                <p className="text-xs text-zinc-500 leading-relaxed font-sans">
                  A simple dashboard to track, review, and merge pull requests. No bloat, no complex tracking. Just your repo queue in one spot.
                </p>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => signIn("github")}
                  className="group relative w-full flex items-center justify-between rounded-md border border-zinc-800 bg-zinc-900/30 hover:bg-white hover:text-black hover:border-white p-3.5 transition-all duration-150 cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.483 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.137 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                    </svg>
                    <span className="text-xs font-semibold tracking-wide font-mono">Authenticate with GitHub</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-zinc-500 group-hover:text-black">
                    <span className="text-[10px] font-mono">Enter</span>
                    <span className="px-1 py-0.5 rounded border border-zinc-800 group-hover:border-zinc-300 text-[9px] font-mono">⏎</span>
                  </div>
                </button>
              </div>

              <div className="flex items-center justify-between text-[10px] text-zinc-600 border-t border-zinc-900/60 pt-4">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500/80 animate-pulse" />
                  <span>status: unauthenticated</span>
                </div>
                <div className="flex items-center gap-1">
                  <span>press [Enter] anywhere to continue</span>
                </div>
              </div>

            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#09090b] text-white">
      <header>
        PRism
      </header>

      <div>
        <aside>
          <button onClick={() => handleTabChange('Dashboard')}>Dashboard</button>
          <button onClick={() => handleTabChange('Pull Requests')}>Pull Requests</button>
          <button onClick={() => handleTabChange('Reviews')}>Reviews</button>
          <button onClick={() => handleTabChange('Comments')}>Comments</button>
          <button onClick={() => handleTabChange('Organizations')}>Organizations</button>
        </aside>

        <section>
          {selectedTab}
        </section>
      </div>
    </main>
  );
}