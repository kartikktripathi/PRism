"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  GitPullRequestIcon,
  IssueOpenedIcon,
  SunIcon,
  BriefcaseIcon,
  TelescopeIcon,
  MoonIcon,
  EyeClosedIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  GraphIcon,
  StarIcon,
} from "@primer/octicons-react";
import { League_Spartan, Montserrat } from "next/font/google";
import { SpotlightCard } from "@/components/ui/spotlight-card";
import { AnimatedCounter } from "@/components/ui/animated-counter";

const leagueSpartan = League_Spartan({
  subsets: ["latin"],
});

const montserrat = Montserrat({
  subsets: ["latin"],
});

interface GitStatsProps {
  session: {
    accessToken?: string;
  } | null;
  username: string | null;
  onLoadComplete?: () => void;
}

interface MonthlyStat {
  month: string;
  commits: number;
  repositories: number;
  pullRequests: number;
  issues: number;
  reviews: number;
  commitHistory: number[];
  mostUsedLanguage: string;
  reposCreated: number;
}

interface TimeStats {
  day: number;
  afternoon: number;
  evening: number;
  night: number;
  percentages: {
    day: number;
    afternoon: number;
    evening: number;
    night: number;
  };
  persona: string;
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

    const label = d.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });

    months.push({
      label,
      from: from.toISOString(),
      to: to.toISOString(),
    });
  }
  return months;
}

