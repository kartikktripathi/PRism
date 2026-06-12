import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler
);

type DashboardProps = {
    prs: any[];
    session: any;
    data: any;
    repos: any[];
    topRepos: any[];
    loadingTopRepos: boolean;
    contributionData: any[];
    loadingContribution: boolean;
    recentActivities: any[];
    loadingActivities: boolean;
}

function formatRelativeTime(dateString: string): string {
    if (dateString === 'recently' || dateString === 'recent') {
        return 'recently';
    }
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 1) {
        return 'just now';
    } else if (diffMins < 60) {
        return `${diffMins}m ago`;
    } else if (diffHours < 24) {
        return `${diffHours}h ago`;
    } else {
        return 'yesterday';
    }
}

const getActivityStyle = (type: string) => {
    switch (type) {
        case 'mention':
            return { icon: '💬', badge: 'border-amber-500/20 text-amber-400 bg-amber-500/5' };
        case 'review_request':
            return { icon: '👀', badge: 'border-sky-500/20 text-sky-400 bg-sky-500/5' };
        case 'pr_merged':
            return { icon: '🟣', badge: 'border-purple-500/20 text-purple-400 bg-purple-500/5' };
        case 'pr_opened':
            return { icon: '🟢', badge: 'border-emerald-500/20 text-emerald-400 bg-emerald-500/5' };
        case 'pr_reviewed':
            return { icon: '✅', badge: 'border-teal-500/20 text-teal-400 bg-teal-500/5' };
        case 'comment':
            return { icon: '💬', badge: 'border-zinc-700 text-zinc-400 bg-zinc-805/10' };
        case 'issue_assigned':
            return { icon: '📌', badge: 'border-rose-500/20 text-rose-400 bg-rose-500/5' };
        case 'follower':
            return { icon: '👤', badge: 'border-pink-500/20 text-pink-400 bg-pink-500/5' };
        case 'star':
            return { icon: '⭐', badge: 'border-yellow-500/20 text-yellow-400 bg-yellow-500/5' };
        case 'fork':
            return { icon: '🍴', badge: 'border-zinc-500/20 text-zinc-400 bg-zinc-500/5' };
        case 'repo_created':
            return { icon: '📦', badge: 'border-cyan-500/20 text-cyan-400 bg-cyan-500/5' };
        case 'milestone':
            return { icon: '🏆', badge: 'border-orange-500/20 text-orange-400 bg-orange-500/5' };
        case 'commit':
            return { icon: '💻', badge: 'border-zinc-700 text-zinc-400 bg-zinc-800/10' };
        default:
            return { icon: '🔔', badge: 'border-zinc-800 text-zinc-400 bg-zinc-900/5' };
    }
};

