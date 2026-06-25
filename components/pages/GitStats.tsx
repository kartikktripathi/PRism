import React from "react";

interface MonthlyStat {
  month: string;
  commits: number;
  repositories: number;
  pullRequests: number;
  issues: number;
  reviews: number;
}

const mockStats: MonthlyStat[] = [
  {
    month: "June 2026",
    commits: 142,
    repositories: 8,
    pullRequests: 15,
    issues: 4,
    reviews: 24,
  },
  {
    month: "May 2026",
    commits: 118,
    repositories: 6,
    pullRequests: 12,
    issues: 5,
    reviews: 18,
  },
  {
    month: "April 2026",
    commits: 165,
    repositories: 9,
    pullRequests: 19,
    issues: 8,
    reviews: 32,
  },
  {
    month: "March 2026",
    commits: 94,
    repositories: 5,
    pullRequests: 8,
    issues: 3,
    reviews: 14,
  },
  {
    month: "February 2026",
    commits: 130,
    repositories: 7,
    pullRequests: 14,
    issues: 6,
    reviews: 21,
  },
  {
    month: "January 2026",
    commits: 152,
    repositories: 8,
    pullRequests: 17,
    issues: 5,
    reviews: 27,
  },
  {
    month: "December 2025",
    commits: 88,
    repositories: 4,
    pullRequests: 7,
    issues: 2,
    reviews: 11,
  },
  {
    month: "November 2025",
    commits: 125,
    repositories: 6,
    pullRequests: 11,
    issues: 4,
    reviews: 19,
  },
  {
    month: "October 2025",
    commits: 147,
    repositories: 8,
    pullRequests: 16,
    issues: 7,
    reviews: 25,
  },
  {
    month: "September 2025",
    commits: 104,
    repositories: 5,
    pullRequests: 9,
    issues: 3,
    reviews: 15,
  },
  {
    month: "August 2025",
    commits: 112,
    repositories: 6,
    pullRequests: 10,
    issues: 5,
    reviews: 16,
  },
  {
    month: "July 2025",
    commits: 135,
    repositories: 7,
    pullRequests: 13,
    issues: 6,
    reviews: 22,
  },
];

function MonthlyStatCard({ stat }: { stat: MonthlyStat }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950/30 p-5 flex flex-col font-sans">
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
    </div>
  );
}

export default function GitWrapped() {
  return (
    <div className="space-y-8 select-none">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-semibold text-white tracking-wide">Git Stats</h1>
        <p className="text-xs text-zinc-500 mt-2 font-mono">
          Monthly breakdown of your GitHub contributions and activity.
        </p>
      </div>

      {/* Grid containing the Monthly Card components */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockStats.map((stat) => (
          <MonthlyStatCard key={stat.month} stat={stat} />
        ))}
      </div>
    </div>
  );
}
