# DEBATEL

DEBATEL is a competitive debate ladder that combines real-time matchmaking, timed turns, and AI-powered judging into a single Next.js application. Players queue for speed or standard rounds, square off head-to-head over WebSockets, and receive instant scoring and feedback from an OpenAI judge.

## Features

- **Real-time multiplayer matchmaking** – Socket.io queues players by game type (ranked/practice), mode, and side, auto-pairing human opponents only.
- **Ranked & Practice modes** – Practice games for casual play, ranked matches require login for ELO tracking.
- **Timed debate experience** – Speed (30s) and Standard (60s) timers, turn enforcement, and real-time messaging between opponents.
- **AI judge scoring** – The `/api/judge` route submits both debate transcripts to OpenAI (GPT-4) and returns detailed scorecards with reasoning.
- **User authentication** – LocalStorage-based signup/login system with unique username enforcement.
- **Leaderboards & ratings** – Static leaderboard scaffold ready for ELO tracking integration.
- **Full-stack TypeScript** – Next.js App Router UI backed by a custom Node server that hosts Next app and Socket.io together.

**Important:** DEBATEL is **multiplayer-only**. You debate against real people online. The AI only serves as the judge, not as an opponent.

## Tech Stack

- [Next.js 16](https://nextjs.org/) App Router with React 19
- [Socket.io 4](https://socket.io/) for matchmaking and real-time debate updates
- [OpenAI API](https://platform.openai.com/docs) for scoring (chat.completions, GPT-4)
- Tailwind-inspired utility styling (see `app/globals.css`)
- Custom `server.js` to run Next + Socket.io on the same port (Railway-friendly)

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

**⚠️ CRITICAL:** If you cloned this from GitHub, the `.env.local` file is NOT included (for security).

You MUST create it manually:

```bash
# Create the file
touch .env.local

# Add your OpenAI API key
echo "OPENAI_API_KEY=sk-your-actual-key-here" > .env.local
```

Get your API key from: https://platform.openai.com/api-keys

The key should start with `sk-proj-` or `sk-`. Without this, the AI judge won't work.

### 3. Run the development server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to access the lobby, leaderboard, and debate flows. The Socket.io client connects back to the same origin, so no extra proxies are required in development.

### 4. Lint / build

```bash
npm run lint   # ESLint (app + server)
npm run build  # Next.js production build
npm run start  # Production server (uses server.js)
```

## Project Structure

```
app/
	page.tsx           # Landing page + CTA
	lobby/             # Matchmaking UI & queue logic
	debate/            # Debate experience (AI or H2H)
	leaderboard/       # Rankings shell
	contact/, login/, register/, etc.
app/api/judge/       # OpenAI scoring endpoint
lib/socket.tsx       # Socket.io client provider
server.js            # Next + Socket.io host
```

## Troubleshooting

### "AI judge isn't working" or "Scores seem random"

**Most common issue:** Missing `.env.local` file (happens when cloning from GitHub)

1. Verify the file exists: `ls -la .env.local`
2. If missing, create it: `touch .env.local`
3. Add your OpenAI key: `OPENAI_API_KEY=sk-your-actual-key-here`
4. Restart the server: Kill the process and run `npm run dev` again

The AI judge IS working if:
- Terminal shows: "Judging debate with AI..."
- You see detailed breakdown with reasoning at the end
- Scores are based on actual argument quality (not just random numbers)

### "Localhost doesn't work after cloning from GitHub"

When you clone the repo, several things are missing:

1. **Dependencies:** Run `npm install` first
2. **Environment file:** Create `.env.local` with your OpenAI key (see above)
3. **Start server:** Run `npm run dev`
4. **Check it's running:** Look for "Ready on http://0.0.0.0:3000"

### "Can't find opponents"

- This is **multiplayer-only** (no AI opponents)
- You need another real person online at the same time
- Both players must select the same game mode (Speed/Standard)
- Both must be in the same game type (Ranked/Practice)
- Open two browser tabs to test matchmaking yourself

### "Opponent responses look generic"

If you're testing with two tabs on the same computer, both are real people (you!). The debate page shows whatever arguments each person actually types. There are no pre-generated AI responses.

## Environment & Operations

- **OpenAI access** – The judge requires the `gpt-4` model. Update `app/api/judge/route.ts` if you prefer a different model.
- **Ports** – `server.js` binds to `0.0.0.0:${PORT || 3000}` to support Railway/Render-style hosts.
- **Contact** – Reach the team at [contact@debatel.com](mailto:contact@debatel.com) or via the in-app Contact page.

## Contributing

1. Fork and clone the repo.
2. Create a feature branch (`git checkout -b feature/my-improvement`).
3. Make changes + add tests or storybook coverage where helpful.
4. Run `npm run lint && npm run build` before opening a PR.

Thanks for helping make DEBATEL the fastest way to spar and improve your persuasive game.