function MiniBarChart({
  data,
  colorClass = "bg-emerald-500/80",
  hoverColorClass = "group-hover:bg-emerald-400 group-hover:shadow-[0_0_8px_rgba(16,185,129,0.5)]",
}: {
  data: number[];
  colorClass?: string;
  hoverColorClass?: string;
}) {
  const activityData =
    data && data.length > 0 ? data : Array.from({ length: 30 }, () => 0);
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
                style={{
                  height: `${Math.max(heightPercent, activity > 0 ? 15 : 5)}%`,
                }}
                className={`w-full rounded-[1px] transition-all duration-150 ${
                  activity > 0
                    ? `${colorClass} ${hoverColorClass}`
                    : "bg-zinc-800/40"
                }`}
              />

              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:flex flex-col items-center pointer-events-none z-10">
                <div className="bg-zinc-950 border border-zinc-800 text-zinc-300 text-[9px] font-mono py-0.5 px-1.5 rounded shadow-2xl whitespace-nowrap">
                  Day {idx + 1}: {activity}{" "}
                  {activity === 1 ? "contribution" : "contributions"}
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

function MonthlyStatCard({
  stat,
  onClick,
}: {
  stat: MonthlyStat;
  onClick?: () => void;
}) {
  return (
    <SpotlightCard
      spotlightColor="rgba(255, 255, 255, 0.08)"
      className={`rounded-lg transition-all duration-200 hover:translate-y-[-2px] hover:shadow-lg ${
        onClick ? "cursor-pointer" : ""
      }`}
    >
      <div
        onClick={onClick}
        className="flex flex-col justify-between h-full w-full font-sans"
      >
        {/* Card Header with Month Heading and subtle icon */}
        <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-zinc-900/60 w-full">
          <h3 className="text-lg font-semibold text-white tracking-wide">
            {stat.month}
          </h3>
          <svg
            className="w-4 h-4 text-zinc-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z"
            />
          </svg>
        </div>

        {/* Stats List */}
        <div className="space-y-3.5 font-mono text-xs w-full">
          {/* Commits */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-zinc-500">
              <svg
                className="w-4 h-4 text-emerald-500 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
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
              <svg
                className="w-4 h-4 text-zinc-400 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
              <span>Repositories</span>
            </div>
            <span className="font-bold text-zinc-200">{stat.repositories}</span>
          </div>

          {/* Pull Requests */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-zinc-500">
              <span className="flex items-center justify-center w-4 h-4 text-purple-400 flex-shrink-0">
                <GitPullRequestIcon size={16} />
              </span>
              <span>Pull Requests</span>
            </div>
            <span className="font-bold text-purple-400">
              {stat.pullRequests}
            </span>
          </div>

          {/* Issues */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-zinc-500">
              <span className="flex items-center justify-center w-4 h-4 text-rose-500 flex-shrink-0">
                <IssueOpenedIcon size={16} />
              </span>
              <span>Issues Opened</span>
            </div>
            <span className="font-bold text-rose-400">{stat.issues}</span>
          </div>

          {/* Reviews & Comments */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-zinc-500">
              <svg
                className="w-4 h-4 text-amber-500 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              <span>Reviews & Comments</span>
            </div>
            <span className="font-bold text-amber-400">{stat.reviews}</span>
          </div>
        </div>

        <div className="w-full">
          <MiniBarChart data={stat.commitHistory} />
        </div>
      </div>
    </SpotlightCard>
  );
}

function SkeletonCard() {
  return (
    <div className="border border-zinc-900/60 bg-zinc-950/20 rounded-lg p-5 flex flex-col animate-pulse">
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
            <div
              key={idx}
              className="bg-zinc-800/20 rounded-[1px] flex-1 h-2 animate-pulse"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

interface ThemeStyle {
  primary: string;
  primaryText: string;
  accentBg: string;
  accentBorder: string;
  glow: string;
  glowColor: string;
  spotlight: string;
  bgGradient: string;
  icon: React.ComponentType<any>;
  desc: string;
  themeTitle: string;
  barColor: string;
  barHoverColor: string;
  banner: string;
}

const personaThemes: Record<string, ThemeStyle> = {
  "Early-Bird Engineer": {
    primary: "amber-400",
    primaryText: "text-amber-400",
    accentBg: "bg-amber-950/20",
    accentBorder: "border-amber-500/30",
    glow: "shadow-amber-500/10",
    glowColor: "bg-amber-500",
    spotlight: "#fbbf24",
    bgGradient: "from-amber-950/10 via-zinc-950/50 to-zinc-950",
    icon: SunIcon,
    desc: "You conquer the codebase before the rest of the world wakes up. Armed with sunrise focus and early commits.",
    themeTitle: "Dawn Catalyst",
    barColor: "bg-amber-500/80",
    barHoverColor:
      "group-hover:bg-amber-400 group-hover:shadow-[0_0_8px_rgba(251,191,36,0.5)]",
    banner: "/morning.jpg",
  },
  "Post-Lunch Programmer": {
    primary: "emerald-400",
    primaryText: "text-emerald-400",
    accentBg: "bg-emerald-950/20",
    accentBorder: "border-emerald-500/30",
    glow: "shadow-emerald-500/10",
    glowColor: "bg-emerald-500",
    spotlight: "#34d399",
    bgGradient: "from-emerald-950/10 via-zinc-950/50 to-zinc-950",
    icon: BriefcaseIcon,
    desc: "You do your best work in the afternoon flow, bridging morning inspiration with solid, execution-focused releases.",
    themeTitle: "Midday Engine",
    barColor: "bg-emerald-500/80",
    barHoverColor:
      "group-hover:bg-emerald-400 group-hover:shadow-[0_0_8px_rgba(16,185,129,0.5)]",
    banner: "/afternoon.jpg",
  },
  "Shadow Scripter": {
    primary: "fuchsia-400",
    primaryText: "text-fuchsia-400",
    accentBg: "bg-fuchsia-950/20",
    accentBorder: "border-fuchsia-500/30",
    glow: "shadow-fuchsia-500/10",
    glowColor: "bg-fuchsia-500",
    spotlight: "#e879f9",
    bgGradient: "from-fuchsia-950/10 via-zinc-950/50 to-zinc-950",
    icon: TelescopeIcon,
    desc: "As daylight fades, your productivity rises. Navigating the twilight and evening hours with quiet, focused execution.",
    themeTitle: "Twilight Architect",
    barColor: "bg-fuchsia-500/80",
    barHoverColor:
      "group-hover:bg-fuchsia-400 group-hover:shadow-[0_0_8px_rgba(232,121,249,0.5)]",
    banner: "/evening.jpg",
  },
  "Nocturnal Developer": {
    primary: "violet-400",
    primaryText: "text-violet-400",
    accentBg: "bg-violet-950/20",
    accentBorder: "border-violet-500/30",
    glow: "shadow-violet-500/10",
    glowColor: "bg-violet-500",
    spotlight: "#a78bfa",
    bgGradient: "from-violet-950/10 via-zinc-950/50 to-zinc-950",
    icon: MoonIcon,
    desc: "A master of the midnight oil. Your keyboard clicks through the quiet of the night, turning caffeine and silence into clean code.",
    themeTitle: "Midnight Alchemist",
    barColor: "bg-violet-500/80",
    barHoverColor:
      "group-hover:bg-violet-400 group-hover:shadow-[0_0_8px_rgba(167,139,250,0.5)]",
    banner: "/night.jpg",
  },
  "Silent Achiever": {
    primary: "zinc-400",
    primaryText: "text-zinc-400",
    accentBg: "bg-zinc-900/20",
    accentBorder: "border-zinc-700/30",
    glow: "shadow-zinc-500/5",
    glowColor: "bg-zinc-500",
    spotlight: "#a1a1aa",
    bgGradient: "from-zinc-950/50 to-zinc-950",
    icon: EyeClosedIcon,
    desc: "Quiet, steady, and stealthy. Planning your next major contribution cycle behind the scenes.",
    themeTitle: "Stealth Strategist",
    barColor: "bg-zinc-500/80",
    barHoverColor:
      "group-hover:bg-zinc-400 group-hover:shadow-[0_0_8px_rgba(161,161,170,0.5)]",
    banner: "/night.jpg",
  },
};

export default function GitWrapped({
  session,
  username,
  onLoadComplete,
}: GitStatsProps) {
  const [stats, setStats] = useState<MonthlyStat[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [timeStats, setTimeStats] = useState<TimeStats | null>(null);
  const [loadingTimeStats, setLoadingTimeStats] = useState<boolean>(false);

  const counts = useMemo(() => {
    if (!stats) {
      return {
        commits: 0,
        pullRequests: 0,
        issues: 0,
        reviews: 0,
      };
    }
    return stats.reduce(
      (acc, curr) => ({
        commits: acc.commits + curr.commits,
        pullRequests: acc.pullRequests + curr.pullRequests,
        issues: acc.issues + curr.issues,
        reviews: acc.reviews + curr.reviews,
      }),
      { commits: 0, pullRequests: 0, issues: 0, reviews: 0 },
    );
  }, [stats]);

  const fetchMonthlyStats = useCallback(async () => {
    if (!username || !session?.accessToken) {
      setError("Please authenticate with GitHub to load your GitStats.");
      setLoading(false);
      onLoadComplete?.();
      return;
    }

    setError(null);
    try {
      const months = getPastMonths(6);
      const queryFields = months
        .map(
          (m, idx) => `
          month_${idx}: contributionsCollection(from: "${m.from}", to: "${m.to}") {
            totalCommitContributions
            totalPullRequestContributions
            totalIssueContributions
            totalPullRequestReviewContributions
            totalRepositoryContributions
            commitContributionsByRepository(maxRepositories: 100) {
              contributions {
                totalCount
              }
              repository {
                nameWithOwner
                primaryLanguage {
                  name
                }
              }
            }
            pullRequestReviewContributionsByRepository(maxRepositories: 100) {
              contributions {
                totalCount
              }
              repository {
                nameWithOwner
                primaryLanguage {
                  name
                }
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
        `,
        )
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
                    count: day.contributionCount || 0,
                  });
                }
              });
            }
          });
        }
        dayEntries.sort((a, b) => a.date.localeCompare(b.date));
        const history = dayEntries.map((e) => e.count);

        // Calculate language scores based on commits and reviews in repositories
        const languageScores: { [name: string]: number } = {};

        if (monthData?.commitContributionsByRepository) {
          monthData.commitContributionsByRepository.forEach((c: any) => {
            const lang = c.repository?.primaryLanguage?.name;
            const count = c.contributions?.totalCount || 0;
            if (lang && count > 0) {
              languageScores[lang] = (languageScores[lang] || 0) + count;
            }
          });
        }

        if (monthData?.pullRequestReviewContributionsByRepository) {
          monthData.pullRequestReviewContributionsByRepository.forEach(
            (r: any) => {
              const lang = r.repository?.primaryLanguage?.name;
              const count = r.contributions?.totalCount || 0;
              if (lang && count > 0) {
                languageScores[lang] = (languageScores[lang] || 0) + count;
              }
            },
          );
        }

        let mostUsedLanguage = "N/A";
        let maxScore = 0;
        Object.entries(languageScores).forEach(([lang, score]) => {
          if (score > maxScore) {
            maxScore = score;
            mostUsedLanguage = lang;
          }
        });

        return {
          month: m.label,
          commits: monthData?.totalCommitContributions || 0,
          repositories: monthData?.commitContributionsByRepository?.length || 0,
          pullRequests: monthData?.totalPullRequestContributions || 0,
          issues: monthData?.totalIssueContributions || 0,
          reviews: monthData?.totalPullRequestReviewContributions || 0,
          commitHistory: history,
          mostUsedLanguage,
          reposCreated: monthData?.totalRepositoryContributions || 0,
        };
      });

      setStats(parsedStats);
    } catch (err: unknown) {
      console.error("Error fetching monthly stats:", err);
      const errMsg =
        err instanceof Error
          ? err.message
          : "Something went wrong while loading GitStats.";
      setError(errMsg);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
      onLoadComplete?.();
    }
  }, [username, session]);

  const fetchTimeStats = useCallback(
    async (monthLabel: string) => {
      if (!username || !session?.accessToken) return;

      setLoadingTimeStats(true);
      setTimeStats(null);

      try {
        const selectedMonthMeta = getPastMonths(6).find(
          (m) => m.label === monthLabel,
        );
        if (!selectedMonthMeta) {
          setLoadingTimeStats(false);
          return;
        }

        const fromStr = selectedMonthMeta.from.substring(0, 10);
        const toStr = selectedMonthMeta.to.substring(0, 10);

        const headers = {
          Authorization: `Bearer ${session.accessToken}`,
          Accept: "application/vnd.github+json",
        };

        const commitUrl = `https://api.github.com/search/commits?q=author:${username}+committer-date:${fromStr}..${toStr}&per_page=100`;
        const issueUrl = `https://api.github.com/search/issues?q=author:${username}+created:${fromStr}..${toStr}&per_page=100`;

        const [commitRes, issueRes] = await Promise.all([
          fetch(commitUrl, { headers }),
          fetch(issueUrl, { headers }),
        ]);

        const commitData = commitRes.ok
          ? await commitRes.json()
          : { items: [] };
        const issueData = issueRes.ok ? await issueRes.json() : { items: [] };

        let day = 0;
        let afternoon = 0;
        let evening = 0;
        let night = 0;

        const processDate = (dateString: string) => {
          if (!dateString) return;
          const date = new Date(dateString);
          const hour = date.getHours();

          if (hour >= 5 && hour < 12) {
            day++;
          } else if (hour >= 12 && hour < 17) {
            afternoon++;
          } else if (hour >= 17 && hour < 21) {
            evening++;
          } else {
            night++;
          }
        };

        if (Array.isArray(commitData.items)) {
          commitData.items.forEach((item: any) => {
            if (item.commit?.committer?.date) {
              processDate(item.commit.committer.date);
            }
          });
        }

        if (Array.isArray(issueData.items)) {
          issueData.items.forEach((item: any) => {
            if (item.created_at) {
              processDate(item.created_at);
            }
          });
        }

        const total = day + afternoon + evening + night;
        const percentages = {
          day: total > 0 ? Math.round((day / total) * 100) : 0,
          afternoon: total > 0 ? Math.round((afternoon / total) * 100) : 0,
          evening: total > 0 ? Math.round((evening / total) * 100) : 0,
          night: total > 0 ? Math.round((night / total) * 100) : 0,
        };

        const maxVal = Math.max(day, afternoon, evening, night);
        let persona = "Nocturnal Developer";
        if (total > 0) {
          if (maxVal === day) {
            persona = "Early-Bird Engineer";
          } else if (maxVal === afternoon) {
            persona = "Post-Lunch Programmer";
          } else if (maxVal === evening) {
            persona = "Shadow Scripter";
          } else if (maxVal === night) {
            persona = "Nocturnal Developer";
          }
        } else {
          persona = "Silent Achiever";
        }

        setTimeStats({
          day,
          afternoon,
          evening,
          night,
          percentages,
          persona,
        });
      } catch (err) {
        console.error("Error fetching time stats:", err);
      } finally {
        setLoadingTimeStats(false);
      }
    },
    [username, session],
  );

  useEffect(() => {
    if (selectedMonth) {
      fetchTimeStats(selectedMonth);
    } else {
      setTimeStats(null);
    }
  }, [selectedMonth, fetchTimeStats]);

  useEffect(() => {
    if (username && session) {
      fetchMonthlyStats();
    }
  }, [username, session, fetchMonthlyStats]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchMonthlyStats();
  };

  const selectedStat = stats?.find((s) => s.month === selectedMonth);
  const selectedIdx =
    stats && selectedMonth
      ? stats.findIndex((s) => s.month === selectedMonth)
      : -1;
  const prevStat =
    stats && selectedIdx !== -1 && selectedIdx + 1 < stats.length
      ? stats[selectedIdx + 1]
      : null;

  let currentTotal = 0;
  let prevTotal = 0;
  let diffPercent = 0;
  let diffType: "more" | "less" | "equal" | "none" = "none";

  if (selectedStat) {
    currentTotal =
      selectedStat.commits +
      selectedStat.pullRequests +
      selectedStat.issues +
      selectedStat.reviews;
    if (prevStat) {
      prevTotal =
        prevStat.commits +
        prevStat.pullRequests +
        prevStat.issues +
        prevStat.reviews;
      if (prevTotal === 0) {
        if (currentTotal > 0) {
          diffPercent = 100;
          diffType = "more";
        } else {
          diffPercent = 0;
          diffType = "equal";
        }
      } else {
        const rawDiff = ((currentTotal - prevTotal) / prevTotal) * 100;
        diffPercent = Math.abs(Math.round(rawDiff));
        if (rawDiff > 0) {
          diffType = "more";
        } else if (rawDiff < 0) {
          diffType = "less";
        } else {
          diffType = "equal";
        }
      }
    }
  }

  let mostActiveDayText = "";
  if (
    selectedStat &&
    selectedStat.commitHistory &&
    selectedStat.commitHistory.length > 0 &&
    selectedMonth
  ) {
    const maxVal = Math.max(...selectedStat.commitHistory);
    if (maxVal > 0) {
      const dayIdx = selectedStat.commitHistory.indexOf(maxVal);
      const monthName = selectedMonth.split(" ")[0];
      const dayNum = dayIdx + 1;
      const j = dayNum % 10;
      const k = dayNum % 100;
      let suffix = "th";
      if (j === 1 && k !== 11) suffix = "st";
      else if (j === 2 && k !== 12) suffix = "nd";
      else if (j === 3 && k !== 13) suffix = "rd";

      mostActiveDayText = `${monthName} ${dayNum}${suffix} (${maxVal} contributions)`;
    } else {
      mostActiveDayText = "No active contributions";
    }
  }

  if (selectedMonth) {
    if (loadingTimeStats) {
      return (
        <div className="space-y-8 select-none animate-pulse">
          {/* Header Skeleton */}
          <div className="flex items-center justify-between">
            <div className="h-9 bg-zinc-900 border border-zinc-800 rounded w-32 animate-pulse" />
            <div className="h-8 bg-zinc-900 border border-zinc-850 rounded-full w-40 animate-pulse" />
          </div>
          <div className="space-y-4 pt-2">
            <div className="h-12 bg-zinc-900 rounded w-1/3 animate-pulse" />
            <div className="h-3 bg-zinc-900 rounded w-1/4 animate-pulse" />
          </div>

          {/* Main Grid Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-4">
            {/* Left panel skeleton */}
            <div className="lg:col-span-5 bg-zinc-900/20 border border-zinc-900 rounded-lg p-6 space-y-6">
              <div className="h-36 sm:h-40 bg-zinc-850/60 rounded-lg animate-pulse w-full" />
              <div className="flex items-center gap-4 w-full">
                <div className="w-12 h-12 bg-zinc-800/60 rounded-full animate-pulse flex-shrink-0" />
                <div className="space-y-2 flex-1">
                  <div className="h-3 bg-zinc-800/60 rounded w-1/3 animate-pulse" />
                  <div className="h-5 bg-zinc-800/60 rounded w-2/3 animate-pulse" />
                  <div className="h-3 bg-zinc-800/60 rounded w-1/4 animate-pulse" />
                </div>
              </div>
              <div className="h-10 bg-zinc-850/40 rounded w-full animate-pulse" />
              <div className="space-y-4 pt-4 border-t border-zinc-900/60">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between">
                      <div className="h-3 bg-zinc-800/60 rounded w-1/3 animate-pulse" />
                      <div className="h-3 bg-zinc-800/60 rounded w-10 animate-pulse" />
                    </div>
                    <div className="h-1.5 bg-zinc-800/30 rounded w-full animate-pulse" />
                  </div>
                ))}
              </div>
            </div>

            {/* Right panel skeleton */}
            <div className="lg:col-span-7 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="h-[120px] bg-zinc-900/20 border border-zinc-900 rounded-lg p-5 flex flex-col justify-between"
                  >
                    <div className="h-3 bg-zinc-850 rounded w-2/3 animate-pulse" />
                    <div className="h-8 bg-zinc-850 rounded w-1/3 animate-pulse" />
                  </div>
                ))}
              </div>
              <div className="h-[180px] bg-zinc-900/20 border border-zinc-900 rounded-lg p-6 space-y-4">
                <div className="h-4 bg-zinc-850 rounded w-1/4 animate-pulse" />
                <div className="h-3 bg-zinc-850 rounded w-1/3 animate-pulse" />
                <div className="h-12 bg-zinc-850/40 rounded w-full animate-pulse" />
              </div>
              <div className="h-[120px] bg-zinc-900/20 border border-zinc-900 rounded-lg p-6 space-y-4">
                <div className="h-4 bg-zinc-850 rounded w-1/4 animate-pulse" />
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="h-10 bg-zinc-850/40 rounded w-full animate-pulse" />
                  <div className="h-10 bg-zinc-850/40 rounded w-full animate-pulse" />
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (!timeStats) {
      return (
        <div className="space-y-8 select-none">
          <div>
            <button
              onClick={() => setSelectedMonth(null)}
              className="flex items-center gap-2 border border-zinc-800 bg-zinc-900/30 hover:bg-zinc-900/60 hover:border-zinc-700 hover:text-white text-zinc-400 font-mono text-xs px-3.5 py-2.5 rounded transition-all cursor-pointer"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Back to GitStats
            </button>
          </div>
          <div className="text-xs text-zinc-500 font-mono py-12 text-center border border-zinc-900 bg-zinc-950/20 rounded-lg">
            Could not determine contribution activity times for this month.
          </div>
        </div>
      );
    }

    const theme =
      personaThemes[timeStats.persona] || personaThemes["Silent Achiever"];
    const isDayActive = timeStats.persona === "Early-Bird Engineer";
    const isAfternoonActive = timeStats.persona === "Post-Lunch Programmer";
    const isEveningActive = timeStats.persona === "Shadow Scripter";
    const isNightActive = timeStats.persona === "Nocturnal Developer";

    return (
      <div className="space-y-8 select-none animate-fade-in">
        {/* Top bar with back button & Report indicator */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <button
            onClick={() => setSelectedMonth(null)}
            className="w-fit flex items-center gap-2 border border-zinc-800 bg-zinc-900/30 hover:bg-zinc-900/60 hover:border-zinc-700 hover:text-white text-zinc-400 font-mono text-xs px-3.5 py-2.5 rounded transition-all cursor-pointer"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to GitStats
          </button>

          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-[10px] font-mono tracking-wider uppercase select-none ${theme.accentBg} ${theme.accentBorder} ${theme.primaryText}`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            {theme.themeTitle} Mode Active
          </div>
        </div>

        {/* Page Header */}
        <div className="relative pb-6 border-b border-zinc-900/80">
          {/* Subtle colored glow blur in the background */}
          <div
            className={`absolute top-[-100px] left-1/4 w-72 h-72 rounded-full blur-[120px] opacity-20 pointer-events-none -z-10 ${theme.glowColor}`}
          />

          <h1
            className={`text-4xl md:text-5xl text-white font-bold tracking-tight ${montserrat.className}`}
          >
            {selectedMonth}
          </h1>
          <p className="text-zinc-500 font-mono text-xs mt-2 uppercase tracking-widest">
            Dedicated Developer Dossier
          </p>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Developer Persona Profile Card (lg:col-span-5) */}
          <div className="lg:col-span-5 w-full">
            <SpotlightCard
              spotlightColor={theme.spotlight}
              className={`rounded-xl border border-zinc-900/60 bg-zinc-950/10 shadow-2xl p-6 ${theme.glow}`}
            >
              <div className="flex flex-col items-start text-left w-full">
                {/* Persona Banner */}
                <div className="relative w-full h-36 sm:h-40 rounded-lg overflow-hidden mb-5 border border-zinc-800/80 group">
                  <img
                    src={theme.banner}
                    alt={timeStats.persona}
                    className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div
                    className={`absolute top-2.5 right-2.5 px-2.5 py-1 rounded-full text-[9px] font-mono tracking-wider uppercase backdrop-blur-md border ${theme.accentBg} ${theme.accentBorder} ${theme.primaryText}`}
                  >
                    {theme.themeTitle}
                  </div>
                </div>

                <div className="flex items-center gap-4 w-full mb-2">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${theme.accentBg} border ${theme.accentBorder} ${theme.primaryText}`}
                  >
                    <theme.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                      Persona Profile
                    </div>
                    <h2 className="text-xl font-bold text-white tracking-wide font-sans">
                      {timeStats.persona}
                    </h2>
                    <div
                      className={`text-[10px] font-mono tracking-widest mt-0.5 uppercase ${theme.primaryText}`}
                    >
                      {`// ${theme.themeTitle}`}
                    </div>
                  </div>
                </div>
                <p className="text-zinc-400 text-xs mt-3 leading-relaxed font-mono">
                  {theme.desc}
                </p>
              </div>

              {/* Hourly Time-of-day breakdown */}
              <div className="mt-8 pt-6 border-t border-zinc-900/60 space-y-5">
                <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
                  Contribution Clock
                </div>

                <div className="space-y-4 font-mono text-xs">
                  {/* Day */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-zinc-400">
                      <span className="flex items-center gap-1.5">
                        <SunIcon className="w-4 h-4 text-amber-400" /> Day (5am
                        - 12pm)
                      </span>
                      <span
                        className={`font-semibold ${
                          isDayActive ? theme.primaryText : "text-zinc-300"
                        }`}
                      >
                        {timeStats.percentages.day}%{" "}
                        <span className="text-[10px] text-zinc-500 font-normal">
                          ({timeStats.day})
                        </span>
                      </span>
                    </div>
                    <div className="h-2 bg-zinc-950 border border-zinc-900 rounded overflow-hidden">
                      <div
                        className="h-full transition-all duration-700"
                        style={{
                          width: `${timeStats.percentages.day}%`,
                          backgroundColor: isDayActive
                            ? theme.spotlight
                            : undefined,
                          opacity: isDayActive ? 1 : 0.2,
                        }}
                      />
                    </div>
                  </div>

                  {/* Afternoon */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-zinc-400">
                      <span className="flex items-center gap-1.5">
                        <BriefcaseIcon className="w-4 h-4 text-emerald-400" />{" "}
                        Afternoon (12pm - 5pm)
                      </span>
                      <span
                        className={`font-semibold ${
                          isAfternoonActive
                            ? theme.primaryText
                            : "text-zinc-300"
                        }`}
                      >
                        {timeStats.percentages.afternoon}%{" "}
                        <span className="text-[10px] text-zinc-500 font-normal">
                          ({timeStats.afternoon})
                        </span>
                      </span>
                    </div>
                    <div className="h-2 bg-zinc-950 border border-zinc-900 rounded overflow-hidden">
                      <div
                        className="h-full transition-all duration-700"
                        style={{
                          width: `${timeStats.percentages.afternoon}%`,
                          backgroundColor: isAfternoonActive
                            ? theme.spotlight
                            : undefined,
                          opacity: isAfternoonActive ? 1 : 0.2,
                        }}
                      />
                    </div>
                  </div>

                  {/* Evening */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-zinc-400">
                      <span className="flex items-center gap-1.5">
                        <TelescopeIcon className="w-4 h-4 text-fuchsia-400" />{" "}
                        Evening (5pm - 9pm)
                      </span>
                      <span
                        className={`font-semibold ${
                          isEveningActive ? theme.primaryText : "text-zinc-300"
                        }`}
                      >
                        {timeStats.percentages.evening}%{" "}
                        <span className="text-[10px] text-zinc-500 font-normal">
                          ({timeStats.evening})
                        </span>
                      </span>
                    </div>
                    <div className="h-2 bg-zinc-950 border border-zinc-900 rounded overflow-hidden">
                      <div
                        className="h-full transition-all duration-700"
                        style={{
                          width: `${timeStats.percentages.evening}%`,
                          backgroundColor: isEveningActive
                            ? theme.spotlight
                            : undefined,
                          opacity: isEveningActive ? 1 : 0.2,
                        }}
                      />
                    </div>
                  </div>

                  {/* Night */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-zinc-400">
                      <span className="flex items-center gap-1.5">
                        <MoonIcon className="w-4 h-4 text-violet-400" /> Night
                        (9pm - 5am)
                      </span>
                      <span
                        className={`font-semibold ${
                          isNightActive ? theme.primaryText : "text-zinc-300"
                        }`}
                      >
                        {timeStats.percentages.night}%{" "}
                        <span className="text-[10px] text-zinc-500 font-normal">
                          ({timeStats.night})
                        </span>
                      </span>
                    </div>
                    <div className="h-2 bg-zinc-950 border border-zinc-900 rounded overflow-hidden">
                      <div
                        className="h-full transition-all duration-700"
                        style={{
                          width: `${timeStats.percentages.night}%`,
                          backgroundColor: isNightActive
                            ? theme.spotlight
                            : undefined,
                          opacity: isNightActive ? 1 : 0.2,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </SpotlightCard>
          </div>

          {/* Right Column: Month Metrics Grid & Activity Graph (lg:col-span-7) */}
          <div className="lg:col-span-7 space-y-6 w-full animate-fade-in">
            {selectedStat !== undefined && (
              <div className="space-y-6">
                {/* 2x2 Metrics Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Repositories Worked On */}
                  <SpotlightCard
                    spotlightColor={theme.spotlight}
                    className="h-[120px]"
                  >
                    <div className="flex flex-col justify-between h-full w-full font-sans">
                      <span
                        className={`text-[10px] font-mono font-medium tracking-wider text-zinc-500 uppercase ${leagueSpartan.className}`}
                      >
                        Repositories Worked On
                      </span>
                      <span
                        className={`text-4xl font-bold ${theme.primaryText} ${leagueSpartan.className}`}
                      >
                        {selectedStat.repositories}
                      </span>
                    </div>
                  </SpotlightCard>

                  {/* Repositories Created */}
                  <SpotlightCard
                    spotlightColor={theme.spotlight}
                    className="h-[120px]"
                  >
                    <div className="flex flex-col justify-between h-full w-full font-sans">
                      <span
                        className={`text-[10px] font-mono font-medium tracking-wider text-zinc-500 uppercase ${leagueSpartan.className}`}
                      >
                        Repositories Created
                      </span>
                      <span className="text-4xl font-bold text-white tracking-tight">
                        {selectedStat.reposCreated}
                      </span>
                    </div>
                  </SpotlightCard>

                  {/* PRs Opened */}
                  <SpotlightCard
                    spotlightColor={theme.spotlight}
                    className="h-[120px]"
                  >
                    <div className="flex flex-col justify-between h-full w-full font-sans">
                      <span
                        className={`text-[10px] font-mono font-medium tracking-wider text-zinc-500 uppercase ${leagueSpartan.className}`}
                      >
                        Pull Requests Opened
                      </span>
                      <span className="text-4xl font-bold text-white tracking-tight">
                        {selectedStat.pullRequests}
                      </span>
                    </div>
                  </SpotlightCard>

                  {/* Most Used Language */}
                  <SpotlightCard
                    spotlightColor={theme.spotlight}
                    className="h-[120px]"
                  >
                    <div className="flex flex-col justify-between h-full w-full font-sans">
                      <span
                        className={`text-[10px] font-mono font-medium tracking-wider text-zinc-500 uppercase ${leagueSpartan.className}`}
                      >
                        Most Used Language
                      </span>
                      <span
                        className="text-2xl font-bold tracking-tight truncate"
                        title={selectedStat.mostUsedLanguage}
                      >
                        {selectedStat.mostUsedLanguage || "None"}
                      </span>
                    </div>
                  </SpotlightCard>
                </div>

                {/* Daily Activity Chart Card */}
                <SpotlightCard spotlightColor={theme.spotlight} className="p-6">
                  <div className="w-full">
                    <h3 className="text-sm font-semibold text-white font-sans tracking-wide">
                      Activity Pulse
                    </h3>
                    <p className="text-[11px] text-zinc-500 font-mono mt-0.5">
                      Daily breakdown of commits and issues during this month.
                    </p>

                    <MiniBarChart
                      data={selectedStat.commitHistory}
                      colorClass={theme.barColor}
                      hoverColorClass={theme.barHoverColor}
                    />
                  </div>
                </SpotlightCard>

                {/* Performance Insight & Active Day Card */}
                <SpotlightCard spotlightColor={theme.spotlight} className="p-6">
                  <div className="flex flex-col gap-4 font-mono text-xs w-full">
                    <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
                      Executive Summary & Insights
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Comparison block */}
                      <div className="p-3.5 rounded-lg border border-zinc-900 bg-zinc-950/40 flex items-start gap-3">
                        <div className="mt-0.5">
                          {diffType === "more" ? (
                            <ArrowUpIcon className="w-5 h-5 text-emerald-400" />
                          ) : diffType === "less" ? (
                            <ArrowDownIcon className="w-5 h-5 text-rose-400" />
                          ) : (
                            <GraphIcon className="w-5 h-5 text-zinc-400" />
                          )}
                        </div>
                        <div>
                          <div className="text-[10px] font-mono text-zinc-500 uppercase">
                            Monthly Shift
                          </div>
                          <div className="text-sm font-bold text-white mt-0.5">
                            {prevStat ? (
                              diffType === "more" ? (
                                <span>
                                  <span className={theme.primaryText}>
                                    {diffPercent}% Increase
                                  </span>{" "}
                                  in activity
                                </span>
                              ) : diffType === "less" ? (
                                <span>
                                  <span className="text-rose-400">
                                    {diffPercent}% Decrease
                                  </span>{" "}
                                  in activity
                                </span>
                              ) : (
                                <span className="text-zinc-300">
                                  Stable Activity
                                </span>
                              )
                            ) : (
                              <span className="text-zinc-400">
                                First Month Tracked
                              </span>
                            )}
                          </div>
                          {prevStat && (
                            <p className="text-[10px] text-zinc-500 mt-1">
                              {currentTotal} total contributions vs {prevTotal}{" "}
                              last month.
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Active Day block */}
                      <div className="p-3.5 rounded-lg border border-zinc-900 bg-zinc-950/40 flex items-start gap-3">
                        <div className="mt-0.5">
                          <StarIcon className="w-5 h-5 text-amber-400" />
                        </div>
                        <div>
                          <div className="text-[10px] font-mono text-zinc-500 uppercase">
                            Apex Day
                          </div>
                          <div className="text-sm font-bold text-white mt-0.5">
                            {mostActiveDayText ? (
                              <span className="text-amber-400">
                                {mostActiveDayText.replace(
                                  / \(\d+ contributions\)/,
                                  "",
                                )}
                              </span>
                            ) : (
                              <span className="text-zinc-400">
                                No active days
                              </span>
                            )}
                          </div>
                          {mostActiveDayText && (
                            <p className="text-[10px] text-zinc-500 mt-1">
                              Highest concentration of contributions (
                              {selectedStat.commitHistory
                                ? Math.max(...selectedStat.commitHistory)
                                : 0}{" "}
                              contributions).
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </SpotlightCard>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 select-none">
      {/* Page Header */}
      <div>
        <h1
          className={`text-5xl md:text-6xl text-white font-bold tracking-tight ${montserrat.className}`}
        >
          GitStats
        </h1>
        <p
          className={`mt-2 text-lg text-zinc-400 font-light tracking-wide ${leagueSpartan.className}`}
        >
          Monthly breakdown of your GitHub contributions and activity.
        </p>
      </div>

      {/* Summary Widgets */}
      {!error && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              title: "Total Commits",
              value: counts.commits,
              color: "#ffffff",
            },
            {
              title: "Pull Requests",
              value: counts.pullRequests,
              color: "#e4e4e7",
            },
            {
              title: "Issues Opened",
              value: counts.issues,
              color: "#c4c4c7",
            },
            {
              title: "Code Reviews",
              value: counts.reviews,
              color: "#a1a1aa",
            },
          ].map((stat) => (
            <SpotlightCard
              key={stat.title}
              spotlightColor={stat.color}
              className="h-[140px] transition-all duration-300 hover:translate-y-[-2px]"
            >
              <div className="flex flex-col justify-between h-full w-full">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{
                        backgroundColor: stat.color,
                        boxShadow: `0 0 8px ${stat.color}`,
                      }}
                    />
                    <span
                      className={`text-[10px] font-mono font-medium tracking-wider text-zinc-500 uppercase ${leagueSpartan.className}`}
                    >
                      {stat.title}
                    </span>
                  </div>
                </div>

                <div className="mt-3 flex items-baseline gap-1.5">
                  <span
                    className={`text-5xl font-semibold tracking-tight ${leagueSpartan.className}`}
                    style={{ color: stat.color }}
                  >
                    {loading ? (
                      <span className="text-2xl font-mono text-zinc-500">
                        ...
                      </span>
                    ) : (
                      <AnimatedCounter value={stat.value} />
                    )}
                  </span>
                </div>
              </div>
            </SpotlightCard>
          ))}
        </div>
      )}

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
        <div className="border-t border-zinc-900/60 pt-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading
              ? Array.from({ length: 6 }).map((_, idx) => (
                  <SkeletonCard key={idx} />
                ))
              : stats?.map((stat) => (
                  <MonthlyStatCard
                    key={stat.month}
                    stat={stat}
                    onClick={() => setSelectedMonth(stat.month)}
                  />
                ))}
          </div>
        </div>
      )}
    </div>
  );
}
