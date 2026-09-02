# PRism

<div align="center">

<p align="center">
  <strong>An Open Sourcerer's Playground to Track, Review, and Merge Pull Requests</strong>
</p>

<p align="center">
  A premium, high-performance developer workspace engineered to visualize and monitor your GitHub ecosystem in real time.
</p>

<p align="center">
  <a href="https://prism-osdev.vercel.app/"><strong>Explore Live Demo »</strong></a>
</p>

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Three.js](https://img.shields.io/badge/Three.js-R3F-black?style=flat-square&logo=three.js)](https://threejs.org/)
[![Framer Motion](https://img.shields.io/badge/Framer_Motion-12-black?style=flat-square&logo=framer)](https://www.framer.com/motion/)
[![Deployed on Vercel](https://img.shields.io/badge/Deploy-Vercel-black?style=flat-square&logo=vercel)](https://prism-osdev.vercel.app/)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

</div>

---

## Overview

**PRism** is a modern GitHub intelligence suite that transforms raw git data into actionable insights, interactive analytics, and an intuitive management dashboard. Built with **Next.js 16**, **Tailwind CSS v4**, **React Three Fiber**, and **Framer Motion**, PRism provides a fluid and visually striking workspace for individual contributors, open-source maintainers, and engineering teams.

---

## Key Features

- **Interactive Dashboard**: Real-time tracking of contribution streaks, active repositories, recent commits, and incoming GitHub notifications.
- **Git Wrapped (GraphQL Powered)**: In-depth monthly metrics (commits, pull requests, issues, reviews), language distribution charts, and calculated **Developer Personas** (e.g., _Morning Bird_, _Night Owl_) derived from commit timestamps.
- **Issues & Pull Requests Hub**: Comprehensive, searchable views of authored, assigned, mentioned, and review-requested PRs and issues with real-time status badges (Open, Merged, Closed).
- **Organization Analytics**: Multi-organization contributor analysis tracking commit trends, PR velocity, and repository memberships across your teams.
- **Reviews & Comments Center**: Dedicated review inbox categorizing pending review requests, active comment threads, and completed code reviews.
- **State-of-the-Art Visuals**: Glassmorphism design system, smooth scrolling via **Lenis**, fluid 3D water mesh shaders with **React Three Fiber (Three.js)**, and custom retro-futuristic dither post-processing effects.

---

## Tech Stack

| Category | Technology | Description |
| :--- | :--- | :--- |
| **Framework** | [Next.js 16 (App Router)](https://nextjs.org/) | Server Components, hybrid rendering & API routing |
| **Language** | [TypeScript 5](https://www.typescriptlang.org/) | Strict static typing across entire application |
| **Authentication** | [NextAuth.js](https://next-auth.js.org/) | GitHub OAuth integration with secure session handling |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) | Modern utility-first CSS engine with PostCSS |
| **3D & Shaders** | [React Three Fiber](https://r3f.docs.pmnd.rs/) / [Three.js](https://threejs.org/) | Custom WebGL shaders and dynamic fluid mesh rendering |
| **Post-Processing**| [Postprocessing](https://pmndrs.github.io/postprocessing/) | Custom retro dither filter pipelines |
| **Animation** | [Framer Motion 12](https://www.framer.com/motion/) | Layout animations, micro-interactions, and page transitions |
| **Smooth Scroll** | [Lenis](https://lenis.darkroom.engineering/) | Inertial smooth scrolling engine |
| **Data Viz** | [Chart.js](https://www.chartjs.org/) & [React Chartjs 2](https://react-chartjs-2.js.org/) | Interactive contribution breakdown graphs and radar charts |
| **Icons** | [GitHub Primer Octicons](https://primer.style/foundations/icons/) | Native GitHub icon library |

---

## Project Architecture

```text
PRism/
├── app/                           # Next.js App Router root
│   ├── api/auth/[...nextauth]/    # GitHub OAuth authentication endpoints
│   ├── globals.css                # Tailwind CSS imports & theme variables
│   ├── layout.tsx                 # Root layout & typography setup
│   ├── page.tsx                   # Main dashboard view controller
│   └── providers.tsx              # NextAuth session context provider
├── components/
│   ├── pages/                     # Primary feature modules & views
│   │   ├── Dashboard.tsx          # Real-time metrics, streaks & feeds
│   │   ├── GitStats.tsx           # Wrapped GraphQL analytics & charts
│   │   ├── IssuesAndPRs.tsx       # Searchable PR & issue tracker
│   │   ├── Organizations.tsx      # Multi-org contribution analyzer
│   │   └── ReviewsAndComments.tsx # Code review queues & comment activity
│   └── ui/                        # Reusable interface & visual elements
│       ├── animated-counter.tsx   # Number rolling interpolation
│       ├── dashboard-loader.tsx   # Visual loading skeleton sequences
│       ├── dither.tsx             # Custom shader dither effect component
│       ├── folder-preview.tsx     # Dynamic drag-and-drop workspace UI
│       ├── line-hover-link.tsx    # Magnetic link hover animation
│       ├── liquid-ocean.tsx       # 3D fluid water mesh rendering (R3F)
│       └── spotlight-card.tsx     # Mouse-tracking radial highlight cards
├── lib/                           # Core utilities
│   └── utils.ts                   # Class name merger (clsx + tailwind-merge)
└── types/                         # TypeScript interface & type declarations
```

---

## Getting Started

### 1. Prerequisites

- [Node.js](https://nodejs.org/) (version **18.x** or higher recommended)
- [npm](https://www.npmjs.com/) or [pnpm](https://pnpm.io/)
- A [GitHub Account](https://github.com/)

---

### 2. GitHub OAuth App Setup

To authenticate with GitHub and fetch user data:

1. Navigate to **GitHub** → **Settings** → **Developer Settings** → **OAuth Apps** → **[New OAuth App](https://github.com/settings/applications/new)**.
2. Fill in the following details:
   - **Application name**: `PRism Local`
   - **Homepage URL**: `http://localhost:3000`
   - **Authorization callback URL**: `http://localhost:3000/api/auth/callback/github`
3. Click **Register Application**, then generate a **Client Secret**.
4. Copy both the **Client ID** and **Client Secret**.

---

### 3. Installation

Clone the repository and install dependencies:

```bash
# Clone the repository
git clone https://github.com/kartikktripathi/PRism.git

# Navigate to project directory
cd PRism

# Install dependencies
npm install
```

---

### 4. Configure Environment Variables

Create a `.env.local` file in the root directory:

```bash
cp .env.example .env.local
```

Populate the required environment variables:

```env
GITHUB_CLIENT_ID=your_github_oauth_client_id
GITHUB_CLIENT_SECRET=your_github_oauth_client_secret
NEXTAUTH_SECRET=generate_a_random_32_character_secret_key
NEXTAUTH_URL=http://localhost:3000
```

> [!TIP]
> You can generate a secure `NEXTAUTH_SECRET` by running:
> ```bash
> openssl rand -base64 32
> ```

---

### 5. Running the Application

Start the local development server:

```bash
npm run dev
```

Visit [`http://localhost:3000`](http://localhost:3000) in your browser to view PRism.

---

## Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Runs the Next.js development server with Webpack |
| `npm run build` | Builds the production bundle |
| `npm run start` | Starts the production server |
| `npm run lint` | Lints codebase using ESLint |

---

## Roadmap

- [ ] **Spotify-Style Git Wrapped Cards**: Downloadable, high-res visual summaries for sharing directly on social channels (X, LinkedIn, GitHub).
- [ ] **AI Pull Request Insights**: Automated standup updates and PR diff summaries powered by LLMs.
- [ ] **Team & Peer Benchmarking**: Anonymized team-level metrics for cycle time, review latency, and merge frequency.
- [ ] **Cross-Platform Support**: GitLab and Bitbucket integrations alongside GitHub.
- [ ] **Desktop Client**: Native desktop application with system tray notifications and local workspace hooks via Tauri.

---

## Contributing

Contributions are welcome! Please feel free to open an issue or submit a pull request:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

Distributed under the MIT License. See [LICENSE](LICENSE) for more information.
