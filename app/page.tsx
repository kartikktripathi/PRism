"use client";

import { useState, useEffect } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { LiquidOcean } from "@/components/ui/liquid-ocean";
import Dashboard from "@/components/pages/Dashboard";
import IssuesAndPRs from "@/components/pages/IssuesAndPRs";
import ReviewsAndComments from "@/components/pages/ReviewsAndComments";
import Organizations from "@/components/pages/Organizations";
import GitWrapped from "@/components/pages/GitStats";
import { DashboardLoader, LoadStates } from "@/components/ui/dashboard-loader";
import { Outfit } from "next/font/google";
import { LineHoverLink } from "@/components/ui/line-hover-link";
import { FolderPreview } from "@/components/ui/folder-preview";
import { motion, AnimatePresence } from "framer-motion";

const outfit = Outfit({
  subsets: ["latin"],
});

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
  const [loadStates, setLoadStates] = useState<LoadStates>({
    user: { status: "idle", errorCount: 0 },
    repos: { status: "idle", errorCount: 0 },
    prs: { status: "idle", errorCount: 0 },
    topRepos: { status: "idle", errorCount: 0 },
    contributions: { status: "idle", errorCount: 0 },
    notifications: { status: "idle", errorCount: 0 },
  });
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  const [position, setPosition] = useState({
    x: 0,
    y: 0,
  });
  const [selectedTab, setSelectedTab] = useState("Dashboard");
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);

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
      if (loadStates.user.status === "idle") {
        fetchUserWithRetry();
      }
    } else {
      setLoadStates({
        user: { status: "idle", errorCount: 0 },
        repos: { status: "idle", errorCount: 0 },
        prs: { status: "idle", errorCount: 0 },
        topRepos: { status: "idle", errorCount: 0 },
        contributions: { status: "idle", errorCount: 0 },
        notifications: { status: "idle", errorCount: 0 },
      });
      setUsername(null);
      setGithubUser(null);
      setInitialLoadComplete(false);
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        signIn("github");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [session]);

  useEffect(() => {
    if (username) {
      if (loadStates.repos.status === "idle") fetchReposWithRetry();
      if (loadStates.prs.status === "idle") fetchPRsWithRetry();
      if (loadStates.topRepos.status === "idle") fetchRecentCommitsWithRetry();
      if (loadStates.contributions.status === "idle")
        fetchContributionCalendarWithRetry();
      if (loadStates.notifications.status === "idle")
        fetchNotificationsWithRetry();
    }
  }, [
    username,
    loadStates.repos.status,
    loadStates.prs.status,
    loadStates.topRepos.status,
    loadStates.contributions.status,
    loadStates.notifications.status,
  ]);

  useEffect(() => {
    if (
      loadStates.user.status === "success" &&
      loadStates.repos.status === "success" &&
      loadStates.prs.status === "success" &&
      loadStates.topRepos.status === "success" &&
      loadStates.contributions.status === "success" &&
      loadStates.notifications.status === "success"
    ) {
      setInitialLoadComplete(true);
    }
  }, [
    loadStates.user.status,
    loadStates.repos.status,
    loadStates.prs.status,
    loadStates.topRepos.status,
    loadStates.contributions.status,
    loadStates.notifications.status,
  ]);

  async function fetchUserWithRetry() {
    if (!session?.accessToken) return;
    setLoadStates((prev) => ({
      ...prev,
      user: { ...prev.user, status: "loading" },
    }));
    try {
      const res = await fetch("https://api.github.com/user", {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
      });
      if (!res.ok) {
        throw new Error(`Failed to fetch user: ${res.status}`);
      }
      const data = await res.json();
      setGithubUser(data);
      setUsername(data.login);
      setLoadStates((prev) => ({
        ...prev,
        user: { status: "success", errorCount: 0 },
      }));
    } catch (err) {
      console.error("fetchUser failed, retrying in 3s...", err);
      setLoadStates((prev) => ({
        ...prev,
        user: { status: "error", errorCount: prev.user.errorCount + 1 },
      }));
      setTimeout(fetchUserWithRetry, 3000);
    }
  }

  async function fetchReposWithRetry() {
    if (!session?.accessToken) return;
    setLoadStates((prev) => ({
      ...prev,
      repos: { ...prev.repos, status: "loading" },
    }));
    try {
      const res = await fetch(
        "https://api.github.com/user/repos?per_page=100&type=all",
        {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        },
      );
      if (!res.ok) {
        throw new Error(`Failed to fetch repos: ${res.status}`);
      }
      const data = await res.json();
      if (!Array.isArray(data)) {
        throw new Error("Expected array for repos");
      }
      setUserRepos(data);
      setLoadStates((prev) => ({
        ...prev,
        repos: { status: "success", errorCount: 0 },
      }));
    } catch (err) {
      console.error("fetchRepos failed, retrying in 3s...", err);
      setLoadStates((prev) => ({
        ...prev,
        repos: { status: "error", errorCount: prev.repos.errorCount + 1 },
      }));
      setTimeout(fetchReposWithRetry, 3000);
    }
  }

  async function fetchPRsWithRetry() {
    if (!username || !session?.accessToken) return;
    setLoadStates((prev) => ({
      ...prev,
      prs: { ...prev.prs, status: "loading" },
    }));
    try {
      const res = await fetch(
        `https://api.github.com/search/issues?q=is:pr+author:${username}`,
        {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        },
      );
      if (!res.ok) {
        throw new Error(`Failed to fetch PRs: ${res.status}`);
      }
      const data = await res.json();
      setPrs(data.items || []);
      setLoadStates((prev) => ({
        ...prev,
        prs: { status: "success", errorCount: 0 },
      }));
    } catch (err) {
      console.error("fetchPRs failed, retrying in 3s...", err);
      setLoadStates((prev) => ({
        ...prev,
        prs: { status: "error", errorCount: prev.prs.errorCount + 1 },
      }));
      setTimeout(fetchPRsWithRetry, 3000);
    }
  }

  async function fetchRecentCommitsWithRetry() {
    if (!username || !session?.accessToken) return;
    setLoadStates((prev) => ({
      ...prev,
      topRepos: { ...prev.topRepos, status: "loading" },
    }));
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
          Authorization: `Bearer ${session.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: `
            query userTopRepos($LOGIN: String!, $FROM: DateTime!, $TO: DateTime!) {
              user(login: $LOGIN) {
                contributionsCollection(from: $FROM, to: $TO) {
                  commitContributionsByRepository(maxRepositories: 100) {
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

      const sorted = repoCounts
        .sort((a: any, b: any) => b.count - a.count)
        .slice(0, 3);

      setTopRepos(sorted);
      setLoadStates((prev) => ({
        ...prev,
        topRepos: { status: "success", errorCount: 0 },
      }));
    } catch (error) {
      console.error(
        "Error fetching top repos from GraphQL, retrying in 3s...",
        error,
      );
      setLoadStates((prev) => ({
        ...prev,
        topRepos: { status: "error", errorCount: prev.topRepos.errorCount + 1 },
      }));
      setTimeout(fetchRecentCommitsWithRetry, 3000);
    } finally {
      setLoadingTopRepos(false);
    }
  }

  async function fetchContributionCalendarWithRetry() {
    if (!username || !session?.accessToken) return;
    setLoadStates((prev) => ({
      ...prev,
      contributions: { ...prev.contributions, status: "loading" },
    }));
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
      setLoadStates((prev) => ({
        ...prev,
        contributions: { status: "success", errorCount: 0 },
      }));
    } catch (error) {
      console.error(
        "Error fetching contribution calendar, retrying in 3s...",
        error,
      );
      setLoadStates((prev) => ({
        ...prev,
        contributions: {
          status: "error",
          errorCount: prev.contributions.errorCount + 1,
        },
      }));
      setTimeout(fetchContributionCalendarWithRetry, 3000);
    } finally {
      setLoadingContribution(false);
    }
  }

  async function fetchNotificationsWithRetry() {
    if (!username || !session?.accessToken) return;
    setLoadStates((prev) => ({
      ...prev,
      notifications: { ...prev.notifications, status: "loading" },
    }));
    try {
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);
      const sinceISO = oneDayAgo.toISOString();

      const headers = {
        Authorization: `Bearer ${session.accessToken}`,
        Accept: "application/vnd.github+json",
      };

      const fetchWithCheck = async (url: string) => {
        const res = await fetch(url, { headers });
        if (!res.ok) {
          throw new Error(`Failed to fetch ${url}: Status ${res.status}`);
        }
        return res.json();
      };

      // 1. Fetch Inbox Notifications
      const notifs = await fetchWithCheck(
        `https://api.github.com/notifications?all=true&since=${sinceISO}`,
      );

      // 2. Fetch Received Events (stars, forks)
      const events = await fetchWithCheck(
        `https://api.github.com/users/${username}/received_events?per_page=100`,
      );

      // 3. Fetch Followers
      const followers = await fetchWithCheck(
        `https://api.github.com/users/${username}/followers?per_page=10`,
      );

      // 4. Fetch User's Own Events (for repo creation, etc.)
      const userEvents = await fetchWithCheck(
        `https://api.github.com/users/${username}/events?per_page=100`,
      );

      // 5. Fetch User's Merged PRs
      const sinceDateOnly = sinceISO.split("T")[0];
      const mergedPRsData = await fetchWithCheck(
        `https://api.github.com/search/issues?q=is:pr+author:${username}+is:merged+merged:>=${sinceDateOnly}&per_page=50`,
      );
      const mergedPRs = mergedPRsData?.items || [];

      // 6. Fetch User's Opened PRs
      const openedPRsData = await fetchWithCheck(
        `https://api.github.com/search/issues?q=is:pr+author:${username}+created:>=${sinceDateOnly}&per_page=50`,
      );
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
      setLoadStates((prev) => ({
        ...prev,
        notifications: { status: "success", errorCount: 0 },
      }));
    } catch (error) {
      console.error("Error fetching notifications, retrying in 3s...", error);
      setLoadStates((prev) => ({
        ...prev,
        notifications: {
          status: "error",
          errorCount: prev.notifications.errorCount + 1,
        },
      }));
      setTimeout(fetchNotificationsWithRetry, 3000);
    }
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
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 cursor-pointer" />
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 cursor-pointer" />
                <span className="w-2.5 h-2.5 rounded-full bg-green-500 cursor-pointer" />
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

  if (session && !initialLoadComplete) {
    return <DashboardLoader loadStates={loadStates} />;
  }

  const tabs = [
    "Dashboard",
    "Issues & PRs",
    "Reviews & Comments",
    "Organizations",
    "GitStats",
  ];

  return (
    <main className="h-screen w-screen bg-black text-[#a1a1aa] flex flex-col font-sans overflow-hidden select-none">
      {/* Top Header */}
      <header className="h-16 bg-black backdrop-blur-md flex items-center justify-between px-6 flex-shrink-0 z-10">
        {/* Left Side: PRism Logo */}
        <div
          onClick={() => window.location.reload()}
          className="flex justify-start -ml-15 translate-y-[15px] hover:cursor-pointer hover:scale-130 duration-500"
        >
          <img src="/logo.png" className="w-36 h-16 object-contain" />
        </div>

        {/* Right Side: GitHub Avatar & Name */}
        <div className="group/profile relative flex items-center h-full pr-1">
          {/* Sliding wrapper containing Streak, Name, and Avatar */}
          <div className="flex items-center gap-3.5 transition-transform duration-300 ease-out group-hover/profile:-translate-x-10 z-10">
            {streak > 0 && (
              <div
                className="flex items-center gap-1 text-amber-500 font-mono text-xs font-semibold"
                title={`${streak} day contribution streak`}
              >
                <span className={`${outfit.className} text-lg`}>{streak >= 1000 ? "1000+" : streak}</span>
                <img className="w-6 h-6 object-contain" src="/fire.gif" />
              </div>
            )}

            <div className={`${outfit.className} flex flex-col items-end text-[8px] leading-none gap-0.5 uppercase`}>
              <span className="text-zinc-300 text-xs font-medium">
                {session?.user?.name || "Open Sourcerer"}
              </span>
              <span className="text-zinc-500">
                {username || "Username Unavailable"}
              </span>
            </div>

            {session?.user?.image ? (
              <img
                src={session.user.image}
                className="w-8 h-8 rounded-full object-cover hover:cursor-pointer"
                alt="avatar"
                onClick={() => window.open(`https://github.com/${username}`, "_blank")}
              />
            ) : (
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-mono text-zinc-400">
                {session?.user?.name?.[0] || "User"}
              </div>
            )}
          </div>

          {/* Logout Button (Hidden behind/revealed on hover) */}
          <button
            onClick={() => signOut()}
            className="absolute right-1 z-0 w-8 h-8 rounded-full border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-all cursor-pointer flex items-center justify-center top-1/2 -translate-y-1/2"
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
                d="M5 12h14M12 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex flex-1 overflow-hidden w-full">
        {/* Sidebar Nav */}
        <aside
          onMouseEnter={() => setIsSidebarHovered(true)}
          onMouseLeave={() => setIsSidebarHovered(false)}
          className="w-60 bg-black py-8 px-4 flex flex-col justify-end h-[calc(100%-32px)] my-4 flex-shrink-0 relative overflow-hidden border-r border-t border-b rounded-r-2xl border-zinc-900"
        >
          <nav className="flex-1 flex flex-col justify-end w-full">
            <AnimatePresence>
              {isSidebarHovered && (
                <motion.div
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  variants={{
                    visible: {
                      transition: {
                        staggerChildren: 0.08,
                        staggerDirection: -1,
                      }
                    },
                    hidden: {
                      transition: {
                        staggerChildren: 0.05,
                        staggerDirection: 1,
                      }
                    }
                  }}
                  className="space-y-6 mb-8 flex flex-col items-center justify-end"
                >
                  {tabs.map((tab) => {
                    const isActive = selectedTab === tab;
                    const isMultiLine = tab === "Issues & PRs" || tab === "Reviews & Comments";
                    return (
                      <motion.div
                        key={tab}
                        variants={{
                          hidden: { opacity: 0, y: 180, scale: 0.8 },
                          visible: { opacity: 1, y: 0, scale: 1 }
                        }}
                        transition={{ type: "spring", stiffness: 220, damping: 20 }}
                        className="w-full flex justify-center py-1"
                      >
                        <LineHoverLink
                          onClick={(e) => {
                            e.preventDefault();
                            handleTabChange(tab);
                          }}
                          variant={tab === "GitStats" ? "scribble" : "pulse"}
                          className={`${outfit.className} uppercase text-md transition-all cursor-pointer text-center ${isActive ? "text-white font-bold" : "text-zinc-500 hover:text-zinc-300"
                            } ${isMultiLine ? "flex flex-col items-center whitespace-normal gap-0.5" : ""}`}
                        >
                          {tab === "Issues & PRs" ? (
                            <>
                              <span>Issues</span>
                              <span className="text-[12px]">&</span>
                              <span>PRs</span>
                            </>
                          ) : tab === "Reviews & Comments" ? (
                            <>
                              <span>Reviews</span>
                              <span className="text-[12px]">&</span>
                              <span>Comments</span>
                            </>
                          ) : (
                            tab
                          )}
                        </LineHoverLink>
                      </motion.div>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Folder at the bottom */}
            <div className="flex flex-col items-center justify-center mt-auto pt-4 border-t border-zinc-900/40">
              <FolderPreview
                variant="ardra"
                size="md"
                label={isSidebarHovered ? "MENU" : "HOVER ME"}
                isHovered={isSidebarHovered}
                className="text-zinc-400"
              />
            </div>
          </nav>
        </aside>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-8 bg-black">
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
          {selectedTab === "Issues & PRs" && (
            <IssuesAndPRs session={session} username={username} />
          )}
          {selectedTab === "Reviews and Comments" && (
            <ReviewsAndComments session={session} username={username} />
          )}
          {selectedTab === "Organizations" && (
            <Organizations session={session} username={username} />
          )}
          {selectedTab === "GitWrapped" && (
            <GitWrapped session={session} username={username} />
          )}
        </main>
      </div>
    </main>
  );
}
