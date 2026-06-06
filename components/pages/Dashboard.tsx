type DashboardProps = {
    prs: any[];
    session: any;
    data: any;
    repos: any[];
}
export default function Dashboard({prs, session, data, repos}: DashboardProps) {

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const userReposOwned = repos.filter(repo => repo.owner.login == data.login).filter((repo) => { return new Date(repo.created_at) >= thirtyDaysAgo;})
    console.log(userReposOwned)

    const newPRs = prs.filter((pr) => {
        return new Date(pr.created_at) >= thirtyDaysAgo;
    });

    const stats = [
        {
            title: "Merged PRs",
            value: newPRs.filter((pr: any) => pr.pull_request?.merged_at).length,
        },
        {
            title: "Repositories",
            value: userReposOwned.length,
        },
    ];

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-semibold text-white">
                    Welcome, {session?.user?.name?.split(" ")[0]}
                </h1>

                <p className="text-zinc-500 mt-2">
                    Here's what's happening across your GitHub activity.
                </p>

                <h2>Activity stats of last 30 days </h2>
            </div>
            <div className="grid grid-cols-4 gap-4">
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
            <div className="rounded-lg border border-zinc-800 bg-zinc-950/30">
                <div className="border-b border-zinc-800 px-5 py-4">
                    <h2 className="text-sm font-medium text-white">
                        Recent Reviews
                    </h2>
                </div>

                <div className="p-5 space-y-4">
                    <p className="text-zinc-400">
                        No activity yet.
                    </p>
                </div>
            </div>
        </div>
    );
}