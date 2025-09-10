module.exports = {
  apps: [{
    name: 'dnd-calendar-backend',
    script: 'server.js',
    cwd: '/home/amke/calender-site/dnd-calendar/backend',
    env: {
      NODE_ENV: 'production',
      PORT: 3002
    },
    instances: 1,
    exec_mode: 'fork',
    watch: false,
    max_memory_restart: '1G',
    restart_delay: 4000,
    max_restarts: 10,
    min_uptime: '10s',
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    autorestart: true,
    max_restarts: 15,
    restart_delay: 4000
  }]
};