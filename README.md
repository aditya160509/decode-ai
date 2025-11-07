# DecodeAI × EduPrompt

Master AI, GitHub, and Prompt Engineering through hands-on learning. Built by students, for students.

## About

DecodeAI is an interactive learning platform designed to demystify AI technologies, GitHub workflows, and prompt engineering. Whether you're a developer, student, or AI enthusiast, this platform provides practical resources and tools to accelerate your learning journey in the AI space.

## Key Features

- **Interactive AI Learning Modules** - Comprehensive guides covering LLMs, machine learning concepts, and AI fundamentals
- **Prompt Engineering Tools** - Hands-on EduPrompt experience with real-world examples and best practices
- **GitHub Workflow Guides** - Step-by-step tutorials for version control, collaboration, and Git best practices
- **No-Code Platform Comparisons** - Explore and compare popular no-code AI tools
- **Resource Library** - Curated collection of AI learning materials, tutorials, and documentation
- **Premium UI/UX** - Modern interface with smooth animations powered by Framer Motion

## Tech Stack

- **Frontend Framework:** React 18 + TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui + Radix UI
- **Routing:** React Router v6
- **Animations:** Framer Motion
- **State Management:** Zustand
- **Forms:** React Hook Form + Zod validation
- **Data Fetching:** TanStack Query

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm or bun package manager

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd eduprompt-hub-main
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Build for Production

```bash
npm run build
```

Preview the production build:
```bash
npm run preview
```

## Project Structure

```
src/
├── app/              # Application configuration
├── components/       # Reusable UI components
├── contexts/         # React context providers
├── data/            # Static data and content
├── features/        # Feature-specific modules
│   └── resources/   # Resource library components
├── hooks/           # Custom React hooks
├── lib/             # Utility functions
├── pages/           # Page components
│   ├── Home.tsx
│   ├── AI.tsx
│   ├── GitHub.tsx
│   ├── EduPrompt.tsx
│   ├── NoCode.tsx
│   └── Resources.tsx
└── types/           # TypeScript type definitions
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run build:dev` - Build in development mode
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Contributing

Contributions are welcome! If you'd like to improve DecodeAI:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is open source and available for educational purposes.

## Author

**Aditya Balaji**

---

Built with React, TypeScript, and Vite
