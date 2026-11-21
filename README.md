# 🌍 World Flags Challenge

A responsive geography quiz to explore the world, one flag at a time.

## Features

- **Five game modes:** name the flag, find the flag, capital cities, continents and survival run.
- **250+ countries and territories** from the `world-countries` dataset (Antarctica excluded).
- **English and French** interface and country names.
- **Three difficulty settings** and configurable round lengths (5, 10, 15 or 20 questions).
- **Hints, streaks, score and personal statistics.**
- **Progress saved locally** in your browser with localStorage.
- Responsive layout for desktop, tablet and mobile.
- GitHub Pages deployment workflow included.

## Run locally

Requirements: Node.js 20 or newer.

```bash
git clone https://github.com/nourghiloufi/world-flags-challenge.git
cd world-flags-challenge
npm install
npm run dev
```

Open the local URL printed by Vite.

## Production build

```bash
npm run build
npm run preview
```

## Publish with GitHub Pages

The workflow in `.github/workflows/deploy.yml` builds and deploys the app whenever code is pushed to `main`.

In the repository, open **Settings → Pages** and set the build and deployment source to **GitHub Actions**. The first deployment will then run automatically.

## Tech stack

React · TypeScript · Vite · Lucide · world-countries · FlagCDN

Country flags are loaded from [FlagCDN](https://flagcdn.com/), so an internet connection is required to display them.
