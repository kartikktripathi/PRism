# PRism

An Open Sourcerer's Playground to track, review, and merge pull requests. Built for developers who want a premium, fast, and visually spectacular workspace to monitor their GitHub ecosystem.

**Deployed Application**: [prism-osdev.vercel.app](https://prism-osdev.vercel.app/)

---

## Features

PRism offers a unified, high-performance developer workspace:

- **Interactive Dashboard**: Keep track of your real-time contribution streak, active repositories, recent commits, and GitHub notifications in one place.
- **Git Wrapped (GraphQL-powered)**: Retrieve detailed monthly breakdown metrics (commits, PRs, issues, code reviews), language distribution, and a calculated **coding personality/persona** based on the time of your commits (e.g. _Morning Bird_, _Night Owl_).
- **Issues & PRs**: Detailed logs of your authored, assigned, mentioned, and review-requested pull requests and issues, with interactive search/filters and status indicators (Merged, Open, Closed).
- **Organization Analytics**: Fetch and analyse your contributions across all the organisations you belong to, tracking commit trends, PRs, and repository membership.
- **Reviews & Comments**: Real-time review inbox tracking pending review requests, PRs you've commented on, and reviews you've completed.
- **Premium Dark Mode Aesthetics**: Smooth animations powered by **Framer Motion**, smooth scrolling with **Lenis**, and 3D visual effects with **React Three Fiber (Three.js)** and custom dither post-processing shaders.

---

## Tech Stack

| Category          | Technology Used                                                                           |
| :---------------- | :---------------------------------------------------------------------------------------- |
| **Framework**     | [Next.js 16 (App Router)](https://nextjs.org/)                                            |
| **Language**      | [TypeScript](https://www.typescriptlang.org/)                                             |
| **Auth**          | [NextAuth.js](https://next-auth.js.org/) (GitHub OAuth)                                   |
| **Styling**       | [TailwindCSS 4](https://tailwindcss.com/) & [PostCSS](https://postcss.org/)               |
| **3D Graphics**   | [React Three Fiber](https://r3f.docs.pmnd.rs/) & [Three.js](https://threejs.org/)         |
| **Animation**     | [Framer Motion](https://www.framer.com/motion/)                                           |
| **Smooth Scroll** | [Lenis](https://lenis.darkroom.engineering/)                                              |
| **Charts**        | [Chart.js](https://www.chartjs.org/) & [React Chartjs 2](https://react-chartjs-2.js.org/) |
| **Icons**         | [GitHub Primer Octicons](https://primer.style/foundations/icons/)                         |

---

## Repository Structure

```text
PRism/
├── app/                      # Next.js App Router root
│   ├── api/auth/             # NextAuth authentication endpoints
│   ├── globals.css           # Global CSS variables & Tailwind imports
│   ├── layout.tsx            # Global HTML wrapper and Font loading
│   ├── page.tsx              # Main entry point & client dashboard coordinator
│   └── providers.tsx         # NextAuth Session Provider context wrapper
├── components/
│   ├── pages/                # Distinct tabs/views of the dashboard
│   │   ├── Dashboard.tsx          # At-a-glance metrics, streaks, notifications
│   │   ├── GitStats.tsx           # Wrapped-style GraphQL stats & charts
│   │   ├── IssuesAndPRs.tsx       # Searchable logs of user PRs and issues
│   │   ├── Organizations.tsx      # Multi-org contribution analyzer
│   │   └── ReviewsAndComments.tsx # PR code review queues and comment history
│   └── ui/                   # High-performance design and visual components
│       ├── animated-counter.tsx   # Smooth numeric increment animations
│       ├── dashboard-loader.tsx   # Premium loading sequence screens
│       ├── dither.tsx             # Retro-futuristic shader effects
│       ├── folder-preview.tsx     # Dynamic drag-and-drop workspace folder ui
│       ├── line-hover-link.tsx    # Magnetic link hover effect
│       ├── liquid-ocean.tsx       # 3D fluid water mesh rendering (R3F)
│       └── spotlight-card.tsx     # CSS-radial mouse tracking highlight cards
├── lib/                      # Helper methods and utilities
│   └── utils.ts              # Tailwind merger and style joining utils
└── types/                    # Global TypeScript declaration files
```

---

## Getting Started

Follow these steps to run PRism locally:

### 1. Prerequisites

Ensure you have [Node.js](https://nodejs.org/) installed (v18.x or later recommended).

### 2. Set Up a GitHub OAuth App

To authenticate users, you need a GitHub OAuth App:

1. Go to your GitHub Profile -> **Settings** -> **Developer Settings** -> **OAuth Apps** -> **New OAuth App**.
2. Set the Homepage URL to `http://localhost:3000`.
3. Set the User Authorisation Callback URL to `http://localhost:3000/api/auth/callback/github`.
4. Register the application, and copy your **Client ID** and **Client Secret**.

### 3. Setup Project

Clone the repository and install the dependencies:

```bash
# Clone the repository
git clone https://github.com/your-username/PRism.git
cd PRism

# Install dependencies
npm install
```

### 4. Configure Environment Variables

Create a `.env.local` file in the root directory and add the following keys:

```env
GITHUB_CLIENT_ID=your_github_client_id_here
GITHUB_CLIENT_SECRET=your_github_client_secret_here
NEXTAUTH_SECRET=any_random_secure_32_character_string
NEXTAUTH_URL=http://localhost:3000
```

### 5. Run Local Server

Launch the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Future Scope

We aim to expand PRism into a fully-fledged productivity ecosystem:

- **Spotify-Style share cards**: Generate downloadable, beautiful infographic summaries of your "Git Wrapped" year/month to share directly on Twitter/X, LinkedIn, or GitHub READMEs.
- **AI-Powered Pull Request Summarizer**: Leverage LLM integrations (such as Google Gemini) to generate automatic daily standup updates and high-level PR summaries directly from diff data.
- **Peer Benchmarking**: Securely compare and benchmark cycle times, review response speeds, and commit frequencies against team members or open-source projects.
- **Desktop App**: Wrap the application with Tauri/Electron to support local file access, system-tray review reminders, and push notifications.
- **Multi-Platform Support**: Extend the data parsers to pull statistics and active tasks from GitLab and Bitbucket alongside GitHub.
