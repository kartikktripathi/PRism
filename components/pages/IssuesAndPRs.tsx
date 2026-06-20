"use client";

import { useState, useEffect, useMemo, useCallback } from "react";

interface IssuesAndPRsProps {
  session: {
    accessToken?: string;
  } | null;
  username: string | null;
}

interface GitHubLabel {
  id: number;
  name: string;
  color: string;
  description?: string;
}

interface GitHubUser {
  login: string;
  avatar_url: string;
}

interface IssueOrPR {
  id: number;
  number: number;
  title: string;
  html_url: string;
  state: "open" | "closed";
  created_at: string;
  updated_at: string;
  comments: number;
  labels: GitHubLabel[];
  user: GitHubUser;
  assignee: GitHubUser | null;
  assignees: GitHubUser[];
  repository_url: string;
  pull_request?: {
    url: string;
    html_url: string;
    merged_at?: string | null;
  };
  // Custom flags added during mapping
  isIssue: boolean;
  isCreated: boolean;
  isAssigned: boolean;
  isMentioned: boolean;
  isReviewRequested: boolean;
}

interface GitHubRawItem {
  id: number;
  number: number;
  title: string;
  html_url: string;
  state: "open" | "closed";
  created_at: string;
  updated_at: string;
  comments: number;
  labels: GitHubLabel[];
  user: GitHubUser;
  assignee: GitHubUser | null;
  assignees: GitHubUser[];
  repository_url: string;
  pull_request?: {
    url: string;
    html_url: string;
    merged_at?: string | null;
  };
}

