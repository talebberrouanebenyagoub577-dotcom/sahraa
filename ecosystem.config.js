/**
 * SAHRAA PM2 Configuration
 * Alternative deployment without Docker (Node.js direct on VPS)
 *
 * Usage:
 *   npm run build
 *   npx prisma migrate deploy
 *   pm2 start ecosystem.config.js
 *   pm2 save && pm2 startup
 */

module.exports = {
  apps: [
    {
      name: "sahraa",
      script: "node_modules/next/dist/bin/next",
      args: "start",
      cwd: "/opt/sahraa",
      instances: "max",
      exec_mode: "cluster",
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      error_file: "/opt/sahraa/logs/pm2-error.log",
      out_file: "/opt/sahraa/logs/pm2-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
      kill_timeout: 5000,
      listen_timeout: 10000,
      // Graceful reload
      wait_ready: true,
      // Health check
      exp_backoff_restart_delay: 100,
      max_restarts: 10,
      min_uptime: "10s",
    },
  ],
};
