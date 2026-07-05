import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
);

import { Cormorant_Garamond, League_Spartan } from "next/font/google";

const cormorantGaramond = Cormorant_Garamond({
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  subsets: ["latin"],
});

const leagueSpartan = League_Spartan({
  subsets: ["latin"],
});

type DashboardProps = {
  prs: any[];
  session: any;
  data: any;
  repos: any[];
  topRepos: any[];
  loadingTopRepos: boolean;
  contributionData: any[];
  loadingContribution: boolean;
  notifications?: any[];
};

export default function Dashboard({
  prs,
  session,
  data,
  repos,
  topRepos,
  loadingTopRepos,
  contributionData,
  loadingContribution,
  notifications = [],
}: DashboardProps) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const userReposOwned = repos
    .filter((repo) => repo.owner.login == data.login)
    .filter((repo) => {
      return new Date(repo.created_at) >= thirtyDaysAgo;
    });

  const newPRs = prs.filter((pr) => {
    return new Date(pr.created_at) >= thirtyDaysAgo;
  });

  const stats = [
    {
      title: "Open Pull Requests",
      value: newPRs.filter((pr) => pr.state == "open").length,
      numColor: "#ff6a6aff"
    },
    {
      title: "Merged Pull Requests",
      value: newPRs.filter((pr: any) => pr.pull_request?.merged_at).length,
      numColor: "#9447cbff"
    },
    {
      title: "Repositories Contributed To",
      value: userReposOwned.length,
      numColor: "#84bce4ff"
    },
  ];

  // Format labels and dataset for the line chart
  const chartLabels = (contributionData || []).map((day: any) => {
    const dateObj = new Date(day.date);
    return dateObj.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    });
  });

  const chartCounts = (contributionData || []).map((day: any) => day.count);

  const chartData = {
    labels: chartLabels,
    datasets: [
      {
        label: "Contributions",
        data: chartCounts,
        borderColor: "#10b981",
        backgroundColor: (context: any) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 300);
          gradient.addColorStop(0, "rgba(16, 185, 129, 0.15)");
          gradient.addColorStop(1, "rgba(16, 185, 129, 0)");
          return gradient;
        },
        fill: true,
        tension: 0.4,
        borderWidth: 2,
        pointBackgroundColor: "#10b981",
        pointBorderColor: "transparent",
        pointHoverBackgroundColor: "#10b981",
        pointHoverBorderColor: "#ffffff",
        pointRadius: 2,
        pointHoverRadius: 6,
        pointHitRadius: 10,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: "#09090b",
        titleColor: "#a1a1aa",
        bodyColor: "#f4f4f5",
        borderColor: "#27272a",
        borderWidth: 1,
        padding: 10,
        displayColors: false,
        callbacks: {
          title: (tooltipItems: any) => {
            return tooltipItems[0].label;
          },
          label: (tooltipItem: any) => {
            const count = tooltipItem.raw;
            return `${count > 0 ? `You made ${count}` : `You made no`} ${count === 1 || count === 0 ? "contribution" : "contributions"}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: "#71717a",
          font: {
            family: "monospace",
            size: 9,
          },
          maxTicksLimit: 10,
        },
        border: {
          display: false,
        },
      },
      y: {
        grid: {
          color: "rgba(39, 39, 42, 0.3)",
        },
        ticks: {
          color: "#71717a",
          font: {
            family: "monospace",
            size: 9,
          },
          precision: 0,
        },
        border: {
          display: false,
        },
      },
    },
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className={`text-6xl text-white font-300 ${cormorantGaramond.className}`}>
          Welcome, {session?.user?.name?.split(" ")[0]}.
        </h1>

        <p className={`mt-2 text-lg text-zinc-400 font-light tracking-wide ${leagueSpartan.className}`}>
          Here's what's happening across your GitHub in the past 30 days.
        </p>

      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.title}
            className="rounded-lg bg-zinc-950/30 p-4"
          >
            <p 
              className="text-6xl font-semibold mt-2"
              style={{ color: stat.numColor }}
            >
              {stat.value}
              <span className="text-xs text-zinc-500 ml-2 font-normal font-sans tracking-wide">{stat.title}</span>
            </p>
          </div>
        ))}
      </div>

      {/* Commit Graph Section */}
      <div className="border-t border-zinc-800/60 pt-8">
        <h3 className="text-base text-zinc-300 font-semibold tracking-wide font-mono uppercase">
          Commit & Contribution Activity{" "}
          <span className="text-zinc-500 text-xs font-normal font-sans capitalize">
            (Past 30 Days)
          </span>
        </h3>
        <p className="text-xs text-zinc-500 mt-1 mb-6">
          A daily breakdown of your commits, pull requests, issues, and reviews.
        </p>

        {loadingContribution ? (
          <div className="animate-pulse rounded-lg border border-zinc-800 bg-zinc-950/20 p-6 h-[300px] flex items-center justify-center">
            <span className="text-xs text-zinc-500 font-mono animate-pulse">
              Fetching contribution history...
            </span>
          </div>
        ) : (contributionData || []).length === 0 ? (
          <div className="rounded-lg border border-zinc-800 border-dashed bg-zinc-950/10 p-8 text-center">
            <p className="text-xs text-zinc-500 font-mono">
              No contributions recorded on GitHub in the past 30 days.
            </p>
          </div>
        ) : (
          <div className="rounded-lg border border-zinc-800 bg-zinc-950/30 p-6 h-[300px]">
            <Line data={chartData} options={chartOptions} />
          </div>
        )}
      </div>

      {/* Top Repositories Section */}
      <div className="border-t border-zinc-850 pt-8">
        <h3 className="text-base text-zinc-300 font-semibold tracking-wide font-mono uppercase">
          Top Repositories{" "}
          <span className="text-zinc-500 text-xs font-normal font-sans capitalize">
            (Past Week)
          </span>
        </h3>
        <p className="text-xs text-zinc-500 mt-1 mb-6">
          Based on your commit activity over the last 7 days.
        </p>

        {loadingTopRepos ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="animate-pulse rounded-lg border border-zinc-800 bg-zinc-950/20 p-5 h-28 flex flex-col justify-between"
              >
                <div className="flex justify-between items-start">
                  <div className="h-4 bg-zinc-800 rounded w-1/2" />
                  <div className="h-5 bg-zinc-800 rounded w-1/4" />
                </div>
                <div className="h-3 bg-zinc-800 rounded w-1/3" />
                <div className="h-1 bg-zinc-800 rounded w-full" />
              </div>
            ))}
          </div>
        ) : topRepos.length === 0 ? (
          <div className="rounded-lg border border-zinc-800 border-dashed bg-zinc-950/10 p-8 text-center">
            <p className="text-xs text-zinc-500 font-mono">
              No commits recorded on GitHub in the past 7 days.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {topRepos.map((repo, idx) => {
              const maxCommits = topRepos[0]?.count || 1;
              const percentage = Math.round((repo.count / maxCommits) * 100);
              return (
                <a
                  key={repo.fullName}
                  href={repo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative block rounded-lg border border-zinc-800 bg-zinc-950/30 p-5 hover:bg-zinc-900/30 hover:border-zinc-700 transition-all duration-150"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-[10px] font-mono text-zinc-600 group-hover:text-zinc-500 transition-colors duration-150">
                        0{idx + 1}
                      </span>
                      <span className="text-xs font-semibold text-zinc-300 group-hover:text-emerald-400 transition-colors duration-150 truncate font-mono">
                        {repo.name}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-zinc-300 bg-zinc-900/60 border border-zinc-850 px-2 py-0.5 rounded-full font-mono">
                      {repo.count} {repo.count === 1 ? "commit" : "commits"}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-500 truncate mb-4 font-mono">
                    {repo.fullName}
                  </p>
                  <div className="w-full bg-zinc-900/60 rounded-full h-1 overflow-hidden">
                    <div
                      className="bg-emerald-500/80 h-full rounded-full transition-all duration-500 ease-out group-hover:bg-emerald-400"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </div>

      {/* Notifications Section */}
      <div className="border-t border-zinc-850 pt-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-base text-zinc-300 font-semibold tracking-wide font-mono uppercase flex items-center gap-2">
              Notifications
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </h3>
            <p className="text-xs text-zinc-500 mt-1">
              System alerts, repository updates, and event notifications.
            </p>
          </div>
        </div>

        {notifications.length === 0 ? (
          <div className="rounded-lg border border-zinc-800 border-dashed bg-zinc-950/10 p-8 text-center">
            <p className="text-xs text-zinc-500 font-mono">
              No recent notifications.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notif: any) => (
              <div
                key={notif.id}
                className="flex items-start justify-between p-4 rounded-lg border border-zinc-850 bg-zinc-950/20 hover:bg-zinc-900/10 transition-colors duration-150 text-xs font-mono"
              >
                <div className="flex items-center gap-3">
                  {notif.actor?.avatarUrl && (
                    <img
                      src={notif.actor.avatarUrl}
                      className="w-6 h-6 rounded-full border border-zinc-800 bg-zinc-900 object-cover"
                      alt={notif.actor.login}
                    />
                  )}
                  <div className="space-y-0.5">
                    <div className="text-zinc-300">
                      <span className="font-semibold text-zinc-200">
                        {notif.actor?.login || "Someone"}
                      </span>{" "}
                      <span className="text-zinc-500">
                        {notif.type === "star" || notif.type === "fork"
                          ? notif.title
                          : notif.actionText || notif.type}
                      </span>{" "}
                      {notif.type !== "star" && notif.type !== "fork" ? (
                        <a
                          href={notif.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-emerald-500 hover:underline hover:text-emerald-400 transition-colors font-medium"
                        >
                          {notif.title}
                        </a>
                      ) : (
                        <a
                          href={notif.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-emerald-500 hover:underline hover:text-emerald-400 transition-colors font-medium"
                        >
                          {notif.repo}
                        </a>
                      )}
                    </div>
                    {notif.type !== "star" && notif.type !== "fork" && (
                      <span className="text-[10px] text-zinc-600 block">
                        in {notif.repo}
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-[10px] text-zinc-600 whitespace-nowrap ml-4">
                  {new Date(notif.createdAt).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