export default function IssuesAndPRs({ session, username }: IssuesAndPRsProps) {
  const [items, setItems] = useState<IssueOrPR[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Filters and sorting states
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "issues" | "prs">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "open" | "closed" | "merged">("all");
  const [roleFilter, setRoleFilter] = useState<"all" | "created" | "assigned" | "review-requested">("all");

  // Fetch issues & PRs from GitHub API
  const fetchIssuesAndPRs = useCallback(async () => {
    await Promise.resolve();

    if (!username || !session?.accessToken) {
      setError("Please authenticate with GitHub to load issues and PRs.");
      setLoading(false);
      return;
    }

    setError(null);
    const usernameLower = username.toLowerCase();
    const headers = {
      Authorization: `Bearer ${session.accessToken}`,
      Accept: "application/vnd.github+json",
    };

    try {
      // 1. Issues involving user
      const issuesUrl = `https://api.github.com/search/issues?q=is:issue+involves:${username}&per_page=100`;
      // 2. PRs involving user
      const prsUrl = `https://api.github.com/search/issues?q=is:pr+involves:${username}&per_page=100`;
      // 3. PRs requesting user's review
      const reviewsUrl = `https://api.github.com/search/issues?q=is:pr+review-requested:${username}&per_page=100`;

      const [issuesRes, prsRes, reviewsRes] = await Promise.all([
        fetch(issuesUrl, { headers }),
        fetch(prsUrl, { headers }),
        fetch(reviewsUrl, { headers }),
      ]);

      if (!issuesRes.ok || !prsRes.ok || !reviewsRes.ok) {
        throw new Error("Failed to fetch issues and PRs. GitHub search API limit reached or token expired.");
      }

      const issuesData = await issuesRes.json();
      const prsData = await prsRes.json();
      const reviewsData = await reviewsRes.json();

      const rawIssues: GitHubRawItem[] = issuesData.items || [];
      const rawPRs: GitHubRawItem[] = prsData.items || [];
      const rawReviews: GitHubRawItem[] = reviewsData.items || [];

      // Map raw issues
      const mappedIssues: IssueOrPR[] = rawIssues.map((item: GitHubRawItem) => {
        const isCreated = item.user?.login?.toLowerCase() === usernameLower;
        const isAssigned =
          item.assignees?.some((a: GitHubUser) => a.login?.toLowerCase() === usernameLower) ||
          item.assignee?.login?.toLowerCase() === usernameLower;
        return {
          ...item,
          isIssue: true,
          isCreated,
          isAssigned,
          isMentioned: !isCreated && !isAssigned,
          isReviewRequested: false,
        };
      });

      // Map raw PRs
      const prMap = new Map<number, IssueOrPR>();

      rawPRs.forEach((item: GitHubRawItem) => {
        const isCreated = item.user?.login?.toLowerCase() === usernameLower;
        const isAssigned =
          item.assignees?.some((a: GitHubUser) => a.login?.toLowerCase() === usernameLower) ||
          item.assignee?.login?.toLowerCase() === usernameLower;
        prMap.set(item.id, {
          ...item,
          isIssue: false,
          isCreated,
          isAssigned,
          isMentioned: !isCreated && !isAssigned,
          isReviewRequested: false,
        });
      });

      // Map reviews and merge to avoid duplicates
      rawReviews.forEach((item: GitHubRawItem) => {
        const isCreated = item.user?.login?.toLowerCase() === usernameLower;
        const isAssigned =
          item.assignees?.some((a: GitHubUser) => a.login?.toLowerCase() === usernameLower) ||
          item.assignee?.login?.toLowerCase() === usernameLower;

        if (prMap.has(item.id)) {
          const existing = prMap.get(item.id)!;
          prMap.set(item.id, {
            ...existing,
            isReviewRequested: true,
          });
        } else {
          prMap.set(item.id, {
            ...item,
            isIssue: false,
            isCreated,
            isAssigned,
            isMentioned: !isCreated && !isAssigned,
            isReviewRequested: true,
          });
        }
      });

      const mergedPRs = Array.from(prMap.values());
      setItems([...mappedIssues, ...mergedPRs]);
    } catch (err: unknown) {
      console.error(err);
      const errMsg = err instanceof Error ? err.message : "Something went wrong while loading issues.";
      setError(errMsg);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [username, session]);

  useEffect(() => {
    if (username && session) {
      const timer = setTimeout(() => {
        fetchIssuesAndPRs();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [username, session, fetchIssuesAndPRs]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchIssuesAndPRs();
  };

  const getRepoName = (repoUrl: string) => {
    return repoUrl.replace("https://api.github.com/repos/", "");
  };

  const getLabelStyles = (hexColor: string) => {
    const hex = hexColor.replace("#", "");
    const r = parseInt(hex.substring(0, 2), 16) || 0;
    const g = parseInt(hex.substring(2, 4), 16) || 0;
    const b = parseInt(hex.substring(4, 6), 16) || 0;

    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    const isDarkColor = yiq < 75;

    let textColor = `#${hex}`;
    if (isDarkColor) {
      textColor = "#e4e4e7";
    }

    return {
      backgroundColor: `rgba(${r}, ${g}, ${b}, 0.15)`,
      borderColor: `rgba(${r}, ${g}, ${b}, 0.4)`,
      color: textColor,
    };
  };

  const formatRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) {
      return diffMins <= 1 ? "just now" : `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 30) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
    }
  };

  const counts = useMemo(() => {
    const totalIssues = items.filter((item) => item.isIssue);
    const totalPRs = items.filter((item) => !item.isIssue);

    return {
      openIssues: totalIssues.filter((item) => item.state === "open").length,
      openPRs: totalPRs.filter((item) => item.state === "open" && !item.pull_request?.merged_at).length,
      assigned: items.filter((item) => item.state === "open" && item.isAssigned).length,
      reviewsRequested: totalPRs.filter((item) => item.state === "open" && item.isReviewRequested).length,
    };
  }, [items]);

  const filteredItems = useMemo(() => {
    let result = [...items];

    // 1. Text Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          getRepoName(item.repository_url).toLowerCase().includes(q) ||
          item.number.toString().includes(q),
      );
    }

    // 2. Type Tab Filter
    if (activeTab === "issues") {
      result = result.filter((item) => item.isIssue);
    } else if (activeTab === "prs") {
      result = result.filter((item) => !item.isIssue);
    }

    // 3. Status Filter
    if (statusFilter === "open") {
      result = result.filter((item) => item.state === "open" && !item.pull_request?.merged_at);
    } else if (statusFilter === "closed") {
      result = result.filter((item) => item.state === "closed" && !item.pull_request?.merged_at);
    } else if (statusFilter === "merged") {
      result = result.filter((item) => !item.isIssue && item.pull_request?.merged_at);
    }

    // 4. Role Filter
    if (roleFilter === "created") {
      result = result.filter((item) => item.isCreated);
    } else if (roleFilter === "assigned") {
      result = result.filter((item) => item.isAssigned);
    } else if (roleFilter === "review-requested") {
      result = result.filter((item) => !item.isIssue && item.isReviewRequested);
    }

    // Default sorting (newest first)
    result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return result;
  }, [items, searchQuery, activeTab, statusFilter, roleFilter]);

  const SkeletonCard = () => (
    <div className="border border-zinc-900/60 bg-zinc-950/20 rounded-lg p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-pulse">
      <div className="flex items-start gap-3.5 min-w-0 flex-1">
        <div className="w-4 h-4 bg-zinc-800 rounded-full mt-1.5 flex-shrink-0" />
        <div className="space-y-2.5 w-full">
          <div className="flex items-center gap-2">
            <div className="h-3.5 bg-zinc-800 rounded w-1/4" />
            <div className="h-4 bg-zinc-800 rounded w-2/3" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 bg-zinc-800 rounded w-1/5" />
            <div className="h-3 bg-zinc-800 rounded w-1/6" />
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3.5 ml-8 md:ml-0 flex-shrink-0">
        <div className="h-6 w-12 bg-zinc-800 rounded-full" />
        <div className="h-6 w-6 bg-zinc-800 rounded-full" />
      </div>
    </div>
  );

  return (
    <div className="space-y-8 select-none">
      {/* Header and Sync Control */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-white tracking-wide">Issues & Pull Requests</h1>
          <p className="text-xs text-zinc-500 mt-2 font-mono">
            Track conversations, code review requests, and assignments from your active repositories.
          </p>
        </div>
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
      </div>

      {/* Summary Widgets */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-lg border border-zinc-850 bg-zinc-950/20 p-4">
          <p className="text-[10px] uppercase font-mono tracking-wider text-zinc-500">Open Issues</p>
          <p className="text-2xl font-bold text-white mt-1.5 font-mono">
            {loading ? "..." : counts.openIssues}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-850 bg-zinc-950/20 p-4">
          <p className="text-[10px] uppercase font-mono tracking-wider text-zinc-500">Open PRs</p>
          <p className="text-2xl font-bold text-white mt-1.5 font-mono">
            {loading ? "..." : counts.openPRs}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-850 bg-zinc-950/20 p-4">
          <p className="text-[10px] uppercase font-mono tracking-wider text-zinc-500">Assigned to Me</p>
          <p className="text-2xl font-bold text-amber-500 mt-1.5 font-mono">
            {loading ? "..." : counts.assigned}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-850 bg-zinc-950/20 p-4">
          <p className="text-[10px] uppercase font-mono tracking-wider text-zinc-500">Review Requests</p>
          <p className="text-2xl font-bold text-purple-400 mt-1.5 font-mono">
            {loading ? "..." : counts.reviewsRequested}
          </p>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="space-y-4 border-t border-zinc-900/60 pt-6">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          {/* Main Tabs */}
          <div className="flex border-b border-zinc-900/60 pb-px gap-1.5">
            {(["all", "issues", "prs"] as const).map((tab) => {
              const isActive = activeTab === tab;
              const countText =
                tab === "all"
                  ? items.length
                  : tab === "issues"
                    ? items.filter((i) => i.isIssue).length
                    : items.filter((i) => !i.isIssue).length;

              return (
                <button
                  key={tab}
                  onClick={() => {
                    setActiveTab(tab);
                    // Reset sub-filters if incompatible
                    if (tab === "issues") {
                      if (statusFilter === "merged") setStatusFilter("all");
                      if (roleFilter === "review-requested") setRoleFilter("all");
                    }
                  }}
                  className={`px-3 py-2 text-xs rounded-t font-mono transition-all border-b-2 cursor-pointer capitalize ${
                    isActive
                      ? "border-emerald-500 text-white font-medium bg-zinc-900/30"
                      : "border-transparent text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  {tab === "prs" ? "Pull Requests" : tab}{" "}
                  <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full bg-zinc-900 border border-zinc-850 font-normal text-zinc-500">
                    {loading ? "..." : countText}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Field */}
          <div className="relative w-full xl:max-w-md">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-600">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Search title, number, repo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-zinc-950/40 border border-zinc-850 hover:border-zinc-800 focus:border-zinc-700 text-zinc-300 placeholder-zinc-600 rounded text-xs font-mono outline-none transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-600 hover:text-zinc-400 cursor-pointer"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Sub-Filters and Sorters */}
        <div className="flex flex-wrap items-center gap-4 bg-zinc-950/15 border border-zinc-900/60 p-3.5 rounded-lg text-xs font-mono">
          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <span className="text-zinc-600 text-[11px]">Status:</span>
            <div className="flex rounded border border-zinc-850 overflow-hidden bg-zinc-900/10">
              {(["all", "open", "closed", ...(activeTab !== "issues" ? (["merged"] as const) : [])] as const).map(
                (status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-2.5 py-1 text-[10px] capitalize transition-colors cursor-pointer border-r border-zinc-850 last:border-0 ${
                      statusFilter === status
                        ? "bg-zinc-900 text-emerald-400 font-medium"
                        : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    {status}
                  </button>
                ),
              )}
            </div>
          </div>

          {/* Role Filter */}
          <div className="flex items-center gap-2">
            <span className="text-zinc-600 text-[11px]">Relation:</span>
            <div className="flex rounded border border-zinc-850 overflow-hidden bg-zinc-900/10">
              {(["all", "created", "assigned", ...(activeTab !== "issues" ? (["review-requested"] as const) : [])] as const).map(
                (role) => (
                  <button
                    key={role}
                    onClick={() => setRoleFilter(role)}
                    className={`px-2.5 py-1 text-[10px] capitalize transition-colors cursor-pointer border-r border-zinc-850 last:border-0 ${
                      roleFilter === role
                        ? "bg-zinc-900 text-emerald-400 font-medium"
                        : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    {role === "review-requested" ? "review req." : role}
                  </button>
                ),
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main List Display */}
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

      {!error && (
        <div className="space-y-3.5">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)
          ) : filteredItems.length === 0 ? (
            <div className="rounded-lg border border-zinc-850 border-dashed bg-zinc-950/10 py-12 text-center font-mono">
              <svg className="w-8 h-8 text-zinc-700 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-xs text-zinc-500">No items match the active filters.</p>
            </div>
          ) : (
            filteredItems.map((item) => {
              const repoName = getRepoName(item.repository_url);
              const isPR = !item.isIssue;
              const isMerged = isPR && !!item.pull_request?.merged_at;
              const isOpen = item.state === "open" && !isMerged;

              return (
                <div
                  key={item.id}
                  className="group relative flex flex-col md:flex-row md:items-center justify-between border border-zinc-900 hover:border-zinc-800 bg-zinc-950/20 hover:bg-zinc-900/10 p-4.5 rounded-lg gap-4 transition-all duration-200"
                >
                  {/* Left Side: Status Icon, Title, and Meta */}
                  <div className="flex items-start gap-3.5 min-w-0">
                    <span className="mt-1 flex-shrink-0">
                      {isPR ? (
                        isMerged ? (
                          <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <circle cx="6" cy="18" r="2.5" />
                            <circle cx="18" cy="18" r="2.5" />
                            <circle cx="12" cy="6" r="2.5" />
                            <path d="M12 8.5V13a3 3 0 0 1-3 3h-.5m0 0L6 18.5M8.5 16l-2-2.5" />
                            <path d="M18 15.5V13a3 3 0 0 0-3-3h-3.5" />
                          </svg>
                        ) : isOpen ? (
                          <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <circle cx="6" cy="18" r="2.5" />
                            <circle cx="6" cy="6" r="2.5" />
                            <circle cx="18" cy="6" r="2.5" />
                            <path d="M6 8.5V15.5M18 8.5V12a3 3 0 0 1-3 3H9" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <circle cx="6" cy="18" r="2.5" />
                            <circle cx="6" cy="6" r="2.5" />
                            <circle cx="18" cy="6" r="2.5" />
                            <path d="M6 8.5V15.5M18 8.5V12a3 3 0 0 1-3 3H9" />
                            <line x1="4" y1="4" x2="20" y2="20" stroke="currentColor" strokeWidth="1.5" />
                          </svg>
                        )
                      ) : isOpen ? (
                        <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10" />
                          <line x1="12" y1="8" x2="12" y2="12" />
                          <circle cx="12" cy="16" r="0.8" fill="currentColor" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
                        </svg>
                      )}
                    </span>

                    <div className="space-y-1.5 min-w-0">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="text-[11px] font-mono text-zinc-500 group-hover:text-zinc-400 transition-colors">
                          {repoName}
                        </span>
                        <span className="text-[11px] font-mono text-zinc-600">
                          #{item.number}
                        </span>
                        {item.isReviewRequested && (
                          <span className="text-[9px] bg-purple-950/40 border border-purple-800/40 text-purple-300 font-mono px-1.5 py-0.5 rounded-full">
                            Review Requested
                          </span>
                        )}
                        {item.isAssigned && (
                          <span className="text-[9px] bg-amber-950/40 border border-amber-800/40 text-amber-400 font-mono px-1.5 py-0.5 rounded-full">
                            Assigned
                          </span>
                        )}
                      </div>

                      <a
                        href={item.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-xs font-semibold text-zinc-300 group-hover:text-emerald-400 transition-colors duration-150 leading-relaxed font-sans pr-4"
                      >
                        {item.title}
                      </a>

                      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                        <span className="text-[10px] font-mono text-zinc-600">
                          by <span className="text-zinc-500 font-medium">{item.user?.login}</span>
                        </span>
                        <span className="text-zinc-700 text-[10px] font-mono">•</span>
                        <span className="text-[10px] font-mono text-zinc-600" title={new Date(item.created_at).toLocaleString()}>
                          opened {formatRelativeTime(item.created_at)}
                        </span>
                        {item.labels && item.labels.length > 0 && (
                          <>
                            <span className="text-zinc-700 text-[10px] font-mono">•</span>
                            <div className="flex flex-wrap gap-1">
                              {item.labels.slice(0, 5).map((label) => {
                                const styles = getLabelStyles(label.color);
                                return (
                                  <span
                                    key={label.id}
                                    style={styles}
                                    className="text-[9px] font-mono px-1.5 py-0.5 rounded border leading-none font-medium"
                                    title={label.description}
                                  >
                                    {label.name}
                                  </span>
                                );
                              })}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Side: Comments and Assignees */}
                  <div className="flex items-center gap-5 ml-7.5 md:ml-0 flex-shrink-0 self-end md:self-center">
                    {/* Comments Indicator */}
                    {item.comments > 0 && (
                      <div className="flex items-center gap-1.5 text-zinc-600 group-hover:text-zinc-500 transition-colors font-mono text-[10px]">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <span>{item.comments}</span>
                      </div>
                    )}

                    {/* Assignee Avatar Stack */}
                    {item.assignees && item.assignees.length > 0 && (
                      <div className="flex -space-x-1.5 overflow-hidden">
                        {item.assignees.slice(0, 3).map((assignee) => (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            key={assignee.login}
                            src={assignee.avatar_url}
                            className="w-5.5 h-5.5 rounded-full border border-zinc-950 bg-zinc-900 object-cover inline-block"
                            alt={assignee.login}
                            title={`Assigned to ${assignee.login}`}
                          />
                        ))}
                        {item.assignees.length > 3 && (
                          <div className="w-5.5 h-5.5 rounded-full border border-zinc-950 bg-zinc-900 text-zinc-500 font-mono text-[8px] flex items-center justify-center inline-block">
                            +{item.assignees.length - 3}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
