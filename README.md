# MehdiOS

A macOS-inspired portfolio website built with Next.js, React, and TypeScript. Experience a fully interactive desktop environment that showcases my projects, skills, and experience in a unique and engaging way.

![MehdiOS](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css)

## ✨ Features

### 🖥️ Desktop Environment
- **Lock Screen** - Secure lock screen with password authentication
- **Desktop** - Interactive desktop with customizable wallpapers
- **Dock/Taskbar** - macOS-style dock with app magnification effect
- **Topbar Menu** - System menu bar with clock, weather, and control center
- **Theme Support** - Dark and light mode with smooth transitions

### 📱 Applications

#### Safari Browser
- Full-featured browser with URL navigation
- Search functionality with Google
- Tab management
- Homepage with search interface

#### Calculator
- Full calculator application
- Beautiful macOS-style UI

#### Terminal
- Interactive terminal with command execution
- Support for various terminal commands
- Code execution capabilities

#### Projects
- Showcase of portfolio projects
- Project details with live links and GitHub repositories
- Beautiful project cards

#### Skills
- Frontend technologies showcase
- Backend technologies showcase
- Programming languages
- Tools and frameworks

#### iNotes
- Note-taking application
- Create, edit, and delete notes
- Local storage persistence

#### Messages
- Contact form
- Email integration

#### Settings
- Wallpaper customization
- Theme selection (Dark/Light/System)
- Desktop view preferences

#### Contact
- Contact information
- Social media links
- About me section

#### Typing Master
- Typing speed test game
- Multiple difficulty levels
- Real-time statistics

#### Resume Viewer
- PDF resume viewer
- Integrated PDF reader

#### Trash Bin
- File management
- Delete and restore functionality

## 🛠️ Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **UI Library**: [React 18](https://react.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **State Management**: [Redux Toolkit](https://redux-toolkit.js.org/)
- **Animations**: [GSAP](https://gsap.com/)
- **Icons**: [Tabler Icons](https://tabler.io/icons), [React Icons](https://react-icons.github.io/react-icons/)
- **Theming**: [next-themes](https://github.com/pacocoursey/next-themes)
- **PDF Viewer**: [@react-pdf-viewer](https://react-pdf-viewer.dev/)

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn or pnpm

### Installation

1. Clone the repository
```bash
git clone https://github.com/Mehdidjah/MehdiOS.git
cd MehdiOS
```

2. Install dependencies
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Run the development server
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Build for Production

```bash
npm run build
npm start
```

## 📁 Project Structure

```
MehdiOS/
├── app/
│   ├── components/          # React components
│   │   ├── calculator/      # Calculator app
│   │   ├── contact/         # Contact page
│   │   ├── folder/          # Desktop folders
│   │   ├── inotes/          # Notes app
│   │   ├── messages/        # Messages app
│   │   ├── projects/        # Projects showcase
│   │   ├── settings/        # Settings app
│   │   ├── skill/           # Skills showcase
│   │   ├── taskbar/         # Dock/Taskbar
│   │   ├── terminal/        # Terminal app
│   │   ├── topbar/          # Menu bar
│   │   ├── trash-bin/       # Trash bin
│   │   ├── typing-master/   # Typing game
│   │   └── window-frame/    # Window components
│   ├── features/            # Redux slices
│   ├── hooks/               # Custom React hooks
│   ├── store/               # Redux store
│   ├── utils/               # Utility functions
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Home page
├── public/                  # Static assets
│   ├── assets/
│   │   ├── background/      # Wallpapers
│   │   ├── icons/           # App icons
│   │   └── images/          # Images
│   └── assets/pdf/          # PDF files
└── tailwind.config.ts       # Tailwind configuration
```

## 🎨 Customization

### Changing Wallpapers

Add your wallpapers to `public/assets/background/` and update `app/components/settings/wallpaper.tsx`

### Adding Projects

Edit `app/components/projects/projects.ts` to add or modify projects

### Modifying Skills

Update the skill data in `app/components/skill/` components

## 🌐 Live Demo

Visit the live website: [Coming Soon]

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 👨‍💻 Author

**Mehdi**

- GitHub: [@Mehdidjah](https://github.com/Mehdidjah)
- Portfolio: [MehdiOS](https://github.com/Mehdidjah/MehdiOS)

## 🙏 Acknowledgments

- Inspired by macOS design language
- Built with love using Next.js and React
- Icons from [Tabler Icons](https://tabler.io/icons) and [React Icons](https://react-icons.github.io/react-icons/)

---

⭐ If you like this project, please give it a star on GitHub!