export default function Dashboard({prs, session, data, repos, topRepos, loadingTopRepos, contributionData, loadingContribution, recentActivities, loadingActivities}: DashboardProps) {

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const userReposOwned = repos.filter(repo => repo.owner.login == data.login).filter((repo) => { return new Date(repo.created_at) >= thirtyDaysAgo;})

    const newPRs = prs.filter((pr) => {
        return new Date(pr.created_at) >= thirtyDaysAgo;
    });
    console.log(newPRs)

    const stats = [
        {
            title: "Open PRs",
            value: newPRs.filter(pr => pr.state == "open").length,
        },
        {
            title: "Merged PRs",
            value: newPRs.filter((pr: any) => pr.pull_request?.merged_at).length,
        },
        {
            title: "Repositories",
            value: userReposOwned.length,
        },
    ];

    // Format labels and dataset for the line chart
    const chartLabels = (contributionData || []).map((day: any) => {
        const dateObj = new Date(day.date);
        return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
    });

    const chartCounts = (contributionData || []).map((day: any) => day.count);

    const chartData = {
        labels: chartLabels,
        datasets: [
            {
                label: 'Contributions',
                data: chartCounts,
                borderColor: '#10b981',
                backgroundColor: (context: any) => {
                    const ctx = context.chart.ctx;
                    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
                    gradient.addColorStop(0, 'rgba(16, 185, 129, 0.15)');
                    gradient.addColorStop(1, 'rgba(16, 185, 129, 0)');
                    return gradient;
                },
                fill: true,
                tension: 0.4,
                borderWidth: 2,
                pointBackgroundColor: '#10b981',
                pointBorderColor: 'transparent',
                pointHoverBackgroundColor: '#10b981',
                pointHoverBorderColor: '#ffffff',
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
                backgroundColor: '#09090b',
                titleColor: '#a1a1aa',
                bodyColor: '#f4f4f5',
                borderColor: '#27272a',
                borderWidth: 1,
                padding: 10,
                displayColors: false,
                callbacks: {
                    title: (tooltipItems: any) => {
                        return tooltipItems[0].label;
                    },
                    label: (tooltipItem: any) => {
                        const count = tooltipItem.raw;
                        return `${count > 0 ? `You made ${count}` : `You made no`} ${count === 1 || count === 0 ? 'contribution' : 'contributions'}`;
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
                    color: '#71717a',
                    font: {
                        family: 'monospace',
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
                    color: 'rgba(39, 39, 42, 0.3)',
                },
                ticks: {
                    color: '#71717a',
                    font: {
                        family: 'monospace',
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
                <h1 className="text-3xl font-semibold text-white">
                    Welcome, {session?.user?.name?.split(" ")[0]}
                </h1>

                <p className="text-zinc-500 mt-2">
                    Here's what's happening across your GitHub activity.
                </p>

                <h2 className="text-zinc-400 mt-4 text-sm font-semibold tracking-wide font-mono uppercase">Activity stats of last 30 days</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {stats.map((stat) => (
                    <div
                    key={stat.title}
                    className="rounded-lg border border-zinc-800 bg-zinc-950/30 p-4"
                    >
                    <p className="text-xs text-zinc-500">
                        {stat.title}
                    </p>

                    <p className="text-2xl font-semibold text-white mt-2">
                        {stat.value}
                    </p>
                    </div>
                ))}
            </div>

            {/* Commit Graph Section */}
            <div className="border-t border-zinc-800/60 pt-8">
                <h3 className="text-base text-zinc-300 font-semibold tracking-wide font-mono uppercase">
                    Commit & Contribution Activity <span className="text-zinc-500 text-xs font-normal font-sans capitalize">(Past 30 Days)</span>
                </h3>
                <p className="text-xs text-zinc-500 mt-1 mb-6">
                    A daily breakdown of your commits, pull requests, issues, and reviews.
                </p>

                {loadingContribution ? (
                    <div className="animate-pulse rounded-lg border border-zinc-800 bg-zinc-950/20 p-6 h-[300px] flex items-center justify-center">
                        <span className="text-xs text-zinc-500 font-mono animate-pulse">Fetching contribution history...</span>
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
                    Top Repositories <span className="text-zinc-500 text-xs font-normal font-sans capitalize">(Past Week)</span>
                </h3>
                <p className="text-xs text-zinc-500 mt-1 mb-6">
                    Based on your commit activity over the last 7 days.
                </p>

                {loadingTopRepos ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[1, 2, 3].map((n) => (
                            <div key={n} className="animate-pulse rounded-lg border border-zinc-800 bg-zinc-950/20 p-5 h-28 flex flex-col justify-between">
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
                                            <span className="text-[10px] font-mono text-zinc-600 group-hover:text-zinc-500 transition-colors duration-150">0{idx + 1}</span>
                                            <span className="text-xs font-semibold text-zinc-300 group-hover:text-emerald-400 transition-colors duration-150 truncate font-mono">
                                                {repo.name}
                                            </span>
                                        </div>
                                        <span className="text-[10px] font-bold text-zinc-300 bg-zinc-900/60 border border-zinc-850 px-2 py-0.5 rounded-full font-mono">
                                            {repo.count} {repo.count === 1 ? 'commit' : 'commits'}
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

            {/* Recent Activity Section */}
            <div className="border-t border-zinc-850 pt-8">
                <h3 className="text-base text-zinc-300 font-semibold tracking-wide font-mono uppercase">
                    Recent Activity <span className="text-zinc-500 text-xs font-normal font-sans capitalize">(Past 24 Hours)</span>
                </h3>
                <p className="text-xs text-zinc-500 mt-1 mb-6">
                    A comprehensive stream of your GitHub actions and events.
                </p>

                {loadingActivities ? (
                    <div className="space-y-3">
                        {[1, 2, 3].map((n) => (
                            <div key={n} className="animate-pulse rounded-lg border border-zinc-800 bg-zinc-950/20 p-4 h-14 flex items-center justify-between">
                                <div className="h-4 bg-zinc-800 rounded w-2/3" />
                                <div className="h-4 bg-zinc-800 rounded w-16" />
                            </div>
                        ))}
                    </div>
                ) : (recentActivities || []).length === 0 ? (
                    <div className="rounded-lg border border-zinc-800 border-dashed bg-zinc-950/10 p-8 text-center">
                        <p className="text-xs text-zinc-500 font-mono">
                            No recent activity found in the last 24 hours.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                        {(recentActivities || []).map((activity) => {
                            const { icon, badge } = getActivityStyle(activity.type);
                            return (
                                <a
                                    key={activity.id}
                                    href={activity.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950/30 p-4 hover:bg-zinc-900/30 hover:border-zinc-700 transition-all duration-150"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <span className="text-base flex-shrink-0">{icon}</span>
                                        <div className="flex items-center gap-2 min-w-0">
                                            <span className={`text-[10px] uppercase tracking-wider font-mono font-bold px-1.5 py-0.5 rounded border ${badge} flex-shrink-0`}>
                                                {activity.title}
                                            </span>
                                            <p className="text-xs text-zinc-400 group-hover:text-zinc-300 transition-colors duration-150 truncate font-mono">
                                                {activity.description}
                                            </p>
                                        </div>
                                    </div>
                                    <span className="text-[10px] text-zinc-500 font-mono flex-shrink-0 ml-4">
                                        {formatRelativeTime(activity.date)}
                                    </span>
                                </a>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}