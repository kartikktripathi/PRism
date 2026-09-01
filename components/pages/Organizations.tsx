"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { League_Spartan, Montserrat } from "next/font/google";
import { SpotlightCard } from "@/components/ui/spotlight-card";
import { AnimatedCounter } from "@/components/ui/animated-counter";

const leagueSpartan = League_Spartan({
  subsets: ["latin"],
});

const montserrat = Montserrat({
  subsets: ["latin"],
});

interface OrganizationsProps {
  session: {
    accessToken?: string;
  } | null;
  username: string | null;
  onLoadComplete?: () => void;
}

interface OrganizationData {
  login: string;
  name: string;
  avatarUrl: string;
  commits: number;
  issues: number;
  pullRequests: number;
  reviews: number;
  comments: number;
  totalContributions: number;
  reposCount: number;
}

export default function Organizations({
  session,
  username,
  onLoadComplete,
}: OrganizationsProps) {
  const [orgs, setOrgs] = useState<OrganizationData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filter and Sorting state
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<
    | "total"
    | "commits"
    | "prs"
    | "issues"
    | "reviews"
    | "comments"
    | "alphabetical"
  >("total");
  const [filterActiveOnly, setFilterActiveOnly] = useState<boolean>(false);

  const fetchOrganizationsData = useCallback(async () => {
    await Promise.resolve();

    if (!username || !session?.accessToken) {
      setError("Please authenticate with GitHub to view organizations.");
      setLoading(false);
      onLoadComplete?.();
      return;
    }

    setError(null);
    const headers = {
      Authorization: `Bearer ${session.accessToken}`,
      "Content-Type": "application/json",
      Accept: "application/vnd.github+json",
    };

    try {
      const now = new Date();
      const oneYearAgo = new Date(now);
      oneYearAgo.setDate(oneYearAgo.getDate() - 365);
      const fromISO = oneYearAgo.toISOString();

      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const toISO = tomorrow.toISOString();

      // 1. GraphQL Query for Orgs & Contributions Collection
      const graphqlQuery = {
        query: `
          query userOrgsAndContributions($LOGIN: String!, $FROM: DateTime!, $TO: DateTime!) {
            user(login: $LOGIN) {
              organizations(first: 100) {
                nodes {
                  login
                  name
                  avatarUrl
                }
              }
              contributionsCollection(from: $FROM, to: $TO) {
                commitContributionsByRepository(maxRepositories: 100) {
                  repository {
                    nameWithOwner
                    owner {
                      login
                      avatarUrl
                      __typename
                    }
                  }
                  contributions {
                    totalCount
                  }
                }
                issueContributionsByRepository(maxRepositories: 100) {
                  repository {
                    nameWithOwner
                    owner {
                      login
                      avatarUrl
                      __typename
                    }
                  }
                  contributions {
                    totalCount
                  }
                }
                pullRequestContributionsByRepository(maxRepositories: 100) {
                  repository {
                    nameWithOwner
                    owner {
                      login
                      avatarUrl
                      __typename
                    }
                  }
                  contributions {
                    totalCount
                  }
                }
                pullRequestReviewContributionsByRepository(maxRepositories: 100) {
                  repository {
                    nameWithOwner
                    owner {
                      login
                      avatarUrl
                      __typename
                    }
                  }
                  contributions {
                    totalCount
                  }
                }
              }
            }
          }
        `,
        variables: {
          LOGIN: username,
          FROM: fromISO,
          TO: toISO,
        },
      };

      // 2. REST Search API for commenter activity in the past year
      const restSearchUrl = `https://api.github.com/search/issues?q=commenter:${username}+updated:>=${fromISO.split("T")[0]}&per_page=100`;

      const [graphqlRes, restRes] = await Promise.all([
        fetch("https://api.github.com/graphql", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(graphqlQuery),
        }),
        fetch(restSearchUrl, { headers }),
      ]);

      if (!graphqlRes.ok) {
        throw new Error(
          "Failed to fetch contribution details from GitHub GraphQL API.",
        );
      }
      if (!restRes.ok) {
        throw new Error(
          "Failed to fetch comment activity from GitHub Search API.",
        );
      }

      const graphqlData = await graphqlRes.json();
      if (graphqlData.errors) {
        throw new Error(
          graphqlData.errors[0]?.message || "GraphQL error occurred.",
        );
      }

      const restData = await restRes.json();

      const userOrgs = graphqlData.data?.user?.organizations?.nodes || [];
      const collections = graphqlData.data?.user?.contributionsCollection || {};
      const commentedItems = restData.items || [];

      // Map of organization login (lowercase) to organization statistics
      const orgsMap = new Map<
        string,
        OrganizationData & { reposSet: Set<string> }
      >();

      const getOrCreateOrg = (
        login: string,
        name?: string,
        avatarUrl?: string,
      ) => {
        const key = login.toLowerCase();
        let org = orgsMap.get(key);
        if (!org) {
          org = {
            login,
            name: name || login,
            avatarUrl: avatarUrl || `https://github.com/${login}.png`,
            commits: 0,
            issues: 0,
            pullRequests: 0,
            reviews: 0,
            comments: 0,
            totalContributions: 0,
            reposCount: 0,
            reposSet: new Set<string>(),
          };
          orgsMap.set(key, org);
        }
        return org;
      };

      // Initialize with user's official memberships
      userOrgs.forEach((o: any) => {
        getOrCreateOrg(o.login, o.name, o.avatarUrl);
      });

      // Parse Commit Contributions
      (collections.commitContributionsByRepository || []).forEach(
        (item: any) => {
          const owner = item.repository?.owner;
          if (owner && owner.__typename === "Organization") {
            const org = getOrCreateOrg(owner.login, undefined, owner.avatarUrl);
            org.commits += item.contributions?.totalCount || 0;
            org.reposSet.add(item.repository.nameWithOwner);
          }
        },
      );

      // Parse Issue Contributions
      (collections.issueContributionsByRepository || []).forEach(
        (item: any) => {
          const owner = item.repository?.owner;
          if (owner && owner.__typename === "Organization") {
            const org = getOrCreateOrg(owner.login, undefined, owner.avatarUrl);
            org.issues += item.contributions?.totalCount || 0;
            org.reposSet.add(item.repository.nameWithOwner);
          }
        },
      );

      // Parse Pull Request Contributions
      (collections.pullRequestContributionsByRepository || []).forEach(
        (item: any) => {
          const owner = item.repository?.owner;
          if (owner && owner.__typename === "Organization") {
            const org = getOrCreateOrg(owner.login, undefined, owner.avatarUrl);
            org.pullRequests += item.contributions?.totalCount || 0;
            org.reposSet.add(item.repository.nameWithOwner);
          }
        },
      );

      // Parse Pull Request Review Contributions
      (collections.pullRequestReviewContributionsByRepository || []).forEach(
        (item: any) => {
          const owner = item.repository?.owner;
          if (owner && owner.__typename === "Organization") {
            const org = getOrCreateOrg(owner.login, undefined, owner.avatarUrl);
            org.reviews += item.contributions?.totalCount || 0;
            org.reposSet.add(item.repository.nameWithOwner);
          }
        },
      );

      // Parse Comment activity from issues/PRs search
      commentedItems.forEach((item: any) => {
        const repoUrl = item.repository_url;
        const parts = repoUrl.split("/repos/");
        if (parts.length > 1) {
          const path = parts[1];
          const owner = path.split("/")[0];
          const key = owner.toLowerCase();

          // Increment comments count if this organization is in our map
          const org = orgsMap.get(key);
          if (org) {
            org.comments++;
            org.reposSet.add(path);
          }
        }
      });

      // Convert map to array and calculate total contributions and repos count
      const finalOrgsList: OrganizationData[] = Array.from(
        orgsMap.values(),
      ).map((org) => {
        const totalContributions =
          org.commits +
          org.issues +
          org.pullRequests +
          org.reviews +
          org.comments;
        return {
          login: org.login,
          name: org.name,
          avatarUrl: org.avatarUrl,
          commits: org.commits,
          issues: org.issues,
          pullRequests: org.pullRequests,
          reviews: org.reviews,
          comments: org.comments,
          totalContributions,
          reposCount: org.reposSet.size,
        };
      });

      setOrgs(finalOrgsList);
    } catch (err: unknown) {
      console.error(err);
      const errMsg =
        err instanceof Error
          ? err.message
          : "Something went wrong while loading organizations.";
      setError(errMsg);
    } finally {
      setLoading(false);
      onLoadComplete?.();
    }
  }, [username, session]);

  useEffect(() => {
    if (username && session) {
      const timer = setTimeout(() => {
        fetchOrganizationsData();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [username, session, fetchOrganizationsData]);

  const handleRefresh = async () => {
    await fetchOrganizationsData();
  };

  // Filter and Sort Logic
  const filteredAndSortedOrgs = useMemo(() => {
    let result = [...orgs];

    // 1. Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (o) =>
          o.name.toLowerCase().includes(q) || o.login.toLowerCase().includes(q),
      );
    }

    // 2. Active-only filter
    if (filterActiveOnly) {
      result = result.filter((o) => o.totalContributions > 0);
    }

    // 3. Sorting
    result.sort((a, b) => {
      if (sortBy === "total") {
        return b.totalContributions - a.totalContributions;
      } else if (sortBy === "commits") {
        return b.commits - a.commits;
      } else if (sortBy === "prs") {
        return b.pullRequests - a.pullRequests;
      } else if (sortBy === "issues") {
        return b.issues - a.issues;
      } else if (sortBy === "reviews") {
        return b.reviews - a.reviews;
      } else if (sortBy === "comments") {
        return b.comments - a.comments;
      } else if (sortBy === "alphabetical") {
        return a.name.localeCompare(b.name);
      }
      return 0;
    });

    return result;
  }, [orgs, searchQuery, filterActiveOnly, sortBy]);

  // Calculate dynamic counts based on currently loaded orgs
  const counts = useMemo(() => {
    return {
      totalOrgs: orgs.length,
      activeOrgs: orgs.filter((o) => o.totalContributions > 0).length,
      totalContributions: orgs.reduce(
        (acc, o) => acc + o.totalContributions,
        0,
      ),
      totalRepos: orgs.reduce((acc, o) => acc + o.reposCount, 0),
    };
  }, [orgs]);

  // Loading skeleton card matching the design style
  const SkeletonCard = () => (
    <div className="border border-zinc-900/80 bg-zinc-950/40 rounded-lg p-5 flex flex-col justify-between gap-5 animate-pulse min-h-[240px]">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3.5 min-w-0 flex-1">
          <div className="w-11 h-11 bg-zinc-800/80 rounded-lg flex-shrink-0" />
          <div className="space-y-2 flex-1 min-w-0">
            <div className="h-3.5 bg-zinc-800 rounded w-1/3" />
            <div className="h-2.5 bg-zinc-850 rounded w-1/4" />
          </div>
        </div>
        <div className="w-14 h-5 bg-zinc-850 rounded-full flex-shrink-0" />
      </div>
      <div className="grid grid-cols-3 gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-12 bg-zinc-900/50 border border-zinc-900/80 rounded-lg"
          />
        ))}
      </div>
      <div className="space-y-2 pt-2 border-t border-zinc-900/40">
        <div className="flex justify-between">
          <div className="h-2.5 bg-zinc-850 rounded w-1/4" />
          <div className="h-2.5 bg-zinc-850 rounded w-1/6" />
        </div>
        <div className="h-1.5 bg-zinc-900 rounded-full w-full" />
        <div className="h-3 bg-zinc-900/60 rounded w-1/2" />
      </div>
    </div>
  );

  return (
    <div className="space-y-8 select-none">
      {/* Header */}
      <div>
        <h1
          className={`text-5xl md:text-6xl text-white font-bold tracking-tight ${montserrat.className}`}
        >
          Organizations
        </h1>
        <p
          className={`mt-2 text-lg text-zinc-400 font-light tracking-wide ${leagueSpartan.className}`}
        >
          Track and analyze your contributions (commits, PRs, issues, reviews,
          comments) in organization codebases in the past year.
        </p>
      </div>

      {/* Summary Widgets */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            title: "Total Organizations",
            value: counts.totalOrgs,
            color: "#ffffff",
          },
          {
            title: "Active Organizations",
            value: counts.activeOrgs,
            color: "#e4e4e7",
          },
          {
            title: "Total Contributions",
            value: counts.totalContributions,
            color: "#c4c4c7",
          },
          {
            title: "Active Repositories",
            value: counts.totalRepos,
            color: "#a1a1aa",
          },
        ].map((stat) => (
          <SpotlightCard
            key={stat.title}
            spotlightColor={stat.color}
            className="h-[140px] transition-all duration-300 hover:translate-y-[-2px]"
          >
            <div className="flex flex-col justify-between h-full w-full">
              {/* Top Row: Title + Status Dot */}
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

              {/* Value Row with AnimatedCounter */}
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

      {/* Sorter and Search Control Bar */}
      <div className="space-y-4 border-t border-zinc-900/60 pt-6">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
            {/* Search Input */}
            <div className="relative w-full sm:w-80">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-600">
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Search organizations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-zinc-950/40 border border-zinc-800/50 hover:border-zinc-700/80 focus:border-zinc-600 text-zinc-300 placeholder-zinc-600 rounded text-xs font-mono outline-none transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-600 hover:text-zinc-400 cursor-pointer"
                >
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </div>

            {/* Active Only Filter Switch */}
            <button
              onClick={() => setFilterActiveOnly(!filterActiveOnly)}
              className={`flex items-center gap-2 border px-3.5 py-2.5 rounded transition-all cursor-pointer ${
                filterActiveOnly
                  ? "bg-emerald-950/30 border-emerald-800 text-emerald-400"
                  : "bg-zinc-900/10 border-zinc-800/80 hover:border-zinc-800 text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${filterActiveOnly ? "bg-emerald-400" : "bg-zinc-600"}`}
              />
              <span>
                Active Only (
                {orgs.filter((o) => o.totalContributions > 0).length})
              </span>
            </button>
          </div>

          {/* Sorter Selection */}
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-zinc-600 text-[11px]">Sort By:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-zinc-950 border border-zinc-800/80 focus:border-zinc-700 text-zinc-400 focus:text-zinc-200 outline-none rounded py-2.5 px-3 cursor-pointer font-mono"
            >
              <option value="total">Total Contributions</option>
              <option value="commits">Commits</option>
              <option value="prs">Pull Requests</option>
              <option value="issues">Issues</option>
              <option value="reviews">Code Reviews</option>
              <option value="comments">Comments</option>
              <option value="alphabetical">Alphabetical</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Grid View */}
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
        <>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : filteredAndSortedOrgs.length === 0 ? (
            <div className="rounded-lg border border-zinc-800/60 border-dashed bg-zinc-950/10 py-12 text-center font-mono">
              <svg
                className="w-8 h-8 text-zinc-700 mx-auto mb-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-xs text-zinc-500">
                No organizations match the active filters or search term.
              </p>
              {(searchQuery || filterActiveOnly) && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setFilterActiveOnly(false);
                  }}
                  className="mt-3.5 text-[10px] text-emerald-500 hover:text-emerald-400 hover:underline cursor-pointer transition-colors"
                >
                  Clear Filters & Search
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredAndSortedOrgs.map((org) => {
                const total = org.totalContributions;

                // Percentages for the breakdown bar (prevent division by zero)
                const pctCommits = total > 0 ? (org.commits / total) * 100 : 0;
                const pctPrs = total > 0 ? (org.pullRequests / total) * 100 : 0;
                const pctIssues = total > 0 ? (org.issues / total) * 100 : 0;
                const pctReviews = total > 0 ? (org.reviews / total) * 100 : 0;
                const pctComments =
                  total > 0 ? (org.comments / total) * 100 : 0;

                const displayName = org.name || org.login;

                return (
                  <SpotlightCard
                    key={org.login}
                    spotlightColor="rgba(255, 255, 255, 0.08)"
                    className="rounded-lg transition-all duration-300 hover:translate-y-[-2px] hover:shadow-lg"
                  >
                    <a
                      href={`https://github.com/${org.login}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex flex-col justify-between h-full w-full gap-5"
                    >
                      {/* Header info */}
                      <div className="flex items-center justify-between gap-3 w-full">
                        <div className="flex items-center gap-3.5 min-w-0 flex-1">
                          {org.avatarUrl ? (
                            <img
                              src={org.avatarUrl}
                              className="w-11 h-11 rounded-lg border border-zinc-800/80 bg-zinc-950 object-cover flex-shrink-0"
                              alt={displayName}
                            />
                          ) : (
                            <div className="w-11 h-11 rounded-lg border border-zinc-800/80 bg-zinc-900 flex items-center justify-center text-zinc-400 font-mono text-sm font-semibold flex-shrink-0">
                              {displayName.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <h2 className="text-sm font-semibold text-zinc-200 group-hover:text-emerald-400 transition-colors truncate">
                              {displayName}
                            </h2>
                            <p className="text-[11px] text-zinc-500 font-mono truncate">
                              @{org.login}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {total > 0 ? (
                            <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-emerald-950/40 border border-emerald-800/50 text-emerald-400 font-medium">
                              Active
                            </span>
                          ) : (
                            <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800/60 text-zinc-500">
                              Inactive
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-3 gap-2 text-center font-mono">
                        <div className="border border-zinc-800/60 bg-zinc-950/40 p-2 rounded-lg flex flex-col justify-center">
                          <p className="text-[9px] uppercase tracking-wider text-zinc-500 font-medium">
                            Commits
                          </p>
                          <p className="text-sm font-bold text-zinc-200 mt-1">
                            {org.commits}
                          </p>
                        </div>
                        <div className="border border-zinc-800/60 bg-zinc-950/40 p-2 rounded-lg flex flex-col justify-center">
                          <p className="text-[9px] uppercase tracking-wider text-zinc-500 font-medium">
                            PRs
                          </p>
                          <p className="text-sm font-bold text-emerald-400 mt-1">
                            {org.pullRequests}
                          </p>
                        </div>
                        <div className="border border-zinc-800/60 bg-zinc-950/40 p-2 rounded-lg flex flex-col justify-center">
                          <p className="text-[9px] uppercase tracking-wider text-zinc-500 font-medium">
                            Issues
                          </p>
                          <p className="text-sm font-bold text-amber-400 mt-1">
                            {org.issues}
                          </p>
                        </div>
                        <div className="border border-zinc-800/60 bg-zinc-950/40 p-2 rounded-lg flex flex-col justify-center">
                          <p className="text-[9px] uppercase tracking-wider text-zinc-500 font-medium">
                            Reviews
                          </p>
                          <p className="text-sm font-bold text-purple-400 mt-1">
                            {org.reviews}
                          </p>
                        </div>
                        <div className="border border-zinc-800/60 bg-zinc-950/40 p-2 rounded-lg flex flex-col justify-center">
                          <p className="text-[9px] uppercase tracking-wider text-zinc-500 font-medium">
                            Comments
                          </p>
                          <p className="text-sm font-bold text-blue-400 mt-1">
                            {org.comments}
                          </p>
                        </div>
                        <div className="border border-emerald-900/40 bg-emerald-950/20 p-2 rounded-lg flex flex-col justify-center">
                          <p className="text-[9px] uppercase tracking-wider text-emerald-400/90 font-semibold">
                            Total
                          </p>
                          <p className="text-sm font-bold text-emerald-300 mt-1">
                            {total}
                          </p>
                        </div>
                      </div>

                      {/* Stacked Breakdown Bar & Footer */}
                      <div className="space-y-2 pt-2 border-t border-zinc-900/60">
                        <div className="flex justify-between items-center text-[9px] font-mono text-zinc-400">
                          <span>Contribution Breakdown</span>
                          <span className="text-zinc-500">
                            {org.reposCount > 0
                              ? `${org.reposCount} active ${org.reposCount === 1 ? "repo" : "repos"}`
                              : "0 active repos"}
                          </span>
                        </div>
                        <div className="w-full h-1.5 rounded-full overflow-hidden bg-zinc-900 flex">
                          {total === 0 ? (
                            <div
                              className="w-full h-full bg-zinc-800/40 rounded-full"
                              title="No contributions in past year"
                            />
                          ) : (
                            <>
                              {org.commits > 0 && (
                                <div
                                  className="bg-zinc-400 h-full border-r border-zinc-950/40 last:border-0"
                                  style={{ width: `${pctCommits}%` }}
                                  title={`Commits: ${org.commits}`}
                                />
                              )}
                              {org.pullRequests > 0 && (
                                <div
                                  className="bg-emerald-500 h-full border-r border-zinc-950/40 last:border-0"
                                  style={{ width: `${pctPrs}%` }}
                                  title={`Pull Requests: ${org.pullRequests}`}
                                />
                              )}
                              {org.issues > 0 && (
                                <div
                                  className="bg-amber-500 h-full border-r border-zinc-950/40 last:border-0"
                                  style={{ width: `${pctIssues}%` }}
                                  title={`Issues: ${org.issues}`}
                                />
                              )}
                              {org.reviews > 0 && (
                                <div
                                  className="bg-purple-500 h-full border-r border-zinc-950/40 last:border-0"
                                  style={{ width: `${pctReviews}%` }}
                                  title={`Reviews: ${org.reviews}`}
                                />
                              )}
                              {org.comments > 0 && (
                                <div
                                  className="bg-blue-500 h-full border-r border-zinc-950/40 last:border-0"
                                  style={{ width: `${pctComments}%` }}
                                  title={`Comments: ${org.comments}`}
                                />
                              )}
                            </>
                          )}
                        </div>

                        {/* Segment legends (consistent height container) */}
                        <div className="min-h-[1.25rem] flex flex-wrap items-center gap-x-3 gap-y-1 text-[8.5px] font-mono text-zinc-500">
                          {total > 0 ? (
                            <>
                              {org.commits > 0 && (
                                <span className="flex items-center gap-1.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
                                  Commits ({Math.round(pctCommits)}%)
                                </span>
                              )}
                              {org.pullRequests > 0 && (
                                <span className="flex items-center gap-1.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                  PRs ({Math.round(pctPrs)}%)
                                </span>
                              )}
                              {org.issues > 0 && (
                                <span className="flex items-center gap-1.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                  Issues ({Math.round(pctIssues)}%)
                                </span>
                              )}
                              {org.reviews > 0 && (
                                <span className="flex items-center gap-1.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                                  Reviews ({Math.round(pctReviews)}%)
                                </span>
                              )}
                              {org.comments > 0 && (
                                <span className="flex items-center gap-1.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                  Comments ({Math.round(pctComments)}%)
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="text-zinc-600 text-[8.5px]">
                              No contributions in the past year
                            </span>
                          )}
                        </div>
                      </div>
                    </a>
                  </SpotlightCard>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
