# MehdiOS

A macOS-inspired portfolio desktop built with Next.js, React, TypeScript, and Tailwind CSS. It recreates a desktop-style experience with draggable windows, a magnifying dock, a lock screen, system menus, and portfolio apps for projects, notes, messages, and more.

![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38B2AC?style=for-the-badge&logo=tailwind-css)

## Features

### Desktop shell
- Lock screen with animated transition into the desktop
- Desktop icons with drag support and context menus
- macOS-style dock with magnification and liquid-glass styling
- Top bar with menus, weather, clock, and control center
- Theme-aware wallpaper support and settings

### Built-in apps
- Safari-style browser with tabs and search
- Calculator
- Terminal with command execution API
- Projects showcase
- Skills overview
- iNotes with local persistence
- Messages contact form
- Settings
- Contact profile
- Typing Master game
- Resume/PDF preview with native browser rendering
- Trash bin with restore flow

## Tech stack

- Framework: [Next.js 15](https://nextjs.org/) with the App Router
- UI: [React 19](https://react.dev/)
- Language: [TypeScript](https://www.typescriptlang.org/)
- Styling: [Tailwind CSS 4](https://tailwindcss.com/)
- State: [Redux Toolkit](https://redux-toolkit.js.org/) and [React Redux](https://react-redux.js.org/)
- Animation: [GSAP](https://gsap.com/)
- Theme management: [next-themes](https://github.com/pacocoursey/next-themes)
- Icons: [Tabler Icons](https://tabler.io/icons) and [React Icons](https://react-icons.github.io/react-icons/)
- Weather data: [Open-Meteo](https://open-meteo.com/)

## Quality and security

- Updated to React 19 and Next.js 15
- Migrated to Tailwind CSS 4 and the new PostCSS plugin
- Uses the ESLint CLI instead of deprecated `next lint`
- Replaced the previous PDF.js viewer dependency chain with native browser PDF rendering
- Current dependency audit is clean: `npm audit` reports `0` vulnerabilities

## Getting started

### Prerequisites

- Node.js 18.18+ or newer
- npm

### Install

```bash
git clone https://github.com/Mehdidjah/MehdiOS.git
cd MehdiOS
npm install
```

### Run in development

```bash
npm run dev
```

Open the local URL printed by Next.js, usually `http://localhost:3000`. If port `3000` is already in use, Next.js will automatically choose the next available port.

### Production build

```bash
npm run build
npm start
```

### Checks

```bash
npm run lint
npm run build
npm audit
```

## Project structure

```text
MehdiOS/
├── app/
│   ├── actions/               # Server actions
│   ├── components/            # UI and desktop apps
│   ├── features/              # Redux slices
│   ├── hooks/                 # Shared hooks
│   ├── providers/             # App providers
│   ├── store/                 # Redux store
│   ├── utils/                 # Utility helpers
│   ├── globals.css            # Tailwind v4 theme + app styles
│   ├── layout.tsx             # Root layout
│   └── page.tsx               # Desktop entry page
├── public/
│   └── assets/                # Wallpapers, icons, images, music, PDFs
├── next.config.mjs
├── postcss.config.mjs
├── package.json
└── tsconfig.json
```

## Customization

### Wallpapers

Add wallpapers under `public/assets/background/` and update the options in `app/components/settings/wallpaper.tsx`.

### Projects

Update the project data in `app/components/projects/projects.ts`.

### Icons

Dock and desktop icon assets live under `public/assets/icons/` and `public/assets/new icon style/`.

## Notes

- The weather widget gracefully falls back when geolocation is unavailable.
- PDF viewing now relies on the browser's native PDF support, which keeps the implementation simpler and reduces dependency risk.

## Author

**Mehdi**

- GitHub: [@Mehdidjah](https://github.com/Mehdidjah)
- Repository: [MehdiOS](https://github.com/Mehdidjah/MehdiOS)

If you like the project, a star on GitHub is always appreciated.
