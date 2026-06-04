import { useSession } from "next-auth/react";

export default function Dashboard() {
    const { data: session } = useSession();
    const stats = [
        {
            title: "Open PRs",
            value: 12,
        },
        {
            title: "Merged PRs",
            value: 38,
        },
        {
            title: "Reviews",
            value: 21,
        },
        {
            title: "Repositories",
            value: 7,
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