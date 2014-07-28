var Configs = {};

// PRODUCTION
Configs.production = {
  name: 'production',
  auth: { username: process.env['QUEUE_USERNAME'] || 'guest', password: process.env['QUEUE_PASSWORD'] || 'guest' },
  auth_enabled: true,
  port: process.env['QUEUE_PORT'] || '8989',
  max_history: 1000,
  message_log: './messages.log',
  message_logging_enabled: false
};

Configs.production.port = parseInt(Configs.production.port, 10);

// STAGING
Configs.staging = {
  name: 'staging',
  auth: { username: 'guest', password: 'guest' },
  auth_enabled: true,
  port: 8989,
  max_history: 1000,
  message_log: './messages.log',
  message_logging_enabled: false
};



module.exports = Configs;