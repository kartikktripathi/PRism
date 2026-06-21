"use client";

import { useState, useEffect, useCallback } from "react";

interface ReviewsAndCommentsProps {
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

interface PendingReviewPR {
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
  assignees: GitHubUser[];
  repository_url: string;
}

export default function ReviewsAndComments({ session, username }: ReviewsAndCommentsProps) {
  const [prs, setPrs] = useState<PendingReviewPR[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const fetchPendingReviews = useCallback(async () => {
    await Promise.resolve();

    if (!username || !session?.accessToken) {
      setError("Please authenticate with GitHub to load pending reviews.");
      setLoading(false);
      return;
    }

    setError(null);
    const headers = {
      Authorization: `Bearer ${session.accessToken}`,
      Accept: "application/vnd.github+json",
    };

    try {
      const url = `https://api.github.com/search/issues?q=is:pr+is:open+review-requested:${username}+-reviewed-by:${username}&per_page=100`;
      const res = await fetch(url, { headers });

      if (!res.ok) {
        throw new Error("Failed to fetch pending review requests from GitHub.");
      }

      const data = await res.json();
      setPrs(data.items || []);
    } catch (err: unknown) {
      console.error(err);
      const errMsg = err instanceof Error ? err.message : "Something went wrong while loading pending reviews.";
      setError(errMsg);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [username, session]);

  useEffect(() => {
    if (username && session) {
      const timer = setTimeout(() => {
        fetchPendingReviews();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [username, session, fetchPendingReviews]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchPendingReviews();
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
          <h1 className="text-3xl font-semibold text-white tracking-wide">Reviews & Comments</h1>
          <p className="text-xs text-zinc-500 mt-2 font-mono">
            Manage incoming code reviews and actions assigned directly to you.
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

      {/* Review Requests Section */}
      <div className="border-t border-zinc-900/60 pt-6 space-y-4">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-zinc-200">Awaiting Your Review</h2>
          {!loading && prs.length > 0 && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-950/40 border border-amber-800/40 font-mono text-amber-400">
              {prs.length} pending
            </span>
          )}
        </div>
        <p className="text-xs text-zinc-500 font-mono">
          Pull requests where your review has been requested, and you have not submitted it yet.
        </p>

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
              Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
            ) : prs.length === 0 ? (
              <div className="rounded-lg border border-zinc-850 border-dashed bg-zinc-950/10 py-12 text-center font-mono">
                <svg className="w-8 h-8 text-zinc-700 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
                </svg>
                <p className="text-xs text-zinc-500">You are all caught up! No pull requests are awaiting your review.</p>
              </div>
            ) : (
              prs.map((item) => {
                const repoName = getRepoName(item.repository_url);

                return (
                  <div
                    key={item.id}
                    className="group relative flex flex-col md:flex-row md:items-center justify-between border border-zinc-900 hover:border-zinc-800 bg-zinc-950/20 hover:bg-zinc-900/10 p-4.5 rounded-lg gap-4 transition-all duration-200"
                  >
                    {/* Left Side: Status Icon, Title, and Meta */}
                    <div className="flex items-start gap-3.5 min-w-0">
                      <span className="mt-1 flex-shrink-0">
                        {/* Open PR - Green */}
                        <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <circle cx="6" cy="18" r="2.5" />
                          <circle cx="6" cy="6" r="2.5" />
                          <circle cx="18" cy="6" r="2.5" />
                          <path d="M6 8.5V15.5M18 8.5V12a3 3 0 0 1-3 3H9" />
                        </svg>
                      </span>

                      <div className="space-y-1.5 min-w-0">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <span className="text-[11px] font-mono text-zinc-500 group-hover:text-zinc-400 transition-colors">
                            {repoName}
                          </span>
                          <span className="text-[11px] font-mono text-zinc-600">
                            #{item.number}
                          </span>
                          <span className="text-[9px] bg-amber-950/40 border border-amber-800/40 text-amber-400 font-mono px-1.5 py-0.5 rounded-full">
                            Pending Review
                          </span>
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
    </div>
  );
}
