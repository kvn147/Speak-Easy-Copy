// PM2 Ecosystem Configuration for SpeakEasy
// This file defines how PM2 should run your applications

module.exports = {
  apps: [
    {
      name: 'speakeasy-next',
      script: 'npm',
      args: 'start',
      cwd: '/opt/speakeasy',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      error_file: '/var/log/speakeasy/next-error.log',
      out_file: '/var/log/speakeasy/next-out.log',
      log_file: '/var/log/speakeasy/next-combined.log',
      time: true,
    },
    {
      name: 'speakeasy-server',
      script: 'node_modules/.bin/tsx',
      args: 'server/index.ts',
      cwd: '/opt/speakeasy',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      error_file: '/var/log/speakeasy/server-error.log',
      out_file: '/var/log/speakeasy/server-out.log',
      log_file: '/var/log/speakeasy/server-combined.log',
      time: true,
    },
  ],
};
