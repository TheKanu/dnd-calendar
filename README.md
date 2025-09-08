# 🌙 Aetherial Calender ✨

A fantasy D&D calendar application with real-time collaboration features.

## Features

- **Custom Fantasy Calendar**: 12 months, 44 days each, 8-day weeks
- **3 Moons with Phases**: Realistic lunar cycles
- **Session Management**: Separate campaigns with custom start dates
- **Party Tracking**: Drag & drop party groups across calendar days
- **Day Completion**: Mark days as completed (✅/⭕)
- **Real-time Sync**: WebSocket-based live synchronization
- **Dark Mode**: Beautiful dark theme
- **Responsive Design**: Works on mobile & desktop

## Calendar Structure

- **Year Length**: 528 days
- **Months**: 12 fantasy months with unique names
- **Weeks**: 8 days per week
- **Moons**: 3 moons with different cycle lengths
- **Default Start**: Year 1048

## Quick Start

### Development

```bash
npm run install:all
npm run dev
```

### Production (Docker)

```bash
docker-compose up -d
```

## Usage

1. **Create Session**: Choose session ID, name, start year/month
2. **Add Party Groups**: Create colored groups with names
3. **Drag & Drop**: Move party groups to calendar days
4. **Mark Progress**: Click ⭕ to mark days as completed ✅
5. **Dark Mode**: Toggle with 🌙 button

## Tech Stack

- **Frontend**: React + TypeScript
- **Backend**: Node.js + Express + Socket.io
- **Database**: SQLite
- **Real-time**: WebSocket synchronization

## API

- `GET /api/calendar/config` - Calendar configuration
- `POST /api/sessions` - Create session
- `GET /api/sessions/:id` - Get session info
- `POST /api/sessions/:id/groups` - Add party group
- `GET/POST/DELETE /api/sessions/:id/completed` - Day completion

---

Built for D&D campaigns and fantasy world timekeeping! 🎲