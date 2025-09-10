#!/bin/bash

# D&D Calendar Backend Start Script
echo "🌙 Starting D&D Calendar Backend..."

# Navigate to backend directory
cd /home/amke/calender-site/dnd-calendar/backend

# Stop existing PM2 process if running
pm2 stop dnd-calendar-backend 2>/dev/null || true
pm2 delete dnd-calendar-backend 2>/dev/null || true

# Wait a moment
sleep 2

# Start with PM2
pm2 start ecosystem.config.js

# Show status
pm2 status

echo "✅ Server started with PM2 auto-restart protection!"
echo "📊 Monitor: pm2 monit"
echo "📋 Logs: pm2 logs dnd-calendar-backend"