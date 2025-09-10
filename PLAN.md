Next.js Full-Stack Architecture Design
1. Vision & Core Principles
The goal is to refactor the AI Debate Arena from a single-page application into a robust, high-performance, full-stack application using the Next.js framework. This architecture prioritizes:
Logical Separation: While the frontend and backend code will live in the same project for development and deployment simplicity, they will be logically and functionally separate. The frontend (React components) will be the user interface, and the backend (API Route Handlers) will be the secure business logic layer.
Performance: Leverage Next.js's capabilities like Server-Side Rendering (SSR), Server Components, and intelligent caching to ensure fast initial page loads and a responsive user experience.
Scalability: The backend will be a set of serverless functions, deployed on Vercel's edge network. This provides automatic scaling to handle traffic spikes without manual configuration.
Security: All communication with external services (Gradio AI models, TTS services) will be handled exclusively by our backend API routes. Client-side code will never directly contact these external services, protecting credentials and centralizing logic.
Developer Experience & Deployability: A unified Next.js codebase simplifies development, and native integration with Vercel allows for seamless, one-click deployments.
2. Technology Stack
Framework: Next.js (using the App Router)
Language: TypeScript
UI Library: React
Styling: Tailwind CSS
Deployment: Vercel
3. Project Structure
The project will be reorganized into the standard Next.js App Router structure.
code
Code
/
├── app/
│   ├── layout.tsx                # Root Layout (replaces index.html body)
│   ├── page.tsx                  # Main Page Component (Server Component, replaces App.tsx)
│   │
│   ├── components/               # All UI Components (Client Components)
│   │   ├── ChatBox.tsx
│   │   ├── ChatInput.tsx
│   │   ├── NewsPanel.tsx
│   │   └── SettingsPanel.tsx
│   │
│   ├── hooks/                    # Custom hooks for complex state logic
│   │   └── useDebateManager.ts   # Hook to manage the debate state and pipeline
│   │
│   └── api/                      # The Backend (Serverless Functions)
│       ├── debate/
│       │   └── [speaker]/route.ts # API to get a response from a specific debater
│       ├── tts/
│       │   └── route.ts          # API for Text-to-Speech generation
│       └── news/
│           └── route.ts          # API to fetch and cache the BBC news feed
│
├── lib/
│   └── types.ts                  # Shared type definitions
│
├── public/                       # Static assets (images, fonts, etc.)
│
└── .env.local                    # Environment variables (API keys, etc.)
4. Data Flow & Communication Model
This is the core of the front-end/back-end separation. The client-side application will no longer contain the logic for fetching from external services. Instead, it will only communicate with its own backend API, which then acts as a secure proxy.
Flow Diagram:
code
Mermaid
sequenceDiagram
    participant User
    participant Browser as Browser (Client Components)
    participant NextServer as Next.js Server (API Routes)
    participant Gradio as External Gradio APIs
    participant BBC as BBC RSS Feed
    participant TTS as External TTS API

    User->>Browser: Loads page
    Browser->>NextServer: GET / (Initial Page Load)
    NextServer->>NextServer: GET /api/news (fetch news internally)
    NextServer->>BBC: Fetch RSS Feed
    BBC-->>NextServer: RSS XML
    NextServer-->>Browser: Sends fully rendered HTML (with news)

    User->>Browser: Clicks "Start News Cycle"
    Browser->>NextServer: POST /api/debate/tom (Get Tom's first response)
    NextServer->>Gradio: Call Tom's Gradio Model
    Gradio-->>NextServer: Tom's Text Response
    NextServer-->>Browser: { text: "..." }

    Note over Browser: Text received, now get audio...
    Browser->>NextServer: POST /api/tts (with Tom's text)
    NextServer->>TTS: Call Kokoro-TTS Service
    TTS-->>NextServer: Audio file URL
    NextServer-->>Browser: { audioSrc: "..." }

    Note over Browser: Play audio, and in parallel...
    Browser->>NextServer: POST /api/debate/mark (Pre-fetch Mark's response)
    NextServer->>Gradio: Call Mark's Gradio Model
    Gradio-->>NextServer: Mark's Text Response
    NextServer-->>Browser: { text: "..." }
Key Changes in Logic:
News Fetching (/api/news): The Next.js backend will fetch the BBC news feed. This allows us to implement server-side caching (e.g., refetch news only every 5 minutes), reducing redundant requests and improving performance.
Debate Logic (/api/debate/[speaker]): Instead of a single function, we'll use a dynamic route. The client will call /api/debate/tom, /api/debate/mark, etc. The backend route handler will receive the speaker's name, construct the correct prompt, and call the appropriate Gradio model.
TTS Logic (/api/tts): The client sends the text to /api/tts. The backend handles the round-robin logic and calls one of the Gradio TTS instances.
Client-Side Orchestration: The complex pipeline logic (the producer/consumer model) will remain on the client, likely encapsulated within a custom hook (useDebateManager). This hook will be responsible for managing the turnQueue and calling our internal API routes in the correct sequence.
5. State Management
We will maintain the current client-side state management approach using React's built-in hooks (useState, useRef, useEffect). For better organization and reusability, the entire debate state (messages, turn queue, running status, etc.) and the functions that modify it (handleStart, handleStop) will be consolidated into a custom useDebateManager hook. The main page.tsx will then be very clean, simply calling this hook to get all the data and handlers it needs to pass to the UI components.
6. Deployment on Vercel
This architecture is tailor-made for Vercel.
One-Click Deployment: Connecting the project's Git repository (e.g., on GitHub) to a Vercel project will enable automatic deployments on every push to the main branch.
Environment Variables: Any secret keys or external API URLs will be stored securely in Vercel's project settings, accessible via process.env in our backend API routes. They will not be exposed to the client-side browser.
Serverless Functions: Each file inside /app/api will be automatically deployed as an independent, auto-scaling serverless function, ensuring our backend is both efficient and resilient.