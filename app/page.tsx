"use client";

import { useState } from "react";
import { useSession, signIn, signOut } from "next-auth/react";

export default function Home() {
  const { data: session } = useSession();
  const [prs, setPrs] = useState<any[]>([]);
  const [username, setUsername] = useState<string | null>(null);

  async function fetchUser() {
    const res = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${session?.accessToken}`,
      },
    });

    const data = await res.json();
    console.log("User:", data);
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
      }
    );

    const data = await res.json();
    console.log("PRs:", data);
    setPrs(data.items || []);
  }

  if (!session) {
    return <button onClick={() => signIn("github")}>Login</button>;
  }

  return (
    <div>
      <p>Logged in as {session.user?.name}</p>

      <button onClick={fetchUser}>Get Username</button>
      <button onClick={fetchPRs}>Fetch PRs</button>
      <button onClick={() => signOut()}>Logout</button>

      <div>
        {prs.map((pr) => (
          <div key={pr.id}>
            <p>{pr.title}</p>
            <p>{pr.state}</p>
          </div>
        ))}
      </div>
    </div>
  );
}