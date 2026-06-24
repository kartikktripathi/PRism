"use client";

import { useState, useEffect } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { LiquidOcean } from "@/components/ui/liquid-ocean";
import Dashboard from "@/components/pages/Dashboard";
import IssuesAndPRs from "@/components/pages/IssuesAndPRs";
import ReviewsAndComments from "@/components/pages/ReviewsAndComments";
import Organizations from "@/components/pages/Organizations";
import GitWrapped from "@/components/pages/GitStats";
import Settings from "@/components/pages/Settings";

function calculateStreak(contributions: { count: number; date: string }[]) {
  if (!contributions || contributions.length === 0) return 0;

  const sorted = [...contributions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  const todayStr = new Date().toISOString().split("T")[0];
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  const todayEntry = sorted.find((c) => c.date === todayStr);
  const yesterdayEntry = sorted.find((c) => c.date === yesterdayStr);

  let activeIndex = -1;

  if (todayEntry && todayEntry.count > 0) {
    activeIndex = sorted.indexOf(todayEntry);
  } else if (yesterdayEntry && yesterdayEntry.count > 0) {
    activeIndex = sorted.indexOf(yesterdayEntry);
  } else {
    return 0;
  }

  let streak = 0;
  let i = activeIndex;
  while (i < sorted.length && sorted[i].count > 0) {
    streak++;
    i++;
  }

  return streak;
}

export default function Home() {
  const { data: session } = useSession();
  const [prs, setPrs] = useState<any[]>([]);
  const [username, setUsername] = useState<string | null>(null);
  const [githubUser, setGithubUser] = useState<any>(null);
  const [userRepos, setUserRepos] = useState<any[]>([]);
  const [topRepos, setTopRepos] = useState<any[]>([]);
  const [loadingTopRepos, setLoadingTopRepos] = useState<boolean>(false);
  const [contributionData, setContributionData] = useState<any[]>([]);
  const [loadingContribution, setLoadingContribution] =
    useState<boolean>(false);
  const [streak, setStreak] = useState<number>(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loadingNotifications, setLoadingNotifications] =
    useState<boolean>(false);

  const [position, setPosition] = useState({
    x: 0,
    y: 0,
  });
  const [selectedTab, setSelectedTab] = useState("Dashboard");

  const [dragging, setDragging] = useState(false);

  const [dragOffset, setDragOffset] = useState({
    x: 0,
    y: 0,
  });

  function handleTabChange(tab: string) {
    setSelectedTab(tab);
  }

  useEffect(() => {
    if (session) {
      fetchUser();
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        signIn("github");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [session]);

  async function fetchRepos() {
    const res = await fetch(
      "https://api.github.com/user/repos?per_page=100&type=all",
      {
        headers: {
          Authorization: `Bearer ${session?.accessToken}`,
        },
      },
    );

    const data = await res.json();

    setUserRepos(data);
  }

  useEffect(() => {
    if (username) {
      fetchPRs();
      fetchRepos();
      fetchRecentCommits();
      fetchContributionCalendar();
      fetchNotifications();
      console.log(userRepos);
    }
  }, [username]);

  async function fetchNotifications() {
    if (!username || !session?.accessToken) return;
    setLoadingNotifications(true);
    try {
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 7);
      const sinceISO = oneDayAgo.toISOString();

      const headers = {
        Authorization: `Bearer ${session.accessToken}`,
        Accept: "application/vnd.github+json",
      };

      // 1. Fetch Inbox Notifications
      const notifsRes = await fetch(
        `https://api.github.com/notifications?all=true&since=${sinceISO}`,
        { headers },
      );
      const notifs = notifsRes.ok ? await notifsRes.json() : [];

      // 2. Fetch Received Events (stars, forks)
      const eventsRes = await fetch(
        `https://api.github.com/users/${username}/received_events?per_page=100`,
        { headers },
      );
      const events = eventsRes.ok ? await eventsRes.json() : [];

      // 3. Fetch Followers
      const followersRes = await fetch(
        `https://api.github.com/users/${username}/followers?per_page=10`,
        { headers },
      );
      const followers = followersRes.ok ? await followersRes.json() : [];

      // 4. Fetch User's Own Events (for repo creation, etc.)
      const userEventsRes = await fetch(
        `https://api.github.com/users/${username}/events?per_page=100`,
        { headers },
      );
      const userEvents = userEventsRes.ok ? await userEventsRes.json() : [];

      // 5. Fetch User's Merged PRs
      const sinceDateOnly = sinceISO.split("T")[0];
      const mergedPRsRes = await fetch(
        `https://api.github.com/search/issues?q=is:pr+author:${username}+is:merged+merged:>=${sinceDateOnly}&per_page=50`,
        { headers },
      );
      const mergedPRsData = mergedPRsRes.ok ? await mergedPRsRes.json() : null;
      const mergedPRs = mergedPRsData?.items || [];

      // 6. Fetch User's Opened PRs
      const openedPRsRes = await fetch(
        `https://api.github.com/search/issues?q=is:pr+author:${username}+created:>=${sinceDateOnly}&per_page=50`,
        { headers },
      );
      const openedPRsData = openedPRsRes.ok ? await openedPRsRes.json() : null;
      const openedPRs = openedPRsData?.items || [];

      const feed: any[] = [];

      // Parse Inbox Notifications
      if (Array.isArray(notifs)) {
        const notifPromises = notifs.map(async (n: any) => {
          const notifDate = new Date(n.updated_at);
          const allowedReasons = [
            "mention",
            "review_requested",
            "author",
            "comment",
            "subscribed",
            "assign",
          ];
          if (notifDate < oneDayAgo || !allowedReasons.includes(n.reason)) {
            return null;
          }

          // Default actor is the repository owner (fallback)
          let actor = {
            login: n.repository.owner.login,
            avatarUrl: n.repository.owner.avatar_url,
          };
          let type =
            n.reason === "review_requested"
              ? "review_requested"
              : n.reason === "assign"
                ? "assign"
                : "mention";
          let actionText =
            n.reason === "review_requested"
              ? "requested your review on"
              : n.reason === "assign"
                ? "assigned you to"
                : "mentioned you in";
          let url = n.subject.url
            ? n.subject.url
                .replace("api.github.com/repos", "github.com")
                .replace("/pulls/", "/pull/")
            : `https://github.com/${n.repository.full_name}`;

          if (
            n.reason === "author" ||
            n.reason === "comment" ||
            n.reason === "subscribed"
          ) {
            type = "comment";
            actionText = "commented on your pull request";
          }

          // Try to fetch the latest comment details to get the actual actor and type
          if (n.subject.latest_comment_url) {
            try {
              const commentRes = await fetch(n.subject.latest_comment_url, {
                headers,
              });
              if (commentRes.ok) {
                const commentData = await commentRes.json();
                if (commentData.user) {
                  // Skip if the user commented/reviewed their own thread
                  if (
                    commentData.user.login.toLowerCase() ===
                    username.toLowerCase()
                  ) {
                    return null;
                  }
                  actor = {
                    login: commentData.user.login,
                    avatarUrl: commentData.user.avatar_url,
                  };
                }
                if (commentData.html_url) {
                  url = commentData.html_url;
                  if (url.includes("#pullrequestreview")) {
                    type = "review";
                    actionText = "reviewed your pull request";
                  } else if (url.includes("#discussion_r")) {
                    type = "comment";
                    actionText = "commented on your pull request";
                  } else if (url.includes("#issuecomment")) {
                    type = "comment";
                    actionText = "commented on your pull request";
                  }
                }
              }
            } catch (e) {
              console.error("Error fetching latest comment details:", e);
            }
          }

          return {
            id: `notif-${n.id}`,
            type,
            reason: n.reason,
            title: n.subject.title,
            actionText,
            repo: n.repository.full_name,
            actor,
            createdAt: n.updated_at,
            url,
          };
        });

        const parsedNotifs = (await Promise.all(notifPromises)).filter(Boolean);
        feed.push(...parsedNotifs);
      }

      // Parse Events (Stars & Forks)
      if (Array.isArray(events)) {
        events.forEach((e: any) => {
          const eventDate = new Date(e.created_at);
          if (eventDate >= oneDayAgo) {
            if (e.type === "WatchEvent" && e.payload?.action === "started") {
              const repoOwner = e.repo.name.split("/")[0];
              if (repoOwner.toLowerCase() === username.toLowerCase()) {
                feed.push({
                  id: `event-${e.id}`,
                  type: "star",
                  title: "starred your repository",
                  repo: e.repo.name,
                  actor: {
                    login: e.actor.login,
                    avatarUrl: e.actor.avatar_url,
                  },
                  createdAt: e.created_at,
                  url: `https://github.com/${e.repo.name}`,
                });
              }
            } else if (e.type === "ForkEvent") {
              const repoOwner = e.repo.name.split("/")[0];
              if (repoOwner.toLowerCase() === username.toLowerCase()) {
                feed.push({
                  id: `event-${e.id}`,
                  type: "fork",
                  title: "forked your repository",
                  repo: e.repo.name,
                  actor: {
                    login: e.actor.login,
                    avatarUrl: e.actor.avatar_url,
                  },
                  createdAt: e.created_at,
                  url:
                    e.payload?.forkee?.html_url ||
                    `https://github.com/${e.repo.name}`,
                });
              }
            }
          }
        });
      }

      // Parse Merged PRs
      if (Array.isArray(mergedPRs)) {
        mergedPRs.forEach((pr: any) => {
          const prMergedAt =
            pr.pull_request?.merged_at || pr.closed_at || pr.updated_at;
          const prMergedDate = new Date(prMergedAt);
          if (prMergedDate >= oneDayAgo) {
            const repoFullName = pr.repository_url.replace(
              "https://api.github.com/repos/",
              "",
            );
            const owner = repoFullName.split("/")[0];
            feed.push({
              id: `merged-${pr.id}`,
              type: "merged",
              title: pr.title,
              repo: repoFullName,
              actor: {
                login: owner,
                avatarUrl: `https://github.com/${owner}.png`,
              },
              createdAt: prMergedAt,
              url: pr.html_url,
            });
          }
        });
      }

      // Parse Opened PRs
      if (Array.isArray(openedPRs)) {
        openedPRs.forEach((pr: any) => {
          const prCreatedAt = pr.created_at;
          const prCreatedDate = new Date(prCreatedAt);
          if (prCreatedDate >= oneDayAgo) {
            const repoFullName = pr.repository_url.replace(
              "https://api.github.com/repos/",
              "",
            );
            feed.push({
              id: `opened-${pr.id}`,
              type: "opened",
              title: pr.title,
              repo: repoFullName,
              actor: {
                login: pr.user.login,
                avatarUrl: pr.user.avatar_url,
              },
              createdAt: prCreatedAt,
              url: pr.html_url,
            });
          }
        });
      }

      feed.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      setNotifications(feed);
    } catch (error) {
      console.error("Error fetching notifications feed:", error);
    } finally {
      setLoadingNotifications(false);
    }
  }

  async function fetchRecentCommits() {
    if (!username || !session?.accessToken) return;
    setLoadingTopRepos(true);
    try {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const res = await fetch("https://api.github.com/graphql", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session?.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: `
            query userTopRepos($LOGIN: String!, $FROM: DateTime!, $TO: DateTime!) {
              user(login: $LOGIN) {
                contributionsCollection(from: $FROM, to: $TO) {
                  commitContributionsByRepository(maxRepositories: 25) {
                    repository {
                      name
                      nameWithOwner
                      url
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
            FROM: sevenDaysAgo.toISOString(),
            TO: tomorrow.toISOString(),
          },
        }),
      });

      if (!res.ok) {
        throw new Error(`GraphQL request failed: ${res.statusText}`);
      }

      const json = await res.json();
      if (json.errors) {
        throw new Error(JSON.stringify(json.errors));
      }

      const reposList =
        json.data?.user?.contributionsCollection
          ?.commitContributionsByRepository || [];
      const repoCounts = reposList.map((item: any) => ({
        name: item.repository.name,
        fullName: item.repository.nameWithOwner,
        url: item.repository.url,
        count: item.contributions.totalCount,
      }));

      // Sort by commit count descending and take the top 3
      const sorted = repoCounts
        .sort((a: any, b: any) => b.count - a.count)
        .slice(0, 3);

      setTopRepos(sorted);
    } catch (error) {
      console.error("Error fetching top repos from GraphQL:", error);
    } finally {
      setLoadingTopRepos(false);
    }
  }

  async function fetchContributionCalendar() {
    if (!username || !session?.accessToken) return;
    setLoadingContribution(true);
    try {
      const now = new Date();

      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const oneYearAgo = new Date(now);
      oneYearAgo.setDate(oneYearAgo.getDate() - 365);

      const twoYearsAgo = new Date(now);
      twoYearsAgo.setDate(twoYearsAgo.getDate() - 730);

      const threeYearsAgo = new Date(now);
      threeYearsAgo.setDate(threeYearsAgo.getDate() - 1095);

      const fetchYear = (from: Date, to: Date) => {
        return fetch("https://api.github.com/graphql", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session?.accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query: `
              query userInfo($LOGIN: String!, $FROM: DateTime!, $TO: DateTime!) {
                user(login: $LOGIN) {
                  contributionsCollection(from: $FROM, to: $TO) {
                    contributionCalendar {
                      weeks {
                        contributionDays {
                          contributionCount
                          date
                        }
                      }
                    }
                  }
                }
              }
            `,
            variables: {
              LOGIN: username,
              FROM: from.toISOString(),
              TO: to.toISOString(),
            },
          }),
        }).then(async (res) => {
          if (!res.ok) {
            throw new Error(`GraphQL request failed: ${res.statusText}`);
          }
          const json = await res.json();
          if (json.errors) {
            throw new Error(JSON.stringify(json.errors));
          }
          return json;
        });
      };

      const [y1, y2, y3] = await Promise.all([
        fetchYear(oneYearAgo, tomorrow),
        fetchYear(twoYearsAgo, oneYearAgo),
        fetchYear(threeYearsAgo, twoYearsAgo),
      ]);

      const contributions: any[] = [];
      const processWeeks = (weeks: any[]) => {
        weeks.forEach((week: any) => {
          week.contributionDays.forEach((day: any) => {
            contributions.push({
              count: day.contributionCount,
              date: day.date,
            });
          });
        });
      };

      processWeeks(
        y1.data?.user?.contributionsCollection?.contributionCalendar?.weeks ||
          [],
      );
      processWeeks(
        y2.data?.user?.contributionsCollection?.contributionCalendar?.weeks ||
          [],
      );
      processWeeks(
        y3.data?.user?.contributionsCollection?.contributionCalendar?.weeks ||
          [],
      );

      const uniqueContributionsMap: { [date: string]: number } = {};
      contributions.forEach((c) => {
        uniqueContributionsMap[c.date] = c.count;
      });

      const uniqueContributions = Object.entries(uniqueContributionsMap).map(
        ([date, count]) => ({
          date,
          count,
        }),
      );

      uniqueContributions.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      );

      const streakValue = calculateStreak(uniqueContributions);
      setStreak(streakValue);

      const today = new Date();
      const past30Days = uniqueContributions.filter((c: any) => {
        const cDate = new Date(c.date);
        const timeDiff = today.getTime() - cDate.getTime();
        const diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
        return diffDays >= 0 && diffDays <= 30;
      });

      past30Days.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      );
      setContributionData(past30Days);
    } catch (error) {
      console.error("Error fetching contribution calendar:", error);
    } finally {
      setLoadingContribution(false);
    }
  }

  async function fetchUser() {
    const res = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${session?.accessToken}`,
      },
    });

    const data = await res.json();
    console.log("User:", data);
    setGithubUser(data);
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
      },
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

        <div
          className="w-full max-w-lg relative z-10"
          style={{
            left: position.x,
            top: position.y,
          }}
        >
          <div className="rounded-lg bg-zinc-950/70 backdrop-blur-md shadow-2xl overflow-hidden">
            <div
              onMouseDown={handleMouseDown}
              className="cursor-move flex items-center justify-between px-4 py-3 border-b border-zinc-800/60 bg-zinc-900/20"
            >
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
                <img
                  src="/logo.png"
                  className="w-48 h-24 object-contain"
                  alt="PRism Logo"
                />
                <h1 className="text-base text-zinc-200 font-semibold tracking-wide font-sans">
                  <span className="text-emerald-500 font-bold">❯</span> PRism —
                  An Open Sourcerer's Playground
                </h1>
                <p className="text-xs text-zinc-500 leading-relaxed font-sans">
                  A simple dashboard to track, review, and merge pull requests.
                  No bloat, no complex tracking. Just your repo queue in one
                  spot.
                </p>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => signIn("github")}
                  className="group relative w-full flex items-center justify-between rounded-md border border-zinc-800 bg-zinc-900/30 hover:bg-white hover:text-black hover:border-white p-3.5 transition-all duration-150 cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <svg
                      className="w-4 h-4 fill-current"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.483 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.137 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z"
                      />
                    </svg>
                    <span className="text-xs font-semibold tracking-wide font-mono">
                      Authenticate with GitHub
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-zinc-500 group-hover:text-black">
                    <span className="text-[10px] font-mono">Enter</span>
                    <span className="px-1 py-0.5 rounded border border-zinc-800 group-hover:border-zinc-300 text-[9px] font-mono">
                      ⏎
                    </span>
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

  const tabs = [
    "Dashboard",
    "Issues & PRs",
    "Reviews and Comments",
    "Organizations",
    "GitWrapped",
    "Settings",
  ];

  return (
    <main className="h-screen w-screen bg-[#09090b] text-[#a1a1aa] flex flex-col font-sans overflow-hidden select-none">
      {/* Top Header */}
      <header className="h-14 border-b border-zinc-800/60 bg-zinc-950/20 backdrop-blur-md flex items-center justify-between px-6 flex-shrink-0 z-10">
        {/* Left Side: PRism Logo */}
        <div className="flex items-center gap-3">
          <span className="font-mono text-sm tracking-wider font-semibold text-white">
            PRism
          </span>
          <span className="px-1.5 py-0.5 rounded border border-zinc-800 bg-zinc-900/40 text-[9px] font-mono text-zinc-500">
            v0.1.0
          </span>
        </div>

        {/* Right Side: GitHub Avatar & Name */}
        <div className="flex items-center gap-3.5">
          {streak > 0 && (
            <div
              className="flex items-center gap-1 text-amber-500 font-mono text-xs font-semibold"
              title={`${streak} day contribution streak`}
            >
              <span>🔥</span>
              <span>{streak >= 1000 ? "1000+" : streak}</span>
            </div>
          )}

          <div className="flex flex-col items-end text-[11px] font-mono leading-none gap-0.5">
            <span className="text-zinc-300 font-sans text-xs font-medium">
              {session?.user?.name || "Open Sourcerer"}
            </span>
            <span className="text-zinc-500">
              {session?.user?.email || "github-auth"}
            </span>
          </div>

          {session?.user?.image ? (
            <img
              src={session.user.image}
              className="w-8 h-8 rounded-full border border-zinc-800 bg-zinc-900 object-cover"
              alt="avatar"
            />
          ) : (
            <div className="w-8 h-8 rounded-full border border-zinc-800 bg-zinc-900 flex items-center justify-center text-xs font-mono text-zinc-400">
              {session?.user?.name?.[0] || "U"}
            </div>
          )}

          <button
            onClick={() => signOut()}
            className="p-1.5 rounded border border-zinc-800 bg-zinc-900/10 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-all cursor-pointer ml-1"
            title="Sign out"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 01-3-3h4a3 3 0 013 3v1"
              />
            </svg>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex flex-1 overflow-hidden w-full">
        {/* Sidebar Nav */}
        <aside className="w-60 border-r border-zinc-800/60 bg-zinc-950/10 py-6 px-4 flex flex-col justify-between h-full flex-shrink-0">
          <nav className="space-y-1">
            {tabs.map((tab) => {
              const isActive = selectedTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => handleTabChange(tab)}
                  className={`w-full flex items-center px-3 py-2 text-xs rounded transition-all cursor-pointer font-mono ${
                    isActive
                      ? "bg-zinc-900/60 border border-zinc-800/60 text-white font-medium"
                      : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/10 border border-transparent"
                  }`}
                >
                  {tab}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-8 bg-zinc-950/5">
          {selectedTab === "Dashboard" && (
            <Dashboard
              prs={prs}
              session={session}
              data={githubUser}
              repos={userRepos}
              topRepos={topRepos}
              loadingTopRepos={loadingTopRepos}
              contributionData={contributionData}
              loadingContribution={loadingContribution}
              notifications={notifications}
            />
          )}
          {selectedTab === "Issues & PRs" && <IssuesAndPRs session={session} username={username} />}
          {selectedTab === "Reviews and Comments" && <ReviewsAndComments session={session} username={username} />}
          {selectedTab === "Organizations" && <Organizations session={session} username={username} />}
          {selectedTab === "GitWrapped" && <GitWrapped />}
          {selectedTab === "Settings" && <Settings />}
        </main>
      </div>
    </main>
  );
}
