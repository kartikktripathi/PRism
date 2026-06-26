"use client";

import React, { useState, useEffect, useCallback } from "react";

interface GitStatsProps {
  session: {
    accessToken?: string;
  } | null;
  username: string | null;
}

interface MonthlyStat {
  month: string;
  commits: number;
  repositories: number;
  pullRequests: number;
  issues: number;
  reviews: number;
  commitHistory: number[];
}

function getPastMonths(count: number = 6) {
  const months = [];
  const now = new Date();
  
  for (let i = 0; i < count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = d.getFullYear();
    const month = d.getMonth();
    
    const from = new Date(Date.UTC(year, month, 1, 0, 0, 0));
    const to = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59));
    
    const label = d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    
    months.push({
      label,
      from: from.toISOString(),
      to: to.toISOString()
    });
  }
  return months;
}

function MiniBarChart({ data }: { data: number[] }) {
  const activityData = data && data.length > 0 ? data : Array.from({ length: 30 }, () => 0);
  const maxVal = Math.max(...activityData, 1);
  const totalActivity = activityData.reduce((a, b) => a + b, 0);

  return (
    <div className="mt-4 pt-3.5 border-t border-zinc-900/60">
      <div className="text-[10px] text-zinc-500 mb-2 font-mono flex justify-between select-none">
        <span>Daily Activity</span>
        <span>{totalActivity} contributions</span>
      </div>
      <div className="h-10 flex items-end gap-[3px] w-full">
        {activityData.map((activity, idx) => {
          const heightPercent = (activity / maxVal) * 100;
          return (
            <div
              key={idx}
              className="group relative flex-1 h-full flex items-end cursor-default"
            >
              {/* Bar */}
              <div
                style={{ height: `${Math.max(heightPercent, activity > 0 ? 15 : 5)}%` }}
                className={`w-full rounded-[1px] transition-all duration-150 ${
                  activity > 0
                    ? "bg-emerald-500/80 group-hover:bg-emerald-400 group-hover:shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                    : "bg-zinc-800/40"
                }`}
              />
              
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:flex flex-col items-center pointer-events-none z-10">
                <div className="bg-zinc-950 border border-zinc-800 text-zinc-300 text-[9px] font-mono py-0.5 px-1.5 rounded shadow-2xl whitespace-nowrap">
                  Day {idx + 1}: {activity} {activity === 1 ? "contribution" : "contributions"}
                </div>
                <div className="w-1 h-1 bg-zinc-950 border-r border-b border-zinc-800 rotate-45 -mt-[3px]" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MonthlyStatCard({ stat, onClick }: { stat: MonthlyStat; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className={`rounded-lg border border-zinc-800 bg-zinc-950/30 p-5 flex flex-col font-sans transition-all duration-200 ${
        onClick ? "cursor-pointer hover:border-zinc-700 hover:bg-zinc-900/50 hover:scale-[1.01] active:scale-[0.99]" : ""
      }`}
    >
      {/* Card Header with Month Heading and subtle icon */}
      <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-zinc-900/60">
        <h3 className="text-lg font-semibold text-white tracking-wide">
          {stat.month}
        </h3>
        <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z" />
        </svg>
      </div>

      {/* Stats List */}
      <div className="space-y-3.5 font-mono text-xs">
        {/* Commits */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-zinc-500">
            <svg className="w-4 h-4 text-emerald-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="4" />
              <line x1="12" y1="2" x2="12" y2="8" />
              <line x1="12" y1="16" x2="12" y2="22" />
            </svg>
            <span>Commits</span>
          </div>
          <span className="font-bold text-emerald-400">{stat.commits}</span>
        </div>

        {/* Repositories */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-zinc-500">
            <svg className="w-4 h-4 text-zinc-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <span>Repositories</span>
          </div>
          <span className="font-bold text-zinc-200">{stat.repositories}</span>
        </div>

        {/* Pull Requests */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-zinc-500">
            <svg className="w-4 h-4 text-purple-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <circle cx="6" cy="18" r="2.5" />
              <circle cx="6" cy="6" r="2.5" />
              <circle cx="18" cy="6" r="2.5" />
              <path d="M6 8.5V15.5M18 8.5V12a3 3 0 0 1-3 3H9" />
            </svg>
            <span>Pull Requests</span>
          </div>
          <span className="font-bold text-purple-400">{stat.pullRequests}</span>
        </div>

        {/* Issues */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-zinc-500">
            <svg className="w-4 h-4 text-rose-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <circle cx="12" cy="16" r="0.8" fill="currentColor" />
            </svg>
            <span>Issues Opened</span>
          </div>
          <span className="font-bold text-rose-400">{stat.issues}</span>
        </div>

        {/* Reviews & Comments */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-zinc-500">
            <svg className="w-4 h-4 text-amber-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span>Reviews & Comments</span>
          </div>
          <span className="font-bold text-amber-400">{stat.reviews}</span>
        </div>
      </div>

      <MiniBarChart data={stat.commitHistory} />
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950/20 p-5 flex flex-col animate-pulse">
      <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-zinc-900/60">
        <div className="h-5 bg-zinc-800 rounded w-1/3" />
        <div className="h-4 w-4 bg-zinc-800 rounded-full" />
      </div>
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex justify-between items-center">
            <div className="flex items-center gap-2 w-1/2">
              <div className="w-4 h-4 bg-zinc-800 rounded-full animate-pulse" />
              <div className="h-3 bg-zinc-800 rounded w-2/3 animate-pulse" />
            </div>
            <div className="h-3 bg-zinc-800 rounded w-1/6 animate-pulse" />
          </div>
        ))}
      </div>

      <div className="mt-4 pt-3.5 border-t border-zinc-900/60 flex flex-col gap-2">
        <div className="h-3 bg-zinc-800 rounded w-1/4 animate-pulse" />
        <div className="h-10 flex items-end gap-[3px] w-full">
          {Array.from({ length: 30 }).map((_, idx) => (
            <div key={idx} className="bg-zinc-800/20 rounded-[1px] flex-1 h-2 animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function GitWrapped({ session, username }: GitStatsProps) {
  const [stats, setStats] = useState<MonthlyStat[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);

  const fetchMonthlyStats = useCallback(async () => {
    if (!username || !session?.accessToken) {
      setError("Please authenticate with GitHub to load your Git stats.");
      setLoading(false);
      return;
    }

    setError(null);
    try {
      const months = getPastMonths(6);
      const queryFields = months
        .map((m, idx) => `
          month_${idx}: contributionsCollection(from: "${m.from}", to: "${m.to}") {
            totalCommitContributions
            totalPullRequestContributions
            totalIssueContributions
            totalPullRequestReviewContributions
            commitContributionsByRepository(maxRepositories: 100) {
              repository {
                nameWithOwner
              }
            }
            contributionCalendar {
              weeks {
                contributionDays {
                  contributionCount
                  date
                }
              }
            }
          }
        `)
        .join("\n");

      const queryStr = `
        query userMonthlyStats($LOGIN: String!) {
          user(login: $LOGIN) {
            ${queryFields}
          }
        }
      `;

      const res = await fetch("https://api.github.com/graphql", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: queryStr,
          variables: {
            LOGIN: username,
          },
        }),
      });

      if (!res.ok) {
        throw new Error(`GraphQL request failed: ${res.statusText}`);
      }

      const json = await res.json();
      if (json.errors) {
        throw new Error(json.errors[0]?.message || "GitHub GraphQL error");
      }

      const userObj = json.data?.user;
      if (!userObj) {
        throw new Error("User data not found in response.");
      }

      const parsedStats: MonthlyStat[] = months.map((m, idx) => {
        const monthData = userObj[`month_${idx}`];
        
        // Extract commit counts per day
        const dayEntries: { date: string; count: number }[] = [];
        if (monthData?.contributionCalendar?.weeks) {
          const targetPrefix = m.from.substring(0, 7); // e.g. "2026-06"
          monthData.contributionCalendar.weeks.forEach((week: any) => {
            if (week.contributionDays) {
              week.contributionDays.forEach((day: any) => {
                if (day.date && day.date.startsWith(targetPrefix)) {
                  dayEntries.push({
                    date: day.date,
                    count: day.contributionCount || 0
                  });
                }
              });
            }
          });
        }
        dayEntries.sort((a, b) => a.date.localeCompare(b.date));
        const history = dayEntries.map((e) => e.count);

        return {
          month: m.label,
          commits: monthData?.totalCommitContributions || 0,
          repositories: monthData?.commitContributionsByRepository?.length || 0,
          pullRequests: monthData?.totalPullRequestContributions || 0,
          issues: monthData?.totalIssueContributions || 0,
          reviews: monthData?.totalPullRequestReviewContributions || 0,
          commitHistory: history,
        };
      });

      setStats(parsedStats);
    } catch (err: unknown) {
      console.error("Error fetching monthly stats:", err);
      const errMsg = err instanceof Error ? err.message : "Something went wrong while loading Git stats.";
      setError(errMsg);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [username, session]);

  useEffect(() => {
    if (username && session) {
      fetchMonthlyStats();
    }
  }, [username, session, fetchMonthlyStats]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchMonthlyStats();
  };

  if (selectedMonth) {
    return (
      <div className="space-y-8 select-none font-mono">
        <div>
          <button
            onClick={() => setSelectedMonth(null)}
            className="flex items-center gap-2 border border-zinc-800 bg-zinc-900/30 hover:bg-zinc-900/60 hover:border-zinc-700 hover:text-white text-zinc-400 font-mono text-xs px-3.5 py-2.5 rounded transition-all cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Git Stats
          </button>
        </div>

        <div>
          <h1 className="text-3xl font-semibold text-white tracking-wide font-sans">
            {selectedMonth}
          </h1>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 select-none">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-white tracking-wide">Git Stats</h1>
          <p className="text-xs text-zinc-500 mt-2 font-mono">
            Monthly breakdown of your GitHub contributions and activity.
          </p>
        </div>
        
        {username && session && (
          <button
            onClick={handleRefresh}
            disabled={loading || isRefreshing}
            className="self-start sm:self-center flex items-center gap-2 border border-zinc-850 bg-zinc-900/30 hover:bg-zinc-900/60 hover:border-zinc-700 hover:text-white text-zinc-400 font-mono text-xs px-3.5 py-2.5 rounded transition-all cursor-pointer disabled:opacity-50"
          >
            <svg
              className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-emerald-400" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89M9 11l3-3 3 3" />
            </svg>
            {isRefreshing ? "Refreshing..." : "Sync GitHub"}
          </button>
        )}
      </div>

      {/* Error state */}
      {error && (
        <div className="rounded-lg border border-red-900/30 bg-red-950/10 p-5 text-center space-y-3 font-mono text-xs text-red-400">
          <p>{error}</p>
          <button
            onClick={handleRefresh}
            className="border border-red-900/30 bg-red-950/20 hover:bg-red-950/30 px-4 py-2 rounded text-red-300 font-semibold cursor-pointer transition-colors"
          >
            Retry Fetch
          </button>
        </div>
      )}

      {/* Grid container */}
      {!error && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading
            ? Array.from({ length: 6 }).map((_, idx) => <SkeletonCard key={idx} />)
            : stats?.map((stat) => (
                <MonthlyStatCard
                  key={stat.month}
                  stat={stat}
                  onClick={() => setSelectedMonth(stat.month)}
                />
              ))
          }
        </div>
      )}
    </div>
  );
}
